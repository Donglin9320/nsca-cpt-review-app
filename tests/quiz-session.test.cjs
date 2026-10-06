const { test } = require('node:test');
const assert = require('node:assert/strict');
const { capture, restore } = require('../quiz-session');
const questions = ['a', 'b', 'c'].map(id => ({ id, unit: 'nutrition', choices: { A: 'one', B: 'two' } }));
test('random order, cursor and answer survive reload without reshuffling', () => {
  const state = { activeUnit: 'all', mode: 'random', queue: [questions[2], questions[0], questions[1]], index: 1, answeredChoice: 'B' };
  const result = restore(JSON.parse(JSON.stringify(capture(state))), questions, {});
  assert.deepEqual(result.queue.map(q => q.id), ['c', 'a', 'b']);
  assert.equal(result.index, 1);
  assert.equal(result.answeredChoice, 'B');
});
test('removed questions are dropped and new questions append to existing order', () => {
  const result = restore({ activeUnit: 'all', mode: 'random', queueIds: ['c', 'gone', 'a', 'a'], currentId: 'a' }, questions, {});
  assert.deepEqual(result.queue.map(q => q.id), ['c', 'a', 'b']);
  assert.equal(result.index, 1);
});
test('wrong mode restores only this accounts current mistakes', () => {
  const saved = { activeUnit: 'all', mode: 'wrong', queueIds: ['c', 'a', 'b'], currentId: 'a' };
  assert.deepEqual(restore(saved, questions, { b: {} }).queue.map(q => q.id), ['b']);
});
