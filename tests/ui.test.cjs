const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const css = fs.readFileSync(path.join(__dirname, '../ui.css'), 'utf8');

function luminance(hex) {
  const values = hex.match(/[0-9a-f]{2}/gi).map(channel => {
    const value = parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}

test('reading and warning palette meets 4.5:1 on actual surfaces', () => {
  for (const [foreground, background] of [
    ['202428', 'f5f5f7'], ['535b62', 'f5f5f7'], ['535b62', 'fafafc'],
    ['ffffff', '0b6b43'], ['ffffff', '46584e'], ['862019', 'fff0ee'],
    ['064d25', 'd8f7e5'], ['7a160f', 'fde1dc'], ['6d3704', 'fff3e4'],
  ]) {
    const [dark, light] = [luminance(foreground), luminance(background)].sort((a, b) => a - b);
    assert.ok((light + 0.05) / (dark + 0.05) >= 4.5, `${foreground} on ${background}`);
  }
  assert.match(css, /--muted: #535b62/);
  assert.match(css, /color: #862019/);
});

test('reduced motion stops animation without removing status information', () => {
  const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.match(reduced, /animation: none !important/);
  assert.match(reduced, /transition: none !important/);
  assert.doesNotMatch(reduced, /display:\s*none|visibility:\s*hidden/);
  assert.doesNotMatch(css, /font-size:[^;]*vw/);
});
