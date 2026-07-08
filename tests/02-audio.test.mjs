/**
 * tests/02-audio.test.mjs — verify all 150 audio files are present.
 *
 * Catches:
 *  - Missing audio for any question (would cause silent playback failures at runtime)
 *  - Stray files in audio/ that are not qNNN.mp3 format
 *  - Mismatch between question count and audio file count
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { paths, audioIds } from './_helpers.mjs';

describe('audio coverage', () => {
  let audioIds;
  let questionsIds;

  before(async () => {
    const p = await paths();
    const data = await (await import('./_helpers.mjs')).readJson(p.questions);
    questionsIds = data.questions.map((q) => q.id).sort();
    audioIds = await (async () => {
      const ids = [];
      for (const f of await readdir(p.audio)) {
        const m = /^q(\d{3})\.mp3$/.exec(f);
        if (m) ids.push('q' + m[1].padStart(3, '0'));
      }
      return ids.sort();
    })();
  });

  it('exactly 150 audio files exist (q001..q150)', async () => {
    assert.equal(audioIds.length, 150, `expected 150 audio files, found ${audioIds.length}`);
    assert.equal(questionsIds.length, 150, `expected 150 questions, found ${questionsIds.length}`);
  });

  it('audio IDs and question IDs are identical sets', async () => {
    const a = new Set(audioIds);
    const q = new Set(questionsIds);
    const onlyInAudio = [...a].filter((x) => !q.has(x));
    const onlyInQuestions = [...q].filter((x) => !a.has(x));
    assert.deepEqual(onlyInAudio, [], `audio files with no matching question: ${onlyInAudio.join(', ')}`);
    assert.deepEqual(onlyInQuestions, [], `questions with no matching audio: ${onlyInQuestions.join(', ')}`);
  });

  it('audio IDs are contiguous q001..q150 (no gaps)', async () => {
    const nums = audioIds.map((id) => parseInt(id.slice(1), 10));
    for (let i = 0; i < 150; i++) {
      assert.equal(nums[i], i + 1, `gap at position ${i}: expected q${String(i + 1).padStart(3, '0')}, got ${audioIds[i]}`);
    }
  });

  it('no stray files in audio/ (only qNNN.mp3)', async () => {
    const p = await paths();
    const entries = await readdir(p.audio);
    const stray = entries.filter((f) => !/^q\d{3}\.mp3$/.test(f));
    assert.equal(stray.length, 0, `unexpected files in audio/: ${stray.join(', ')}`);
  });

  it('every audio file is non-empty (>1KB)', async () => {
    const p = await paths();
    for (const id of audioIds) {
      const full = join(p.audio, id + '.mp3');
      const s = await stat(full);
      assert.ok(s.size > 1024, `${id}.mp3 is too small (${s.size} bytes) — likely empty/broken TTS`);
    }
  });
});
