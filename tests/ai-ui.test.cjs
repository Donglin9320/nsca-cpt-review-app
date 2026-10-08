const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

test('AI reuses exact prompt, supports regeneration, and isolates accounts', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
  let calls = 0;
  const context = {
    AbortController, setTimeout, clearTimeout,
    activeUserId: 'one',
    window: { NSCACloudSync: { getAccessToken: async () => 'token' } },
    fetch: async () => {
      calls++;
      return { ok: true, json: async () => ({ answer: `answer-${calls}`, model: 'test-model' }) };
    },
  };
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('const aiAnswerCache ='), source.indexOf('async function copyPromptAndOpen')), context);
  function button(prompt = 'question') {
    const content = {};
    const model = {};
    const box = { classList: { add() {}, remove() {} }, querySelector: () => model };
    const panel = { querySelector: selector => selector === '[data-kimi-answer]' ? box : content };
    return { textContent: '询问 AI 助教', disabled: false, dataset: { askKimi: prompt }, closest: () => panel, content };
  }
  const first = button();
  await Promise.all([context.askKimiDirectly(first), context.askKimiDirectly(first)]);
  assert.equal(calls, 1, 'double click must not duplicate model request');
  const revisit = button();
  await context.askKimiDirectly(revisit);
  assert.equal(calls, 1, 'revisit should need zero additional model requests');
  assert.equal(revisit.content.textContent, 'answer-1');
  await context.askKimiDirectly(revisit);
  assert.equal(calls, 2, 'regeneration must bypass cache');
  context.activeUserId = 'two';
  await context.askKimiDirectly(button());
  assert.equal(calls, 3, 'different account must not reuse cached explanation');
  await context.askKimiDirectly(button('different choice'));
  assert.equal(calls, 4, 'different prompt must not reuse explanation');
  vm.runInContext('for (const entry of aiAnswerCache.values()) entry.expires = 0;', context);
  await context.askKimiDirectly(button('different choice'));
  assert.equal(calls, 5, 'expired answer must regenerate');
});

test('AI deadline covers both missing response and stalled JSON body', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
  for (const stalledBody of [false, true]) {
    let expire;
    let signal;
    let cleared = false;
    const context = {
      AbortController,
      setTimeout(callback, delay) { assert.equal(delay, 55000); expire = callback; return 1; },
      clearTimeout() { cleared = true; },
      fetch: async (_, options) => {
        signal = options.signal;
        if (!stalledBody) return new Promise(() => {});
        return { ok: true, json: () => new Promise(() => {}) };
      },
    };
    vm.createContext(context);
    vm.runInContext(source.slice(source.indexOf('const aiAnswerCache ='), source.indexOf('async function copyPromptAndOpen')), context);
    const pending = context.requestAiAnswer('token', 'question');
    const rejected = assert.rejects(pending, /55 秒/);
    expire();
    await rejected;
    assert.equal(signal.aborted, true);
    assert.equal(cleared, true);
  }
});

test('gateway HTML errors have actionable timeout and quota messages', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
  for (const [status, message] of [[504, /超时/], [429, /受限/], [503, /503/]]) {
    const context = { AbortController, setTimeout, clearTimeout,
      fetch: async () => ({ ok: false, status, json: async () => { throw new Error('HTML response'); } }),
    };
    vm.createContext(context);
    vm.runInContext(source.slice(source.indexOf('const aiAnswerCache ='), source.indexOf('async function copyPromptAndOpen')), context);
    await assert.rejects(context.requestAiAnswer('token', 'question'), message);
  }
});
