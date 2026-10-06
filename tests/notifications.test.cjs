const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildMessage, dateKey } = require('../lib/study-notifications');
const handler = require('../api/study-notifications');
const now = new Date('2026-10-05T03:00:00Z'); // Sunday, October 4, 20:00 Vancouver.
const progress = answered => ({ game: { daily: { '2026-10-04': { answered, correct: 80 } } }, wrong: {} });

test('150 or more questions suppresses reminder; 149 leaves one', () => {
  assert.equal(buildMessage('daily', progress(150), now).shouldSend, false);
  assert.equal(buildMessage('daily', progress(151), now).shouldSend, false);
  assert.match(buildMessage('daily', progress(149), now).text, /还差 1 题/);
});
test('Vancouver dates handle UTC and DST rollover', () => {
  assert.equal(dateKey(now), '2026-10-04');
  assert.equal(dateKey(new Date('2026-11-01T08:30:00Z')), '2026-11-01');
  assert.equal(dateKey(new Date('2026-11-01T09:30:00Z')), '2026-11-01');
});
test('weekly report counts only this week and remaining notebook items', () => {
  const p = progress(150);
  p.game.daily['2026-09-27'] = { answered: 1000, correct: 1000 };
  p.wrong = { a: { unit: 'nutrition', lastAt: '2026-10-02T12:00:00Z' }, b: { unit: 'nutrition', lastAt: '2026-09-01T12:00:00Z' } };
  const message = buildMessage('weekly', p, now);
  assert.equal(message.period, '2026-09-28');
  assert.match(message.text, /练习：150 题/);
  assert.match(message.text, /运动营养学：1 题/);
});
test('no activity is not reported as zero percent accuracy', () => {
  assert.doesNotMatch(buildMessage('weekly', {}, now).text, /正确率/);
});
test('secret required with exact match', () => {
  const secret = 'x'.repeat(40);
  assert.equal(handler._test.authorized(`Bearer ${secret}`, secret), true);
  assert.equal(handler._test.authorized('Bearer wrong', secret), false);
  assert.equal(handler._test.authorized(undefined, secret), false);
});
test('endpoint rejects unauthenticated calls before accessing progress', async () => {
  const res = { setHeader() {}, status(code) { this.code = code; return this; }, end() {} };
  await handler({ method: 'POST', headers: {}, body: { action: 'prepare', kind: 'daily' } }, res);
  assert.equal(res.code, 401);
});

test('reservation prevents duplicate mail preparation and sent acknowledgment is scoped to owner', async () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;
  const secret = 'test-secret-'.repeat(4);
  const id = '11111111-1111-1111-1111-111111111111';
  let row = null;
  try {
    Object.assign(process.env, { N8N_NOTIFICATION_SECRET: secret, STUDY_NOTIFICATIONS_ENABLED: 'true', STUDY_NOTIFICATION_USER_ID: 'owner-1', SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'test' });
    global.fetch = async (url, options) => {
      let body;
      if (url.includes('/study_progress?')) { assert.match(url, /user_id=eq.owner-1/); body = [{ progress: {} }]; }
      else if (url.includes('/auth/v1/admin/users/')) body = { email: 'owner@example.com', email_confirmed_at: '2026-01-01' };
      else if (options.method === 'POST') {
        body = row ? [] : [{ id }]; row ||= { status: 'pending' };
      } else if (options.method === 'PATCH') {
        assert.match(url, /user_id=eq.owner-1&kind=eq.daily/);
        row.status = 'sent'; body = [row];
      } else body = [row];
      return { ok: true, status: 200, json: async () => body };
    };
    async function call(action) {
      const res = { setHeader() {}, status(code) { this.code = code; return this; }, end(text) { this.body = JSON.parse(text); } };
      await handler({ method: 'POST', headers: { authorization: `Bearer ${secret}` }, body: { action, kind: 'daily', deliveryId: id, user_id: 'attacker', to: 'ignored@example.com' } }, res);
      return res;
    }
    const first = await call('prepare');
    assert.equal(first.body.to, 'owner@example.com');
    assert.equal(first.body.shouldSend, true);
    assert.equal((await call('prepare')).code, 409);
    assert.equal((await call('delivered')).body.acknowledged, true);
    assert.equal((await call('prepare')).body.reason, 'already-sent');
  } finally {
    global.fetch = originalFetch;
    for (const key of ['N8N_NOTIFICATION_SECRET', 'STUDY_NOTIFICATIONS_ENABLED', 'STUDY_NOTIFICATION_USER_ID', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    }
  }
});
