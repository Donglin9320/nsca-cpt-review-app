const { test } = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/kimi');

test('NVIDIA request uses Kimi K3, returns final answer and handles retired models', async () => {
  const before = { ...process.env };
  const originalFetch = global.fetch;
  const originalInfo = console.info;
  const logs = [];
  console.info = line => logs.push(JSON.parse(line));
  try {
    Object.assign(process.env, { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'public', NVIDIA_API_KEY: 'test' });
    delete process.env.NVIDIA_MODEL;
    for (const [upstreamStatus, finishReason] of [[200, 'stop'], [200, 'length'], [410, null], [403, null], [429, null], [503, null]]) {
      global.fetch = async (url, options) => {
        if (url.includes('/auth/v1/user')) return { ok: true, json: async () => ({ email: 'test@example.com' }) };
        const body = JSON.parse(options.body);
        assert.equal(body.model, 'moonshotai/kimi-k3');
        assert.equal(body.reasoning_effort, 'low');
        assert.equal(body.top_p, 0.95);
        return { ok: upstreamStatus === 200, status: upstreamStatus, json: async () => ({ choices: [{ finish_reason: finishReason, message: { content: 'Final answer', reasoning_content: 'Not displayed' } }] }) };
      };
      const response = { setHeader() {}, status(code) { this.code = code; return this; }, end(body) { this.body = JSON.parse(body); } };
      await handler({ method: 'POST', headers: { authorization: 'Bearer test' }, body: { prompt: 'Explain this question' } }, response);
      assert.equal(response.code, finishReason === 'length' ? 502 : upstreamStatus === 200 ? 200 : upstreamStatus === 410 ? 503 : upstreamStatus === 429 ? 429 : 502);
      if (upstreamStatus === 200 && finishReason !== 'length') {
        assert.equal(response.body.answer, 'Final answer');
        assert.equal(response.body.model, 'moonshotai/kimi-k3');
      }
      assert.equal(response.body.retryable === true, upstreamStatus === 503);
    }
    assert.equal(logs.length, 6);
    for (const entry of logs) {
      assert.deepEqual(Object.keys(entry).sort(), ['event', 'stage', 'status', 'outcome', 'totalMs', 'authMs', 'modelMs'].sort());
      assert.equal(entry.stage, 'model');
    }
  } finally {
    console.info = originalInfo;
    global.fetch = originalFetch;
    for (const key of ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'NVIDIA_API_KEY', 'NVIDIA_MODEL']) {
      if (before[key] === undefined) delete process.env[key]; else process.env[key] = before[key];
    }
  }
});
