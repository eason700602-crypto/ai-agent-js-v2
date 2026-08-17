import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate } from './calculator.js';

test('calculate() supports basic arithmetic expressions', () => {
  assert.equal(calculate({ expression: '2 + 3 * 4' }), 14);
  assert.equal(calculate({ expression: '(10 + 5) / 3' }), 5);
  assert.equal(calculate({ expression: '7 % 3' }), 1);
});

test('calculate() rejects unsafe input', () => {
  assert.throws(() => calculate({ expression: 'process.env' }), /unsafe/i);
  assert.throws(() => calculate({ expression: '1; process.exit(1)' }), /unsafe/i);
});
