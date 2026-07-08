/**
 * tests/05-id-format.test.mjs — verify question IDs are well-formed and unique.
 *
 * Catches:
 *  - Duplicate IDs (would break loadQuestions filtering and audio lookup)
 *  - Gaps in id sequence (q005 present but q004 missing)
 *  - Wrong format (q1 instead of q001, uppercase, etc.)
 *  - Duplicate id in partial banks (caught at merge time)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { paths, readJson } from './_helpers.mjs';

describe('question id format', () => {
  it('every id matches /^q\\d{3}$/', async () => {
    const p = await paths();
    const data = await readJson(p.questions);
    const re = /^q\d{3}$/;
    for (const q of data.questions) {
      assert.ok(re.test(q.id), `id "${q.id}" does not match qNNN format`);
    }
  });

  it('all ids are unique', async () => {
    const p = await paths();
    const data = await readJson(p.questions);
    const seen = new Set();
    const dupes = [];
    for (const q of data.questions) {
      if (seen.has(q.id)) dupes.push(q.id);
      seen.add(q.id);
    }
    assert.deepEqual(dupes, [], `duplicate ids: ${dupes.join(', ')}`);
  });

  it('ids are contiguous q001..q150', async () => {
    const p = await paths();
    const data = await readJson(p.questions);
    const nums = data.questions
      .map((q) => q.id)
      .filter((s) => /^q\d{3}$/.test(s))
      .map((s) => parseInt(s.slice(1), 10))
      .sort((a, b) => a - b);

    assert.equal(nums.length, 150, `expected 150 well-formed ids, got ${nums.length}`);

    for (let i = 0; i < 150; i++) {
      assert.equal(nums[i], i + 1, `expected q${String(i + 1).padStart(3, '0')} at index ${i}, got q${String(nums[i]).padStart(3, '0')}`);
    }
  });

  it('ids are returned in sorted (q001 first) order when array is sorted', async () => {
    const p = await paths();
    const data = await readJson(p.questions);
    const sorted = [...data.questions].map((q) => q.id).sort();
    const expected = Array.from({ length: 150 }, (_, i) => `q${String(i + 1).padStart(3, '0')}`);
    assert.deepEqual(sorted, expected, 'ids are not perfectly contiguous when sorted');
  });
});
