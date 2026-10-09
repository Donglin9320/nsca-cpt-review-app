const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const guides = require('../study-guides.js');
const vm = require('node:vm');

test('all seven units have reviewed priorities and explanations', () => {
  assert.equal(Object.keys(guides.units).length, 7);
  for (const unit of Object.values(guides.units)) {
    assert.ok(unit.scope && unit.subunits.length >= 3);
    assert.ok(unit.keyPoints.length >= 4);
  }
  assert.ok(!guides.units.exercise_science.keyPoints.some(x => /心电图/.test(x)));
});
test('provided figures include correction notices and real local assets', () => {
  assert.equal(Object.keys(guides.figures).length, 3);
  for (const [src, figure] of Object.entries(guides.figures)) {
    assert.ok(figure.correction.length > 80);
    assert.ok(fs.existsSync(path.join(__dirname, '..', src)));
  }
});
test('question matching is conservative and does not change question data', () => {
  assert.equal(guides.figuresForQuestion({stem:'卧推的力臂如何变化？'}).length, 2);
  assert.equal(guides.figuresForQuestion({stem:'矢状面内的动作？'}).length, 1);
  assert.equal(guides.figuresForQuestion({stem:'水平如何评估？'}).length, 0);
  const question = {question:'肩关节水平内收属于哪个平面？',choices:{A:'横断面'},answer:'A'};
  const before = JSON.stringify(question);
  assert.equal(guides.figuresForQuestion(question).length, 1);
  assert.equal(JSON.stringify(question), before);
});
test('reviewed units cover the real syllabus and attach only existing figures', () => {
  const context = {window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../data.js'), 'utf8'), context);
  const data = context.window.NSCA_APP_DATA;
  assert.deepEqual([...data.syllabus.map(x=>x.id)].sort(), Object.keys(guides.units).sort());
  let matched = 0;
  for (const question of data.questions) {
    const images = guides.figuresForQuestion(question);
    if (images.length) matched++;
    for (const src of images) assert.ok(guides.figures[src]);
  }
  assert.ok(matched > 0);
  assert.equal(data.questions.length, 1438);
});
