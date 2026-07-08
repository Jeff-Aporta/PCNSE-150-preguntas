/**
 * tests/08-readme.test.mjs — verify project docs are consistent.
 *
 * Catches:
 *  - README mentioning stale `public/` directory (which doesn't exist in the repo)
 *  - README mentioning the wrong totalQuestions (we shipped 150, not 50)
 *  - README missing the canonical GitHub URL
 *  - package.json author / version stale
 *
 * See AGENTS.md §2 for the actual repo layout.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { paths, readJson } from './_helpers.mjs';

describe('docs consistency', () => {
  it('README does not reference the non-existent public/ directory', async () => {
    const p = await paths();
    const text = readFileSync(p.readme, 'utf8');
    // Strip fenced code blocks (those often DO mention public/ as illustrative)
    // We tolerate the literal string inside a code fence.
    const lines = text.split(/\r?\n/);
    let inFence = false;
    const violations = [];
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (/^```/.test(l.trim())) {
        inFence = !inFence;
        continue;
      }
      if (inFence) continue;
      if (/(^|[^`])public\//.test(l) && !/`public\/`/.test(l)) {
        violations.push(`line ${i + 1}: ${l.trim()}`);
      }
    }
    assert.deepEqual(violations, [], `README references public/ outside code fences:\n${violations.join('\n')}`);
  });

  it('README mentions the 150-question target', async () => {
    const p = await paths();
    const text = readFileSync(p.readme, 'utf8');
    assert.ok(/150\s+preguntas/.test(text), 'README should mention "150 preguntas"');
  });

  it('README references the correct GitHub repo URL (Jeff-Aporta, not jagudeloe)', async () => {
    const p = await paths();
    const text = readFileSync(p.readme, 'utf8');
    assert.ok(
      /Jeff-Aporta\/william-quest/.test(text),
      'README should reference Jeff-Aporta/william-quest as the canonical repo'
    );
  });

  it('package.json has name, version 2.x, description mentioning 150', async () => {
    const p = await paths();
    const pkg = await readJson(join(p.root, 'package.json'));
    assert.equal(pkg.name, 'william-quest');
    assert.match(pkg.version, /^2\./, `version should be 2.x, got ${pkg.version}`);
    assert.ok(/150/.test(pkg.description), `package.json description should mention 150, got: ${pkg.description}`);
  });

  it('package.json has a test script', async () => {
    const p = await paths();
    const pkg = await readJson(join(p.root, 'package.json'));
    assert.ok(pkg.scripts && typeof pkg.scripts.test === 'string', 'package.json missing scripts.test');
    assert.ok(
      /node\s+--test/.test(pkg.scripts.test),
      'package.json scripts.test should use node --test (or include it)'
    );
  });

  it('AGENTS.md exists and is non-empty', async () => {
    const p = await paths();
    const agentsPath = join(p.root, 'AGENTS.md');
    assert.ok(existsSync(agentsPath), 'AGENTS.md (the LLM-facing doc) is missing');
    const s = statSync(agentsPath);
    assert.ok(s.size > 1024, 'AGENTS.md is suspiciously small — did you actually write it?');
  });
});
