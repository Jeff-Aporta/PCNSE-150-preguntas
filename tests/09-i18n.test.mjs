/**
 * tests/09-i18n.test.mjs — banco EN + paridad con ES.
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { paths, readJson } from './_helpers.mjs';
import { buildTtsPrompt, assertPromptIncludesOptions } from '../scripts/tts-prompt.mjs';

const OPTION_IDS = ['A', 'B', 'C', 'D'];

describe('i18n — questions.en.json', () => {
  let esBank;
  let enBank;

  before(async () => {
    const p = await paths();
    esBank = await readJson(p.questions);
    enBank = await readJson(p.questionsEn);
  });

  it('exists with 150 translations', () => {
    assert.equal(enBank.questions?.length, 150);
    assert.equal(esBank.questions.length, 150);
  });

  it('EN ids match ES ids exactly', () => {
    const esIds = esBank.questions.map((q) => q.id).sort();
    const enIds = enBank.questions.map((q) => q.id).sort();
    assert.deepEqual(enIds, esIds);
  });

  it('every EN row has question, 4 options, tip, 4 explanations', () => {
    for (const row of enBank.questions) {
      assert.match(row.id, /^q\d{3}$/, `${row.id}: bad id`);
      assert.ok(row.question?.trim(), `${row.id}: missing question`);
      assert.equal(row.options?.length, 4, `${row.id}: need 4 options`);
      const optIds = row.options.map((o) => o.id).sort().join('');
      assert.equal(optIds, 'ABCD', `${row.id}: options must be A-D`);
      assert.ok(row.tip?.trim(), `${row.id}: missing tip`);
      for (const L of OPTION_IDS) {
        assert.ok(row.explanations?.[L]?.trim(), `${row.id}: missing explanation ${L}`);
      }
    }
  });

  it('TTS prompts for ES and EN include all four options (shared script)', () => {
    const q = esBank.questions[0];
    const enRow = enBank.questions.find((r) => r.id === q.id);
    const esPrompt = buildTtsPrompt(q, 'es');
    const enPrompt = buildTtsPrompt(q, 'en', enRow);
    assertPromptIncludesOptions(esPrompt, 'es');
    assertPromptIncludesOptions(enPrompt, 'en');
    assert.match(esPrompt, /^Pregunta 001\./);
    assert.match(enPrompt, /^Question 001\. Topic/);
  });
});
