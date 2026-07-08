/**
 * tests/01-schema.test.mjs — validate data/questions.json shape and required fields.
 *
 * Catches:
 *  - Missing or extra fields on each question
 *  - Wrong number of options (must be exactly 4)
 *  - correctAnswer outside A/B/C/D
 *  - Missing explanation for any of A/B/C/D
 *  - Mismatch between questions.length and metadata.totalQuestions
 *  - Missing metadata fields
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readJson, paths } from './_helpers.mjs';

describe('questions.json schema', () => {
  it('has metadata with version, language, totalQuestions, topics', async () => {
    const p = await paths();
    const data = await readJson(p.questions);
    assert.ok(data.metadata, 'metadata is required');
    const m = data.metadata;
    assert.equal(typeof m.exam, 'string', 'metadata.exam');
    assert.equal(typeof m.version, 'string', 'metadata.version');
    assert.equal(typeof m.language, 'string', 'metadata.language');
    assert.equal(typeof m.totalQuestions, 'number', 'metadata.totalQuestions');
    assert.ok(Array.isArray(m.topics), 'metadata.topics must be array');
    assert.equal(m.topics.length, 11, 'must list exactly 11 topics');
  });

  it('metadata.totalQuestions matches questions.length', async () => {
    const p = await paths();
    const data = await readJson(p.questions);
    assert.equal(
      data.metadata.totalQuestions,
      data.questions.length,
      `metadata.totalQuestions=${data.metadata.totalQuestions} but questions.length=${data.questions.length}`
    );
  });

  it('every question has required fields', async () => {
    const p = await paths();
    const data = await readJson(p.questions);
    const required = ['id', 'topic', 'difficulty', 'question', 'options', 'correctAnswer', 'tip', 'explanations'];
    for (const q of data.questions) {
      for (const r of required) {
        assert.ok(r in q, `question ${q.id} is missing field "${r}"`);
      }
    }
  });

  it('difficulty is one of basico/básico / intermedio / avanzado', async () => {
    const p = await paths();
    const data = await readJson(p.questions);
    // Accept both accented and ASCII forms. New questions should use ASCII;
    // old (q001-q050) used accented "básico". See AGENTS.md §6.1.
    const allowed = new Set(['basico', 'básico', 'intermedio', 'avanzado']);
    for (const q of data.questions) {
      assert.ok(allowed.has(q.difficulty), `question ${q.id} has invalid difficulty "${q.difficulty}"`);
    }
  });

  it('every question has exactly 4 options A/B/C/D', async () => {
    const p = await paths();
    const data = await readJson(p.questions);
    const ids = new Set(['A', 'B', 'C', 'D']);
    for (const q of data.questions) {
      assert.equal(q.options.length, 4, `${q.id} has ${q.options.length} options, expected 4`);
      for (const o of q.options) {
        assert.ok(ids.has(o.id), `${q.id} option id "${o.id}" not in A/B/C/D`);
        assert.ok(typeof o.text === 'string' && o.text.length > 0, `${q.id} option ${o.id} has empty text`);
      }
    }
  });

  it('correctAnswer is one of A/B/C/D for every question', async () => {
    const p = await paths();
    const data = await readJson(p.questions);
    const allowed = new Set(['A', 'B', 'C', 'D']);
    for (const q of data.questions) {
      assert.ok(allowed.has(q.correctAnswer), `${q.id} correctAnswer="${q.correctAnswer}" not in A/B/C/D`);
    }
  });

  it('every question has explanations for all 4 options', async () => {
    const p = await paths();
    const data = await readJson(p.questions);
    for (const q of data.questions) {
      for (const id of ['A', 'B', 'C', 'D']) {
        assert.ok(id in q.explanations, `${q.id} missing explanation for ${id}`);
        assert.ok(typeof q.explanations[id] === 'string', `${q.id} explanation for ${id} must be string`);
        assert.ok(q.explanations[id].length > 0, `${q.id} explanation for ${id} is empty`);
      }
    }
  });

  it('every question has a non-empty tip', async () => {
    const p = await paths();
    const data = await readJson(p.questions);
    for (const q of data.questions) {
      assert.ok(typeof q.tip === 'string', `${q.id} tip must be string`);
      assert.ok(q.tip.length >= 20, `${q.id} tip too short (${q.tip.length} chars, expected >=20)`);
    }
  });

  it('every question belongs to a canonical topic', async () => {
    const p = await paths();
    const data = await readJson(p.questions);
    for (const q of data.questions) {
      assert.ok(
        ['App-ID', 'User-ID', 'Content-ID', 'Security Policies', 'NAT', 'VPN', 'Panorama',
         'HA', 'Decryption', 'WildFire', 'Troubleshooting'].includes(q.topic),
        `${q.id} has non-canonical topic "${q.topic}"`
      );
    }
  });
});
