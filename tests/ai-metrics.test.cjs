const { test } = require('node:test');
const assert = require('node:assert/strict');
const { summarize } = require('../scripts/summarize-ai-logs.cjs');

test('AI metrics distinguish authentication, model failure, timeout and latency', () => {
  const base = { event: 'ai_request', stage: 'model' };
  const report = summarize([
    { ...base, outcome: 'success', totalMs: 5000, authMs: 100, modelMs: 4900 },
    { ...base, outcome: 'success', totalMs: 10000, authMs: 200, modelMs: 9800 },
    { ...base, outcome: 'timeout' },
    { ...base, outcome: 'error' },
    { ...base, stage: 'auth', outcome: 'error' },
  ]);
  assert.equal(report.modelAttempts, 4);
  assert.equal(report.authFailures, 1);
  assert.equal(report.modelSuccessRate, 0.5);
  assert.equal(report.modelTimeoutRate, 0.25);
  assert.deepEqual(report.successfulRequestMs, { p50: 5000, p95: 10000 });
  assert.equal(summarize([]).modelSuccessRate, null);
  assert.equal(summarize([]).successfulModelMs, null);
});
