/**
 * tests/07-workflow.test.mjs — verify GitHub Actions workflow is correct.
 *
 * Catches:
 *  - Workflow regressing to inline esbuild CLI (no bare-to-window plugin)
 *  - Workflow triggering on the wrong branch (e.g., "master" instead of "main")
 *  - Workflow missing the necessary permissions (pages: write)
 *  - Malformed YAML
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { paths } from './_helpers.mjs';

// Minimal YAML loader using a regex-based approach. We don't need full YAML,
// only top-level keys and a couple of nested details.
function loadMinimalYaml(text) {
  const lines = text.split(/\r?\n/);
  const result = {};
  let currentSection = null;
  for (const raw of lines) {
    const line = raw.replace(/#.*$/, ''); // strip comments
    if (!line.trim()) continue;
    // detect section nesting by leading spaces
    const leading = line.match(/^(\s*)/)[1].length;
    const m = /^(\w[\w-]*):\s*(.*)$/.exec(line.trimEnd());
    if (!m) continue;
    if (leading === 0) {
      currentSection = m[1];
      result[currentSection] = m[2] ? m[2] : {};
    } else if (leading === 2 && currentSection) {
      // subkey
      if (typeof result[currentSection] !== 'object') result[currentSection] = {};
      const [, key, val] = m;
      // try to eval the value (lists, scalars, etc.)
      if (val === '') result[currentSection][key] = {};
      else if (/^\[/.test(val)) {
        try { result[currentSection][key] = JSON.parse(val.replace(/'/g, '"')); }
        catch { result[currentSection][key] = val; }
      } else result[currentSection][key] = val;
    }
  }
  return result;
}

describe('GitHub Actions workflow', () => {
  it('deploy-ghpages.yml exists', async () => {
    const p = await paths();
    assert.ok(existsSync(p.workflow), `${p.workflow} missing`);
  });

  it('is valid YAML (parseable as text)', async () => {
    const p = await paths();
    const text = readFileSync(p.workflow, 'utf8');
    assert.ok(text.length > 50, 'workflow file too small');
    assert.ok(/^name:/m.test(text), 'workflow missing top-level name:');
    assert.ok(/^on:/m.test(text), 'workflow missing top-level on:');
  });

  it('triggers on push to the main branch', async () => {
    const p = await paths();
    const text = readFileSync(p.workflow, 'utf8');
    // Look for branches: [main] or branches: ["main"] under push:
    assert.ok(
      /branches:\s*\[?\s*main\s*\]?/i.test(text),
      'workflow must listen for pushes to the "main" branch (not master)'
    );
  });

  it('uses node scripts/build.mjs (with bare-to-window plugin)', async () => {
    const p = await paths();
    const text = readFileSync(p.workflow, 'utf8');
    assert.ok(
      /node\s+scripts\/build\.mjs/.test(text),
      'workflow must run `node scripts/build.mjs` to apply the bare-to-window plugin.\n' +
        'Earlier we had `npx esbuild ... --external:react` which produced broken bundles.\n' +
        'See AGENTS.md §6.3.'
    );
    assert.ok(
      !/--external:react/.test(text),
      'workflow contains the deprecated/incorrect --external:react flag. Re-run through scripts/build.mjs.'
    );
  });

  it('requests write permissions for pages + id-token', async () => {
    const p = await paths();
    const text = readFileSync(p.workflow, 'utf8');
    assert.ok(/pages:\s*write/.test(text), 'workflow must declare pages: write permission');
    assert.ok(/id-token:\s*write/.test(text), 'workflow must declare id-token: write permission');
  });

  it('uploads artifact using upload-pages-artifact and deploys with deploy-pages', async () => {
    const p = await paths();
    const text = readFileSync(p.workflow, 'utf8');
    assert.ok(/actions\/upload-pages-artifact@v\d+/.test(text), 'workflow missing upload-pages-artifact step');
    assert.ok(/actions\/deploy-pages@v\d+/.test(text), 'workflow missing deploy-pages step');
  });
});
