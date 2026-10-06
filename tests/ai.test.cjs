const { test } = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/kimi');

test('NVIDIA request uses Kimi K3, returns final answer and handles retired models', async () => {
  const before = { ...process.env };
  const originalFetch = global.fetch;
  try {
    Object.assign(process.env, { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'public', NVIDIA_API_KEY: 'test' });
    delete process.env.NVIDIA_MODEL;
    for (const upstreamStatus of [200, 410, 403]) {
      global.fetch = async (url, options) => {
        if (url.includes('/auth/v1/user')) return { ok: true, json: async () => ({ email: 'test@example.com' }) };
        const body = JSON.parse(options.body);
        assert.equal(body.model, 'moonshotai/kimi-k3');
        assert.equal(body.reasoning_effort, 'low');
        return { ok: upstreamStatus === 200, status: upstreamStatus, json: async () => ({ choices: [{ message: { content: 'Final answer', reasoning_content: 'Not displayed' } }] }) };
      };
      const response = { setHeader() {}, status(code) { this.code = code; return this; }, end(body) { this.body = JSON.parse(body); } };
      await handler({ method: 'POST', headers: { authorization: 'Bearer test' }, body: { prompt: 'Explain this question' } }, response);
      assert.equal(response.code, upstreamStatus === 200 ? 200 : upstreamStatus === 410 ? 503 : 502);
      if (upstreamStatus === 200) {
        assert.equal(response.body.answer, 'Final answer');
        assert.equal(response.body.model, 'moonshotai/kimi-k3');
      }
    }
  } finally {
    global.fetch = originalFetch;
    for (const key of ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'NVIDIA_API_KEY', 'NVIDIA_MODEL']) {
      if (before[key] === undefined) delete process.env[key]; else process.env[key] = before[key];
    }
  }
});
