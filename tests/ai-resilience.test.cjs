const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
const helperSource = source.slice(source.indexOf('const aiAnswerCache ='), source.indexOf('async function copyPromptAndOpen'));

function setup(fetch, storage = new Map(), extra = {}) {
  const context = { AbortController, setTimeout, clearTimeout, fetch,
    localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) }, ...extra };
  vm.createContext(context);
  vm.runInContext(helperSource, context);
  return context;
}
const success = () => ({ ok: true, json: async () => ({ answer: 'explanation', model: 'test' }) });
const fastTimers = {
  setTimeout: (callback, delay) => setTimeout(callback, delay === 55000 ? delay : 0),
};

test('transient errors retry once; permanent errors never retry', async () => {
  for (const kind of ['network', '502', '503', '400', '401', '403', '429', '504', 'retired']) {
    let calls = 0;
    const context = setup(async () => {
      calls++;
      if (calls > 1) return success();
      if (kind === 'network') throw new TypeError('network');
      return { ok: false, status: kind === 'retired' ? 503 : Number(kind),
        json: async () => ({ error: kind, retryable: kind !== 'retired' }) };
    }, new Map(), fastTimers);
    const retry = ['network', '502', '503'].includes(kind);
    if (retry) assert.equal((await context.requestAiAnswer('token', 'question')).answer, 'explanation');
    else await assert.rejects(context.requestAiAnswer('token', 'question'));
    assert.equal(calls, retry ? 2 : 1, kind);
  }
});

test('repeated transient errors stop at two attempts', async () => {
  let calls = 0;
  const context = setup(async () => { calls++; throw new TypeError('network'); }, new Map(), fastTimers);
  await assert.rejects(context.requestAiAnswer('token', 'question'));
  assert.equal(calls, 2);
});

test('retry shares original deadline and cannot start after deadline', async () => {
  let expire, retry, calls = 0, deadlines = 0;
  const context = setup(async () => { calls++; throw new TypeError('network'); }, new Map(), {
    setTimeout(callback, delay) { if (delay === 55000) { expire = callback; deadlines++; } else retry = callback; return 1; },
    clearTimeout() {},
  });
  const pending = context.requestAiAnswer('token', 'question');
  const rejected = assert.rejects(pending, /55 秒/);
  while (!retry) await new Promise(resolve => setImmediate(resolve));
  expire();
  retry();
  await rejected;
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 1);
  assert.equal(deadlines, 1);
});

test('slow failure is not retried when too little budget remains', async () => {
  let now = 0, calls = 0;
  const context = setup(async () => { calls++; now = 36000; throw new TypeError('network'); }, new Map(), { Date: { now: () => now } });
  await assert.rejects(context.requestAiAnswer('token', 'question'));
  assert.equal(calls, 1);
});

test('in-flight requests share within account, not across accounts, and clean up', async () => {
  const releases = [];
  let calls = 0;
  const context = setup(() => { calls++; return new Promise(resolve => releases.push(() => resolve(success()))); });
  const first = context.sharedAiAnswer('a', 'token-a', 'question');
  assert.equal(context.sharedAiAnswer('a', 'token-a', 'question'), first);
  const second = context.sharedAiAnswer('b', 'token-b', 'question');
  assert.notEqual(first, second);
  assert.equal(calls, 2);
  releases.forEach(release => release());
  await Promise.all([first, second]);
  const next = context.sharedAiAnswer('a', 'token-a', 'question');
  assert.equal(calls, 3);
  releases.at(-1)();
  await next;
});

test('cache persists across reload, expires, isolates accounts and caps size', () => {
  const storage = new Map();
  const context = setup(null, storage);
  context.saveAiCache('a', 'question', { answer: 'A', model: 'test' });
  const reloaded = setup(null, storage);
  assert.equal(reloaded.readAiCache('a', 'question').answer, 'A');
  assert.equal(reloaded.readAiCache('b', 'question'), null);
  assert.equal(reloaded.readAiCache('a', 'changed question'), null);
  const later = setup(null, storage, { Date: { now: () => Date.now() + 25 * 60 * 60 * 1000 } });
  assert.equal(later.readAiCache('a', 'question'), null);
  for (let i = 0; i < 55; i++) context.saveAiCache('a', `q${i}`, { answer: 'answer' });
  assert.equal(JSON.parse([...storage.values()][0]).length, 50);
  storage.set([...storage.keys()][0], '{broken');
  assert.equal(setup(null, storage).readAiCache('a', 'q54'), null);
});

test('storage failure does not discard a successful answer', () => {
  const context = setup(null, new Map(), { localStorage: { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); } } });
  context.saveAiCache('a', 'question', { answer: 'answer' });
  assert.equal(context.readAiCache('a', 'question').answer, 'answer');
});
