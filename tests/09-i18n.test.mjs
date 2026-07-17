/**
 * tests/09-i18n.test.mjs — banco EN + paridad con ES + prompts por clip.
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { paths, readJson } from './_helpers.mjs';
import {
  buildTtsPrompt, assertPromptIncludesOptions,
  buildClipPrompts, buildTipClipPrompts,
  QUESTION_CLIP_KEYS, TIP_CLIP_KEYS,
} from '../scripts/tts-prompt.mjs';

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

  it('buildClipPrompts emits stmt + 4 options for ES and EN', () => {
    const q = esBank.questions[0];
    const enRow = enBank.questions.find((r) => r.id === q.id);
    const esClips = buildClipPrompts(q, 'es', null);
    const enClips = buildClipPrompts(q, 'en', enRow);
    for (const k of QUESTION_CLIP_KEYS) {
      assert.ok(esClips[k]?.trim(), `ES clip ${k} missing`);
      assert.ok(enClips[k]?.trim(), `EN clip ${k} missing`);
    }
    assert.match(esClips.stmt, /^Pregunta 001\./);
    assert.match(enClips.stmt, /^Question 001\. Topic/);
    assert.match(esClips.A, /^Opcion A\./);
    assert.match(enClips.A, /^Option A\./);
  });

  it('buildTipClipPrompts emits ttip + correct/wrong + 4 explanations for ES and EN', () => {
    const q = esBank.questions[0];
    const enRow = enBank.questions.find((r) => r.id === q.id);
    for (const isCorrect of [true, false]) {
      const es = buildTipClipPrompts(q, 'es', null, isCorrect);
      const en = buildTipClipPrompts(q, 'en', enRow, isCorrect);
      for (const k of TIP_CLIP_KEYS) {
        assert.ok(es[k]?.trim(), `ES tip clip ${k} missing`);
        assert.ok(en[k]?.trim(), `EN tip clip ${k} missing`);
      }
      assert.match(es.ttip, /^Justificacion pregunta/);
      assert.match(en.ttip, /^Explanation for question/);
      // Coherencia: el clip "correct" / "wrong" anuncia explicitamente
      // la letra de la respuesta correcta (canónica), p.ej.
      //   ES: "Es correcta la opcion B."
      //   EN: "Yes, you are right. The correct answer is option B."
      const correctLetter = q.correctAnswer;
      assert.match(
        es.correct,
        new RegExp(`^Es correcta la opcion ${correctLetter}\\.$`),
        `ES correct should mention "${correctLetter}"`
      );
      assert.match(
        es.wrong,
        new RegExp(`^Es incorrecta\\. La respuesta correcta es la opcion ${correctLetter}\\.$`),
        `ES wrong should mention "${correctLetter}"`
      );
      assert.match(
        en.correct,
        new RegExp(`^Yes, you are right\\. The correct answer is option ${correctLetter}\\.$`),
        `EN correct should mention "${correctLetter}"`
      );
      assert.match(
        en.wrong,
        new RegExp(`^It is incorrect\\. The correct answer is option ${correctLetter}\\.$`),
        `EN wrong should mention "${correctLetter}"`
      );
      // EA = explicacion de la correcta (primera en narrarse).
      assert.match(
        es.EA,
        new RegExp(`^Opcion ${correctLetter}\\.`),
        `ES EA should narrate correct option ${correctLetter} first`
      );
      assert.match(
        en.EA,
        new RegExp(`^Option ${correctLetter}\\.`),
        `EN EA should narrate correct option ${correctLetter} first`
      );
    }
  });
});
