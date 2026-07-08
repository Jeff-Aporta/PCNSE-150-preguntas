/**
 * tests/04-distribution.test.mjs — verify topic distribution and overall coverage.
 *
 * Catches:
 *  - Topic distribution drift (e.g., someone adds 20 questions all to "App-ID")
 *  - Forgotten merge (questions in src/data not in main bank)
 *  - metadata.topics out of sync with the actual topics used
 *  - Imbalance outside reasonable bounds
 *
 * Tolerance: each topic must have >= 5 questions and <= 35. Total must be 150.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { paths, readJson, CANONICAL_TOPICS, CANONICAL_TOPIC_SET } from './_helpers.mjs';

describe('topic distribution', () => {
  it('each canonical topic has between 5 and 35 questions', async () => {
    const p = await paths();
    const data = await readJson(p.questions);
    const counts = new Map();
    for (const q of data.questions) counts.set(q.topic, (counts.get(q.topic) ?? 0) + 1);

    for (const t of CANONICAL_TOPICS) {
      const c = counts.get(t) ?? 0;
      assert.ok(
        c >= 5 && c <= 35,
        `topic "${t}" has ${c} questions; must be in [5, 35] for balanced simulator`
      );
    }
  });

  it('metadata.topics includes exactly the canonical 11 topics', async () => {
    const p = await paths();
    const data = await readJson(p.questions);
    assert.deepEqual(
      [...data.metadata.topics].sort(),
      [...CANONICAL_TOPICS].sort(),
      'metadata.topics must list exactly the 11 canonical topics'
    );
  });

  it('no question has a topic outside the canonical 11', async () => {
    const p = await paths();
    const data = await readJson(p.questions);
    for (const q of data.questions) {
      assert.ok(
        CANONICAL_TOPIC_SET.has(q.topic),
        `question ${q.id} has non-canonical topic "${q.topic}"`
      );
    }
  });

  it('distribution sums to 150', async () => {
    const p = await paths();
    const data = await readJson(p.questions);
    const counts = new Map();
    for (const q of data.questions) counts.set(q.topic, (counts.get(q.topic) ?? 0) + 1);
    const sum = [...counts.values()].reduce((a, b) => a + b, 0);
    assert.equal(sum, 150, `topic distribution sums to ${sum}, expected 150`);
  });
});
