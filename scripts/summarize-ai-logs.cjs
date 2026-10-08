const readline = require('node:readline');

function summarize(events) {
  const requests = events.filter(event => event?.event === 'ai_request');
  const model = requests.filter(event => event.stage === 'model');
  const successes = model.filter(event => event.outcome === 'success');
  const timeouts = model.filter(event => event.outcome === 'timeout');
  const duration = key => {
    const values = successes.map(event => event[key]).filter(value => Number.isFinite(value) && value >= 0).sort((a, b) => a - b);
    return values.length ? { p50: values[Math.ceil(values.length * 0.5) - 1], p95: values[Math.ceil(values.length * 0.95) - 1] } : null;
  };
  return {
    requests: requests.length,
    authFailures: requests.filter(event => event.stage === 'auth' && event.outcome !== 'success').length,
    modelAttempts: model.length,
    modelSuccessRate: model.length ? successes.length / model.length : null,
    modelTimeoutRate: model.length ? timeouts.length / model.length : null,
    successfulRequestMs: duration('totalMs'),
    successfulAuthMs: duration('authMs'),
    successfulModelMs: duration('modelMs'),
  };
}

module.exports = { summarize };
if (require.main === module) {
  const events = [];
  let invalidLines = 0;
  const lines = readline.createInterface({ input: process.stdin });
  lines.on('line', line => {
    if (!line.trim()) return;
    try { events.push(JSON.parse(line)); } catch { invalidLines++; }
  });
  lines.on('close', () => process.stdout.write(JSON.stringify({ ...summarize(events), invalidLines }, null, 2) + '\n'));
}
