const { timingSafeEqual } = require('node:crypto');
const { buildMessage } = require('../lib/study-notifications');

function send(res, code, body) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(code).end(JSON.stringify(body));
}

function authorized(header, secret) {
  if (!secret || secret.length < 32 || typeof header !== 'string') return false;
  const actual = Buffer.from(header);
  const expected = Buffer.from(`Bearer ${secret}`);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { error: 'POST required' });
  }
  if (!authorized(req.headers.authorization, process.env.N8N_NOTIFICATION_SECRET)) {
    return send(res, 401, { error: 'Unauthorized' });
  }
  if (process.env.STUDY_NOTIFICATIONS_ENABLED !== 'true') {
    return send(res, 200, { shouldSend: false, reason: 'disabled' });
  }
  const { action, kind, deliveryId } = req.body || {};
  if (!['prepare', 'delivered'].includes(action) || !['daily', 'weekly'].includes(kind)) {
    return send(res, 400, { error: 'Invalid action or kind' });
  }
  const owner = process.env.STUDY_NOTIFICATION_USER_ID;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!owner || !url || !key) return send(res, 503, { error: 'Notification configuration incomplete' });

  async function request(route, options = {}) {
    const response = await fetch(`${url.replace(/\/$/, '')}${route}`, {
      ...options,
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...options.headers },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Supabase status ${response.status}`);
    return response.status === 204 ? null : response.json();
  }

  try {
    if (action === 'delivered') {
      if (typeof deliveryId !== 'string' || !/^[0-9a-f-]{36}$/i.test(deliveryId)) {
        return send(res, 400, { error: 'Invalid delivery ID' });
      }
      const rows = await request(`/rest/v1/study_notification_deliveries?id=eq.${deliveryId}&user_id=eq.${encodeURIComponent(owner)}&kind=eq.${kind}`, {
        method: 'PATCH', headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ status: 'sent', sent_at: new Date().toISOString() }),
      });
      return send(res, rows.length ? 200 : 404, { acknowledged: Boolean(rows.length) });
    }
    const rows = await request(`/rest/v1/study_progress?user_id=eq.${encodeURIComponent(owner)}&select=progress&limit=1`);
    if (!rows[0]?.progress) return send(res, 200, { shouldSend: false, reason: 'no-synced-progress' });
    const message = buildMessage(kind, rows[0].progress);
    if (!message.shouldSend) return send(res, 200, message);
    const account = await request(`/auth/v1/admin/users/${encodeURIComponent(owner)}`);
    if (!account.email || !account.email_confirmed_at) {
      return send(res, 409, { error: 'Owner needs a verified account email' });
    }
    // A unique DB key arbitrates concurrent executions before any email can be sent.
    const claimed = await request('/rest/v1/study_notification_deliveries?on_conflict=user_id,kind,period', {
      method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
      body: JSON.stringify({ user_id: owner, kind, period: message.period }),
    });
    if (!claimed.length) {
      const previous = await request(`/rest/v1/study_notification_deliveries?user_id=eq.${encodeURIComponent(owner)}&kind=eq.${kind}&period=eq.${message.period}&select=status`);
      if (previous[0]?.status === 'sent') return send(res, 200, { shouldSend: false, reason: 'already-sent' });
      return send(res, 409, { error: 'Delivery pending: inspect n8n execution and mail provider before retrying' });
    }
    return send(res, 200, { ...message, to: account.email, deliveryId: claimed[0].id });
  } catch {
    return send(res, 502, { error: 'Notification preparation failed; inspect Supabase and n8n execution. No automatic resend.' });
  }
};

module.exports._test = { authorized };
