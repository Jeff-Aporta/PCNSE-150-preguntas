/**
 * tests/_helpers.mjs — shared helpers for all william-quest tests.
 *
 * Centralizes:
 *  - ROOT path resolution (works whether run from repo root or tests/)
 *  - JSON load/save with BOM-safe parsing
 *  - Question, audio, bundle file paths
 */
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Walk up the directory tree until we find a package.json (the repo root).
 * Then return that directory. Works whether this file lives at tests/_helpers.mjs
 * or any other nested path.
 */
export async function findRepoRoot() {
  let dir = __dirname;
  for (let i = 0; i < 6; i++) {
    try {
      const candidate = join(dir, 'package.json');
      await readFile(candidate);
      return dir;
    } catch {
      dir = dirname(dir);
    }
  }
  throw new Error('Could not locate repo root (no package.json found in parent chain)');
}

/**
 * Read a UTF-8 file (with or without BOM) and parse as JSON.
 * Throws with the file path if parsing fails.
 */
export async function readJson(path) {
  const buf = await readFile(path);
  // Strip UTF-8 BOM if present
  let text = buf.toString('utf8');
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`JSON parse error in ${path}: ${err.message}`);
  }
}

/**
 * Canonical paths (resolved against repo root).
 */
export async function paths() {
  const root = await findRepoRoot();
  return {
    root,
    questions: join(root, 'data', 'questions.json'),
    audio: join(root, 'audio'),
    bundles: {
      app: join(root, '_dist', 'js', 'app.bundle.js'),
      williamFront: join(root, '_dist', 'js', 'william-front.bundle.js'),
      appShell: join(root, '_dist', 'js', 'app-shell.bundle.js'),
      loader: join(root, '_dist', 'js', 'boot', 'loader.mjs'),
    },
    workflow: join(root, '.github', 'workflows', 'deploy-ghpages.yml'),
    readme: join(root, 'README.md'),
  };
}

/**
 * List all audio/qNNN.mp3 files and return a sorted array of integer ids present.
 */
export async function audioIds(audioDir) {
  const entries = await readdir(audioDir);
  const ids = [];
  for (const f of entries) {
    const m = /^q(\d{3})\.mp3$/.exec(f);
    if (m) ids.push(parseInt(m[1], 10));
  }
  return ids.sort((a, b) => a - b);
}

/**
 * Canonical list of PCNSE topics (alphabetical).
 * Keep in sync with the order in data/questions.json#metadata.topics.
 */
export const CANONICAL_TOPICS = [
  'App-ID',
  'Content-ID',
  'Decryption',
  'HA',
  'NAT',
  'Panorama',
  'Security Policies',
  'Troubleshooting',
  'User-ID',
  'VPN',
  'WildFire',
];

export const CANONICAL_TOPIC_SET = new Set(CANONICAL_TOPICS);
