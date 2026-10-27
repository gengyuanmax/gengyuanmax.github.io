import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// print-rules must recognise paper (colour and grain) from the live tokens. A hard-coded
// paper colour turned every paper-backed box into a page-sized ink mask and froze the page.
test('print-rules reads paper from tokens, not literals', () => {
  const src = readFileSync(new URL('../src/client/print-rules.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /rgb\\?\(\d+, ?\d+, ?\d+\\?\)\$/, 'no literal paper rgb in ink()');
  assert.match(src, /var\(--paper\)/);
  assert.match(src, /--paper-grain-image/);
});
