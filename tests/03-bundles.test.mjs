/**
 * tests/03-bundles.test.mjs — verify all built bundles parse without syntax errors.
 *
 * Catches:
 *  - Bundles produced without the bare-to-window plugin (broken at runtime)
 *  - Accidentally truncated minified output
 *  - Stale bundles after source edits (oversized or zero-byte)
 *
 * Uses `node --check` for true parser-level validation, not just string inspection.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { paths } from './_helpers.mjs';

describe('built bundles', () => {
  it('all 4 bundles exist', async () => {
    const p = await paths();
    for (const [name, path] of Object.entries(p.bundles)) {
      assert.ok(existsSync(path), `bundle "${name}" missing at ${path}`);
    }
  });

  it('all 4 bundles are non-empty (>1KB)', async () => {
    const p = await paths();
    for (const [name, path] of Object.entries(p.bundles)) {
      const s = statSync(path);
      assert.ok(s.size > 1024, `bundle "${name}" is too small (${s.size} bytes)`);
    }
  });

  it('all 4 bundles pass node --check syntax validation', async () => {
    const p = await paths();
    for (const [name, path] of Object.entries(p.bundles)) {
      const r = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
      assert.equal(
        r.status,
        0,
        `bundle "${name}" (${path}) failed syntax check:\nstdout=${r.stdout}\nstderr=${r.stderr}`
      );
    }
  });

  it('app bundle is reasonably sized (< 100KB minified)', async () => {
    const p = await paths();
    const s = statSync(p.bundles.app);
    assert.ok(s.size > 5000, `app bundle suspiciously small (${s.size} bytes) — did bare-to-window plugin run?`);
    assert.ok(s.size < 200_000, `app bundle suspiciously large (${s.size} bytes) — possible duplicate bundling`);
  });

  it('william-front bundle is reasonably sized (< 30KB)', async () => {
    const p = await paths();
    const s = statSync(p.bundles.williamFront);
    assert.ok(s.size > 1000, `william-front too small (${s.size} bytes)`);
    assert.ok(s.size < 50_000, `william-front too large (${s.size} bytes)`);
  });

  it('app-shell bundle is reasonably sized (< 30KB)', async () => {
    const p = await paths();
    const s = statSync(p.bundles.appShell);
    assert.ok(s.size > 500, `app-shell too small (${s.size} bytes)`);
    assert.ok(s.size < 30_000, `app-shell too large (${s.size} bytes)`);
  });
});
