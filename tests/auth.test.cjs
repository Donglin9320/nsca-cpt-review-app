const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function setup(fetch, hash = '', expiresAt = Date.now() + 3600000) {
  const key = 'nsca-cpt:supabase-session';
  const storage = new Map([[key, JSON.stringify({ access_token: 'test', refresh_token: 'test-refresh', expires_at: expiresAt })]]);
  const statuses = [];
  const location = { hash, origin: 'https://example.com', pathname: '/', search: '', assign(url) { this.destination = url; } };
  const window = { location, alert() {}, NSCA_CLOUD_CONFIG: { supabaseUrl: 'https://example.supabase.co', supabaseAnonKey: 'public' } };
  const context = { window, location, URL, URLSearchParams, setTimeout, clearTimeout, fetch,
    history: { replaceState() { location.hash = ''; } },
    localStorage: { getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../cloud-sync.js'), 'utf8'), context);
  return { cloud: window.NSCACloudSync, location, storage, key, statuses,
    init: () => window.NSCACloudSync.init({ getProgress: () => ({}), setProgress() {}, onStatus: s => statuses.push(s) }) };
}

test('Google login uses Supabase authorize and returns to the app', () => {
  const env = setup();
  env.cloud.signInWithGoogle();
  const url = new URL(env.location.destination);
  assert.equal(url.pathname, '/auth/v1/authorize');
  assert.equal(url.searchParams.get('provider'), 'google');
  assert.equal(url.searchParams.get('redirect_to'), 'https://example.com/');
});

test('local HTML cannot redirect OAuth back to file or null origin', () => {
  for (const origin of ['null', 'file://']) {
    const env = setup();
    env.location.origin = origin;
    env.location.pathname = '/Users/example/Desktop/app/index.html';
    assert.throws(() => env.cloud.signInWithGoogle(), /本地 HTML 文件/);
    assert.equal(env.location.destination, undefined);
    assert.ok(env.storage.has(env.key));
  }
});

test('temporary user lookup failure preserves session', async () => {
  const env = setup(async () => { throw new Error('offline'); });
  await env.init();
  assert.ok(env.storage.has(env.key));
  assert.equal(env.statuses.at(-1).value, 'error');
});

test('successful 201 minimal upsert does not parse an empty body', async () => {
  let written = false;
  const env = setup(async (url, options) => {
    if (url.endsWith('/auth/v1/user')) return { ok: true, json: async () => ({ id: 'user-1' }) };
    if (options.method === 'POST') {
      written = true;
      assert.match(options.headers.Prefer, /return=minimal/);
      return { ok: true, status: 201, json: async () => { throw new SyntaxError('Unexpected end of JSON input'); } };
    }
    return { ok: true, json: async () => [] };
  });
  await env.cloud.init({ getProgress: () => ({ _ownerId: 'user-1', wrong: { q1: {} } }), setProgress() {}, onStatus: s => env.statuses.push(s) });
  assert.equal(written, true);
  assert.equal(env.statuses.at(-1).value, 'synced');
});

test('temporary refresh failure preserves session', async () => {
  const env = setup(async () => ({ ok: false, status: 503, json: async () => ({}) }), '', 0);
  await env.init();
  assert.ok(env.storage.has(env.key));
  assert.equal(env.statuses.at(-1).value, 'error');
});

test('invalid session is cleared', async () => {
  const env = setup(async () => ({ ok: false, status: 401, json: async () => ({}) }));
  await env.init();
  assert.equal(env.storage.has(env.key), false);
  assert.equal(env.statuses.at(-1).value, 'signed-out');
});

test('OAuth cancellation is visible and removed from URL', async () => {
  const env = setup(() => { throw new Error('unexpected fetch'); }, '#error=access_denied');
  await env.init();
  assert.equal(env.statuses.at(-1).value, 'error');
  assert.equal(env.location.hash, '');
});

test('Google callback restores session and reads progress for authenticated user', async () => {
  let restored;
  const env = setup(async url => {
    if (url.endsWith('/auth/v1/user')) return { ok: true, json: async () => ({ id: 'user-1' }) };
    assert.ok(url.includes('user_id=eq.user-1'));
    return { ok: true, json: async () => [{ updated_at: '2026-10-05T00:00:00Z', progress: { wrong: { q1: true } } }] };
  }, '#access_token=google-test&refresh_token=refresh&expires_in=3600');
  await env.cloud.init({ getProgress: () => ({}), setProgress: p => { restored = p; }, onStatus() {} });
  assert.equal(await env.cloud.getAccessToken(), 'google-test');
  assert.equal(restored.wrong.q1, true);
  assert.equal(env.location.hash, '');
});

test('API distinguishes Supabase outage from an invalid login', async () => {
  const handler = require('../api/kimi.js');
  const originalFetch = global.fetch;
  const originalEnv = { ...process.env };
  try {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_PUBLISHABLE_KEY = 'public';
    process.env.NVIDIA_API_KEY = 'test';
    for (const [upstream, expected] of [[503, 503], [401, 401]]) {
      global.fetch = async () => ({ ok: false, status: upstream });
      const response = { status(code) { this.code = code; return this; }, setHeader() {}, end(body) { this.body = JSON.parse(body); } };
      await handler({ method: 'POST', body: { prompt: 'test' }, headers: { authorization: 'Bearer test' } }, response);
      assert.equal(response.code, expected);
    }
  } finally {
    global.fetch = originalFetch;
    for (const key of ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'NVIDIA_API_KEY']) {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    }
  }
});

test('account is selected before reading local progress and foreign snapshot is not uploaded', async () => {
  const events = [];
  const env = setup(async (url, options) => {
    if (url.endsWith('/auth/v1/user')) return { ok: true, json: async () => ({ id: 'account-b' }) };
    assert.notEqual(options.method, 'POST', 'must not upload account-a snapshot as account-b');
    return { ok: true, json: async () => [] };
  });
  await env.cloud.init({
    onUser: user => events.push(user.id),
    getProgress: () => { events.push('read-cache'); return { _ownerId: 'account-a', wrong: { old: {} } }; },
    setProgress() {}, onStatus() {},
  });
  assert.deepEqual(events, ['account-b', 'read-cache']);
});

test('sign out while remote read is pending cannot restore the previous account', async () => {
  let release;
  const env = setup(async url => {
    if (url.endsWith('/auth/v1/user')) return { ok: true, json: async () => ({ id: 'account-a' }) };
    return new Promise(resolve => { release = () => resolve({ ok: true, json: async () => [{ progress: { wrong: { old: {} } }, updated_at: new Date().toISOString() }] }); });
  });
  let restored = false;
  const initializing = env.cloud.init({ onUser() {}, getProgress: () => ({}), setProgress: () => { restored = true; }, onStatus() {} });
  while (!release) await new Promise(resolve => setImmediate(resolve));
  env.cloud.signOut();
  release();
  await initializing;
  assert.equal(restored, false);
  assert.equal(env.cloud.isSignedIn(), false);
});
