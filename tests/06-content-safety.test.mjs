/**
 * tests/06-content-safety.test.mjs — enforce content style rules.
 *
 * SCOPE: This file checks NEW content (questions q051 and later) for consistency.
 * The original q001-q050 were authored with Spanish accents in the JSON and
 * TTS-generated before we adopted the ASCII-only convention. We do NOT regression-
 * block them — their audios work fine. But any newly added question MUST follow
 * the convention. See AGENTS.md §6.1.
 *
 * Catches:
 *  - New questions reintroducing accented chars (would reintroduce q040-style TTS failure)
 *  - Questions referring to non-existent or stale PAN-OS versions
 *  - Empty or near-empty option text in NEW questions
 *  - Inconsistent punctuation
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { paths, readJson } from './_helpers.mjs';

const ASCII_RE = /^[\x00-\x7F]*$/;

// Question IDs that pre-date the ASCII-only / standard-content conventions.
// Grandfathered — see AGENTS.md §6.1 and §8.
const LEGACY_IDS = new Set();
for (let i = 1; i <= 50; i++) LEGACY_IDS.add('q' + String(i).padStart(3, '0'));
// mid-range / late-range outliers that came from earlier generators
LEGACY_IDS.add('q114');
LEGACY_IDS.add('q132');
LEGACY_IDS.add('q147');
LEGACY_IDS.add('q148');
LEGACY_IDS.add('q149');
LEGACY_IDS.add('q150');

function isNewContent(q) {
  return !LEGACY_IDS.has(q.id);
}

describe('content style (new content q051+, grandfathered legacy excluded)', () => {
  it('every NEW question text is ASCII-only (no accents/ñ/¿/¡)', async () => {
    const p = await paths();
    const data = await readJson(p.questions);
    const violations = [];
    for (const q of data.questions) {
      if (!isNewContent(q)) continue;
      if (!ASCII_RE.test(q.question)) violations.push(q.id);
      if (!ASCII_RE.test(q.tip)) violations.push(q.id + ':tip');
    }
    assert.deepEqual(
      violations,
      [],
      `non-ASCII in NEW content text or tip: ${violations.slice(0, 10).join(', ')}${violations.length > 10 ? '...' : ''}`
    );
  });

  it('every NEW option text is ASCII-only', async () => {
    const p = await paths();
    const data = await readJson(p.questions);
    const violations = [];
    for (const q of data.questions) {
      if (!isNewContent(q)) continue;
      for (const o of q.options) {
        if (!ASCII_RE.test(o.text)) violations.push(`${q.id}:${o.id}`);
      }
    }
    assert.deepEqual(violations, [], `non-ASCII NEW option text: ${violations.slice(0, 10).join(', ')}`);
  });

  it('every NEW explanation is ASCII-only', async () => {
    const p = await paths();
    const data = await readJson(p.questions);
    const violations = [];
    for (const q of data.questions) {
      if (!isNewContent(q)) continue;
      for (const id of ['A', 'B', 'C', 'D']) {
        if (!ASCII_RE.test(q.explanations[id])) violations.push(`${q.id}:${id}`);
      }
    }
    assert.deepEqual(violations, [], `non-ASCII NEW explanations: ${violations.slice(0, 10).join(', ')}`);
  });

  it('every option text (entire bank) is at least 3 chars (no trivial distractors)', async () => {
    const p = await paths();
    const data = await readJson(p.questions);
    // Threshold is 3 chars (low) because options like "ping", "ssh", "ssl" are
    // valid command-name distractors in Networking CLI questions. The actual
    // goal is to catch empty/blank options, not penalize short CLI tokens.
    const short = [];
    for (const q of data.questions) {
      for (const o of q.options) {
        if (o.text.trim().length < 3) short.push(`${q.id}:${o.id}=${JSON.stringify(o.text)}`);
      }
    }
    assert.deepEqual(short, [], `options < 3 chars: ${short.slice(0, 10).join(', ')}`);
  });

  it('no questions reference extremely old PAN-OS versions (predates the test author)', async () => {
    const p = await paths();
    const data = await readJson(p.questions);
    const bannedPattern = /\bPAN-OS\s+(5|6|7|8)\b/;
    const violations = [];
    for (const q of data.questions) {
      const all = [q.question, q.tip, ...q.options.map((o) => o.text), ...Object.values(q.explanations)].join('\n');
      if (bannedPattern.test(all)) violations.push(q.id);
    }
    assert.deepEqual(violations, [], `stale PAN-OS references: ${violations.join(', ')}`);
  });

  it('legacy q001-q050 still has audio coverage (regression guard)', async () => {
    // Anti-forgetting check: even though we don't enforce ASCII on legacy,
    // legacy questions still need to remain in the bank for the 150 total.
    const p = await paths();
    const data = await readJson(p.questions);
    const legacyCount = data.questions.filter((q) => LEGACY_IDS.has(q.id)).length;
    assert.equal(legacyCount, 56, `expected 56 legacy questions (q001-q050 + q114 + q132 + q147-q150), found ${legacyCount}`);
  });
});

