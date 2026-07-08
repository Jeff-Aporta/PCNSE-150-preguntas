# AGENTS.md — William Quest

> **Canonical LLM-facing doc** for the William Quest simulator project.
> If you're an AI agent (Claude, GPT, Codex, Cursor, Aider, OpenCode, Devin, Gemini CLI, etc.),
> **read this file first** before touching the codebase.
> Everything below reflects the **current state of the repo** — older notes (in commit messages,
> old README drafts) may disagree. **Trust this file.**

---

## 1. What this project is

A free **PCNSE simulator** (Palo Alto Networks Certified Security Engineer) deployed on GitHub Pages.

- **150 multiple-choice questions** in Spanish (canonical) + **English translations** in `data/questions.en.json`.
- **Bilingual TTS audio** (`audio/es/`, `audio/en/`):
  - `qNNN.mp3` — pregunta + opciones A–D
  - `qNNN-tip.mp3` — tip + explicaciones A–D (justificación post-verificar)
- **ES/EN UI toggle** in the AppBar (next to theme switch), persisted in `localStorage`.
- **Each session shuffles question order** (Fisher–Yates in `buildSession`) — never present q001→q150 sorted.
- **11 topics**: App-ID, User-ID, Content-ID, Security Policies, NAT, VPN, Panorama, HA, Decryption, WildFire, Troubleshooting.
- **No login, no backend.** All data is JSON in the repo. Stats are stored in `localStorage`.
- **neon-glass UI** styled like the rest of the InSoft / Jeff-Aporta / Personal Apps ecosystem.

Live URL: `https://jeff-aporta.github.io/william-quest/`
Source repo: `https://github.com/Jeff-Aporta/william-quest` (was `jagudeloe/william-quest` in early drafts — that username never had a GitHub account).

---

## 2. Repo layout (CURRENT — not what some old docs said)

```
william_quest/
├── index.html                       # Entry HTML: dynamic <base href>, importmap, loader
├── package.json                     # name, scripts (dev/build/test/...), version
├── README.md                        # User-facing docs
├── AGENTS.md                        # ← you are here
├── data/
│   ├── questions.json               # Canonical ES bank (150 questions, metadata v2)
│   └── questions.en.json            # EN translations (id + question/options/tip/explanations)
├── audio/
│   ├── es/
│   │   ├── q001.mp3 ... q150.mp3      # Spanish TTS (question + options)
│   │   └── q001-tip.mp3 ... q150-tip.mp3  # Spanish TTS (tip + explanations)
│   ├── en/
│   │   ├── q001.mp3 ... q150.mp3
│   │   └── q001-tip.mp3 ... q150-tip.mp3
│   └── q001.mp3 ... q150.mp3        # LEGACY — optional; runtime prefers es/en subdirs
├── _dist/js/                        # Built bundles + **editable app source**
│   ├── boot/
│   │   └── loader.mjs               # fetch + eval loader (import.meta.url paths)
│   ├── app/                         # ← EDIT HERE (not src/): App, views, core
│   ├── william-front.bundle.js
│   ├── app-shell.bundle.js
│   └── app.bundle.js
├── vendor/
│   ├── william-shared/              # Project-specific vendor (theme, layout)
│   └── front-shared/                # Reused vendor stack from Jeff-Aporta/front-shared
├── scripts/
│   ├── build.mjs                    # esbuild + custom bare-to-window plugin
│   ├── dev-server.py                # python http.server with correct MIME for .ts/.tsx/.mjs
│   ├── generate-audio.mjs           # MiniMax TTS → audio/{es,en}/qNNN[.tip].mp3 (--kind=)
│   ├── translate-questions-en.mjs   # MiniMax chat → questions.en.json
│   ├── tts-prompt.mjs               # Shared TTS prompt (must match core/tts.ts)
│   ├── shuffle.mjs                  # Fisher–Yates shared with tests (must match quiz.ts)
│   ├── minimax-tts.mjs              # MiniMax T2A API client
│   ├── minimax-tts-cli.py           # TTS subprocess for dev-server /api/tts
│   └── validate-audio.ps1           # PowerShell: checks 150 MP3 exist
├── tests/                           # ← see section 7
└── .github/workflows/
    └── deploy-ghpages.yml           # GitHub Actions: build → upload → deploy
```

### 2.1 Things NOT in the repo

- **No `public/` directory.** Older README drafts mentioned `public/audio/` and `public/data/`,
  but the actual layout is at the **repo root**: `audio/`, `data/`, `vendor/`. If you see a doc that
  says `public/*`, that doc is stale — update it.
- **No `package-lock.json`** and **no committed `node_modules`**. esbuild is loaded via `npx` in CI
  and `--no-save` locally.

---

## 3. Runtime: how the page boots

```
┌──────────────────────────────────────────────────────────────────┐
│ index.html                                                       │
│   1. Sets theme pre-paint (data-mui-color-scheme on <html>)      │
│   2. Loads importmap with esm.sh URLs for React + MUI + Emotion  │
│   3. Defers babel-standalone + iconify (kept for fallback only)  │
│   4. type="module" <script src="_dist/js/boot/loader.mjs">       │
│      (inline script sets <base href> from current URL — required   │
│       for Live Server subpaths like /_apps/william_quest/)         │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ loader.mjs                                                       │
│   1. import vendor/front-shared/stack.mjs (paths via import.meta)│
│   2. fetch + (0,eval)(william-front.bundle.js)  ← NOT <script>   │
│   3. fetch + eval app-shell.bundle.js                            │
│   4. WilliamFront.registerApp("WILLIAM") → Locale + Theme        │
│   5. fetch + eval app.bundle.js → <App />                        │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ App.tsx                                                          │
│   - loadQuestions(): fetch questions.json + questions.en.json    │
│   - merge EN into q.en; audioFile → audio/es/{id}.mp3            │
│   - LocaleToolbar in AppShell toolbarExtra (ES/EN toggle)        │
│   - Views use localizeQuestion(q, locale) + t(key, locale)       │
└──────────────────────────────────────────────────────────────────┘
```

**Audio playback:** `playQuestionAudio(q, locale)` / `playTipAudio(q, locale)` in `core/audio.ts`.
- Question MP3: `audio/{locale}/qNNN.mp3` (via `document.baseURI`).
- Tip/justification MP3: `audio/{locale}/qNNN-tip.mp3`.
- Fallback dev: `POST /api/tts` (MiniMax via `scripts/minimax-tts-cli.py`).
- TTS prompts **must include options / explanations A–D** — use `scripts/tts-prompt.mjs` (`buildTtsPrompt` + `buildTipTtsPrompt`).
- UI: shared `AudioPlayerBar` (timeline + stop + circular play) for both tracks; only one track plays at a time.

---

## 4. Build: esbuild + custom plugin

The codebase **does not transpile at runtime** (would break on slow networks). Instead, all `.ts`/`.tsx` are pre-built into 3 IIFE bundles that read from `window.*`.

`scripts/build.mjs` runs 3 builds in sequence:

| Bundle | Entry | Output | Size | Notes |
|---|---|---|---:|---|
| `william-front` | `vendor/william-shared/william-front.js` | `_dist/js/william-front.bundle.js` | ~9 KB | Theme + UI atoms + `registerApp` |
| `app-shell` | `vendor/william-shared/app-shell.jsx` | `_dist/js/app-shell.bundle.js` | ~5 KB | `AppShell`, `NavTabRow`, `ViewFrame` |
| `app` | `_dist/js/app/main.tsx` | `_dist/js/app.bundle.js` | ~31 KB | The simulator itself |

### 4.1 The `bare-to-window` plugin (critical)

This is the trick that makes the build work. Each bundle has `import "react"` and `import "@mui/material"`,
etc. — and **those packages aren't actually bundled**. A virtual module replaces them:

```js
// generated shim for "react"
const R = window.React;
module.exports = R;
module.exports.default = R;
module.exports.__esModule = true;
for (const key of Object.keys(R)) module.exports[key] = R[key];
```

So at runtime, `import { useState } from "react"` resolves to `window.React.useState`, which is set by
`stack.mjs` from `esm.sh`. The same works for `react-dom`, `@mui/material`, `@emotion/react`,
`@emotion/styled`, etc.

Look at `scripts/build.mjs:BARE_TO_GLOBAL` and the `bareToWindowPlugin` for the exact mapping.

### 4.2 Building

```bash
npm run build
# = node scripts/build.mjs (which calls `npx esbuild` 3 times with the plugin)
```

After any change to `_dist/js/app/**/*.ts(x)` or `vendor/william-shared/*`, **rebuild and commit the bundles.**
The bundles are committed (not built in CI alone) so that cold-cache first paint is fast.

### 4.3 Verifying bundles

```bash
node --check _dist/js/app.bundle.js
node --check _dist/js/william-front.bundle.js
node --check _dist/js/app-shell.bundle.js
node --check _dist/js/boot/loader.mjs
```

Any `SyntaxError` here = the plugin failed to shim something. See section 6 (errors).

---

## 5. Dev server

```bash
python scripts/dev-server.py
# listens on http://127.0.0.1:8081 with correct MIME for .ts/.tsx/.mjs/.mp3
```

**Don't use `python -m http.server` directly** — Python's default MIME for `.ts` is
`video/vnd.dlna.mpeg-tts`, which browsers refuse to load as a module.

---

## 6. Lessons learned — DO and DO NOT

### 6.1 Q/A content generation

**DO**
- Use ASCII-only Spanish in NEW question text (no accents/ñ/¿/¡). Format: "Cual es la diferencia..."
  not "¿Cuál es la diferencia?". TTS speaks it cleanly and JSON parsing is unambiguous.
- Format TTS prompt as: `"Pregunta {NN}. {Topic}. {question}. Opcion A. … Opcion D. …"` (EN: `Question {NN}. Topic {Topic}. … Option A. …`).
- **Single source for prompt text:** `scripts/tts-prompt.mjs` — keep in sync with `_dist/js/app/core/tts.ts`.
- Generate audio: `npm run generate:audio` (needs `MINIMAX_API_KEY`). Output: `audio/es/`, `audio/en/`.
- Translate EN bank: `npm run translate:en` → `data/questions.en.json`.
- Each question: exactly 4 options A/B/C/D, one correctAnswer ∈ {A,B,C,D}, a `tip`, and
  `explanations` for **all** 4 options (the wrong ones must explain why they're wrong).
- Mix difficulties: básico / intermedio / avanzado.
- Save partial banks to `src/data/q{NNN}_{MMM}.json` as you go (so partial work is recoverable).

**DON'T**
- Don't use accented characters in qNNN text — they caused **q040 TTS failure** with
  "parameters not supported" (TTS rejected strings with version-number tokens like "TLS 1.3").
  Workaround used: text without numbers or with spelled-out versions (`"T L S uno punto tres"`).
- Don't make questions that depend on a PAN-OS version that will go stale (e.g. "in PAN-OS 11.1").
- Don't duplicate an existing `id` — IDs must be unique across the merged bank.
- Don't change the `metadata.version` field without a migration note.

### 6.2 TTS via matrix MCP

**DO**
- Use `mavis mcp call matrix matrix_batch_text_to_audio --file <batch.json>` with a JSON like:
  ```json
  { "requests": [ { "text": "...", "voice_id": "English_Trustworth_Man", "speed": 0.95, "emotion": "neutral" }, ... ] }
  ```
- Limit each call to ≤ 10 requests (the schema rejects more).
- Expect `response.success_items[i].output_url` to be a **local file path** like
  `C:\ContaPyme\matrix-media-<ts>-<hash>.mp3`, NOT a CDN URL despite the schema hint.
- After each batch: `Move-Item -Force <source> audio/qNNN.mp3` **immediately** before the temp dir fills.
- Retry any item from `failed_items` after ~10 s (rate-limited) with the **same exact payload**.

**DON'T**
- Don't pass `output_file` — the schema returns "parameters not supported" (it's an output key, not input).
- Don't make 11+ requests in a single call. Schema caps at 10 per call.
- Don't trust `output_file` field name as a saved filename — it has no extension and is arbitrary.

### 6.3 Build system

**DO**
- Build with `npm run build` (= `node scripts/build.mjs`).
- After every source change: rebuild + verify with `node --check <bundle>` + restart the dev server.
- After rebuild: copy the new bundle to any "public build" test plan.

**DON'T**
- Don't use the inline `npx esbuild ... --external:react --external:@mui/material` pattern in CI.
  That doesn't apply the `bare-to-window` plugin → bundles break when loaded. **Use `node scripts/build.mjs`
  in CI workflows** so local and remote output are identical. (Earlier deploy workflow had this bug; we
  fixed it in commit `b0c9164`.)
- Don't try to delete `_dist/js/boot/stack.mjs` if it disappears — it's regenerated by stack.mjs
  generation utilities (or lives in the vendored `front-shared/`).
- Don't change the alias `~william` without updating all `import "~william/..."` paths.

### 6.4 Dev server

**DO**
- Use `python scripts/dev-server.py`. It extends Python's `SimpleHTTPRequestHandler` with the
  correct MIME types for `.ts` (application/javascript), `.tsx`, `.mjs`, `.mp3` (audio/mpeg).

**DON'T**
- Don't use `python -m http.server` — wrong MIME for `.ts` files, browsers refuse to load as modules.
- Don't change the listening address; dev-server binds 127.0.0.1:8081 for security and consistency.

### 6.5 Git / GitHub workflow

**DO**
- Push to `main` branch (the workflow triggers on `main` only).
- **Enable GitHub Pages** before the first workflow run, or the `Setup Pages` step fails with
  "Not Found". The current setup uses API: `POST /repos/{owner}/{repo}/pages` with
  `{"source":{"branch":"gh-pages","path":"/"},"build_type":"workflow"}`.
- After first push, the workflow fires automatically. Subsequent pushes re-deploy.
- Use `gh auth status` to verify auth status. Authenticated user determines the actual
  GitHub account the repo lives under (`Jeff-Aporta` in our case, **not** `jagudeloe`).
- Locally: rename `master` → `main` before first push (`git branch -m master main`).

**DON'T**
- Don't skip the empty commit step if you need to retrigger the deploy after enabling Pages
  (workflows only fire on pushes).
- Don't push directly to `master` after this README — the workflow ignores that branch.

### 6.6 PowerShell / Windows shell quirks

**DO**
- Use `;` instead of `&&` in PowerShell.
- Use `Get-ChildItem`, `Select-Object`, `Select-String` instead of `ls`, `grep`, `find`.
- Use `if ($LASTEXITCODE -eq 0) { ... }` for conditional chaining.
- Use `$env:VAR` or `[System.Environment]::SetEnvironmentVariable` instead of `export VAR=`.

**DON'T**
- Don't use `cmd.exe` or its verbs (`dir`, `type`, `copy`, `move`, `del`, `erase`, `rd`).
  Use `Get-ChildItem`, `Get-Content`, `Copy-Item`, `Move-Item`, `Remove-Item` (or `mavis-trash`).
- Don't use `env` (it's a Bash builtin, not a PowerShell cmdlet).
- Don't read/write UTF-8 files with `Get-Content | ... | Set-Content` without `-Encoding UTF8`.
  PowerShell 5.1 defaults to system ANSI code page and silently corrupts non-ASCII chars.
- Don't rely on `curl` (PowerShell aliases it to `Invoke-WebRequest` with different flags).
  Use `python -c "import urllib.request; ..."` or `mavis browser` for HTTP testing from PowerShell.
- Don't use `&&` after a `git` command — it throws `ParseError` on the multi-line output.

### 6.8 Boot / loading — errors we hit (DO NOT repeat)

| Symptom | Root cause | Fix |
|---|---|---|
| Eternal **"Cargando simulador PCNSE…"** | `loader.mjs` used inline `<script>` + `onload` for IIFE bundles — **onload never fires** for inline scripts | Use `(0, eval)(src)` after `fetch` (see `runBundle` in loader.mjs) |
| 404 on `/vendor/...` or `/data/...` under Live Server subpath | Absolute paths ignore `/_apps/william_quest/` prefix | Dynamic `<base href>` in `index.html`; `new URL(path, document.baseURI)` in app code |
| Blank app, React error **#62** | `Icon` passed `style` as **string** to `<iconify-icon>` | Pass `style` as **object** in `william-front.js` |
| `AppShell is not defined` in strict IIFE | Bundle referenced bare `AppShell` identifier | `resolveAppShell()` from `globalThis.AppShell` or `WilliamFront.Layout.AppShell` |
| `window.React.jsx` undefined in bundle | esbuild shims need `jsx`/`jsxs` on `window.React` | `stack.mjs` must expose them (see `vendor/front-shared/stack.mjs`) |

**DO**
- Use `import.meta.url`-relative paths in `loader.mjs`.
- Test under **both** `http://127.0.0.1:8081/` (dev-server) and `/_apps/william_quest/` (Live Server) when changing boot paths.

**DON'T**
- Don't use `onload` on inline script tags for IIFE bundles.
- Don't use hardcoded `/audio/...` or `/data/...` without `document.baseURI`.

### 6.9 i18n (ES/EN)

**DO**
- UI strings: `_dist/js/app/core/ui-i18n.ts` (`t(key, locale)`).
- Question text: `localizeQuestion(q, locale)` from `core/question-i18n.ts`.
- Locale state: `WILLIAM.Locale` + `LocaleToolbar` in `App.tsx` `toolbarExtra`.
- `loadQuestions()` merges `data/questions.en.json` into `q.en` by id.
- Cards with long content: `CARD_SCROLL` / `CARD_SCROLL_TALL` from `core/card-scroll.ts`.

**DON'T**
- Don't duplicate TTS prompt logic — use `scripts/tts-prompt.mjs` + `core/tts.ts` (tests enforce parity).
- Don't show EN question text but play ES audio — always pass `locale` to `playQuestionAudio(q, locale)`.
- Don't fall back to `audio/qNNN.mp3` when `locale === "en"` (legacy root MP3s are Spanish-only).

### 6.10 Audio runtime — errors we hit

| Symptom | Root cause | Fix |
|---|---|---|
| Play button does nothing / 404 | URL was `/audio/q001.mp3` (domain root) | `resolveAssetUrl` + `document.baseURI` |
| EN UI but **Spanish audio** | Legacy `audio/q001.mp3` picked after failed HEAD on `audio/en/` | Use GET+Range for existence check; EN candidates = `[audio/en/id.mp3]` only |
| Play icon never becomes **pause** | `play` event fired **before** listeners attached | `bindPlaybackEvents` before `play()` + `setPlaybackListener` in QuizView |
| HEAD request fails on static server | Live Server / some hosts don't support HEAD on MP3 | `fetch(url, { headers: { Range: 'bytes=0-511' } })` in `assetExists` |

**DO**
- Wire playback listeners **before** `audio.play()`.
- Regenerate both locales after prompt change: `node scripts/generate-audio.mjs --force`.

**DON'T**
- Don't use question-only TTS prompts (users expect options read aloud).
- Don't attach `wireAudio` only after `await play()` completes.

### 6.12 Tip / justification audio + right panel (DO NOT repeat)

| Symptom | Root cause | Fix |
|---|---|---|
| Justificación sin narración | Solo existía `qNNN.mp3` (pregunta) | Generar `qNNN-tip.mp3` con `buildTipTtsPrompt` + `--kind=tip` |
| Play tip regenera TTS en prod | Tip MP3 missing in Pages | Commit **300** tip files (`es`+`en`); tests enforce 150×2 |
| MiniMax `fetch failed` mid-batch | Transient network/API | Re-run `generate-audio.mjs --kind=tip --ids=qNNN --locale=en` for gaps |
| Justificación empuja opciones hacia abajo | Explanation card was below options in one column | Right panel (`md:400`) after verify; stack on mobile |
| Tabs Práctica/Resultados “no hacen nada” | `onChange` early-return + `disabled` never passed to `MUI.Tab` | Pass `disabled: !!t.disabled` in `NavTabRow`; don’t block quiz without session |
| Stop button ovalado / play idle a la derecha | Stack `width:100%` + IconButton sin size fijo | Idle: shrink bar; buttons `40×40` `borderRadius:50%` `aspectRatio:1/1` |

**DO**
- Use `AudioPlayerBar` for **both** question and tip (DRY). Tracks: `"question"` | `"tip"`.
- Generate tips: `npm run generate:audio -- --kind=tip` (or `--kind=all`).
- Keep `scripts/tts-prompt.mjs` ↔ `core/tts.ts` tip prompts in sync (tests assert).
- Layout after verify: question/options **left**, tip card **right**.
- Nav: Results tab `disabled` until `state.result`; Práctica always navigable (Home config if no session).

**DON'T**
- Don't re-implement a second play/pause UI outside `AudioPlayerBar`.
- Don't block `route === "quiz"` when `!session` — show HomeView for config instead.
- Don't leave tip MP3 out of commits (Pages won’t have them).
- Don't set AudioPlayerBar to fixed 340px width when timeline is hidden.

### 6.13 Option shuffle — barajar A–D por sesión (DO NOT always letter B)

| Symptom | Root cause | Fix |
|---|---|---|
| La respuesta correcta siempre es la misma letra (p. ej. B) | `options` array sorted by `id` (A,B,C,D) en el banco canónico | `shuffleQuestionOptions(q)` en `buildSession` remapea `options`, `correctAnswer` y `explanations` |
| Usuario marca "B" en la versión rebarajada y el sistema dice Incorrecto | El texto de la respuesta correcta cambió de letra pero `correctAnswer` no | `shuffleQuestionOptions` mantiene la **invariante**: el texto apuntado por `correctAnswer` siempre coincide con el de la opción que el usuario ve en esa posición |

**DO**
- Start quizzes **only** via `buildSession(mode, topic, questions)` from `core/quiz.ts`.
- Al reintentar (retry) también rebarajar las opciones (`shuffleArray(...)` + `shuffleQuestionOptions`).
- Mantener el **orden de preguntas** estable por `id` (q001, q002, ...) — el examen real baraja opciones, no bloques.
- Keep `scripts/shuffle.mjs` algorithm identical to `quiz.ts` (tests check both).
- HomeView must call `buildSession` — no local filter+sort copy.

**DON'T**
- Don't `sort((a,b) => a.id.localeCompare(b.id))` on the option **array** per session.
- Don't shuffle the **canonical bank** cache in `loadQuestions()` — shuffle a **copy** per session.
- Don't forget to remap `correctAnswer` + `explanations` together when option letters move (would break grading).
- Don't re-shuffle mid-session when changing locale (locale only re-localizes text/audio).

### 6.7 File I/O discipline

**DO**
- Use the `Write` tool for any file edit (UTF-8 by default, no shell encoding gotchas).
- Use `mavis-trash <path>` for deletion (recoverable via Recycle Bin). Avoid `Remove-Item`
  unless you're sure.
- Re-read any file before editing it again — the Edit tool requires a prior Read in this session.

**DON'T**
- Don't `Get-Content | ConvertTo-Json | Set-Content` round-trips on JSON files.
- Don't `Remove-Item` files — use `mavis-trash`. (System reminders block it for a reason.)

### 6.11 GitHub / binary assets

**DO**
- Commit `audio/es/` + `audio/en/` question **and tip** MP3 (~300 question + ~300 tip; GitHub accepts — max file 100 MB; ours are <2 MB each).
- Push triggers `deploy-ghpages.yml` automatically (~30–90 s; tip binaries add upload time).

**DON'T**
- Don't assume GitHub rejects MP3 folders — it won't at this size.
- Consider removing legacy `audio/q*.mp3` at root eventually (~24 MB duplicate; runtime prefers `audio/es/`).
- Don't commit tip audio without also updating `tests/02-audio.test.mjs` expectations (already expects 150 tips/locale).

---

## 7. Tests

The repo has a small but powerful test suite under `tests/` that codifies the most important
"DO NOT"s from section 6. Run them before committing.

### 7.1 Why `.test.mjs` instead of `.test.ts`?

We intentionally picked **Node's built-in `node --test` runner** with plain `.mjs` to avoid
adding a test framework dependency. The whole suite has **zero deps** beyond Node 22+ itself.

- No vitest, jest, mocha, ts-node, tsx, etc.
- The TS source itself is small and the invariants we test (JSON shape, file existence,
  YAML shape, README text) don't require typed input.
- If we ever need TS in tests, we can add `tsc` + `node --test --import tsx` later.

If you need to test TS code (e.g., `core/quiz.ts` grading logic), the cleanest path is:
1. Compile once with `node scripts/build.mjs` (already part of `npm run build`).
2. Test the **built** bundle's runtime behavior with a tiny harness, OR
3. Add a vitest devDependency (small footprint, works directly with TSX).

For now, tests focus on **invariant checking** rather than runtime behavior.

### 7.2 How to run

```bash
npm test
# = node --test tests/*.test.mjs
```

Or directly:

```bash
node --test tests/*.test.mjs
```

Tests are independent (each opens with `node:test describe()`). Failures print the full diff.

### 7.3 What's covered

| Test file | Invariant |
|---|---|
| `01-schema.test.mjs` | `data/questions.json` has all required fields, all 4 options, valid correctAnswer, explanations for all options. |
| `02-audio.test.mjs` | 150 question MP3 + **150 tip** MP3 in `audio/es/` and `audio/en/`; no gaps. |
| `03-bundles.test.mjs` | All 4 JS bundles pass `node --check` (parses without syntax errors). |
| `04-distribution.test.mjs` | Topic distribution sums to 150; all 11 topics present. |
| `05-id-format.test.mjs` | IDs are `qNNN`, unique, contiguously covering `q001..q150`. |
| `06-content-safety.test.mjs` | New questions ASCII-only; no stale PAN-OS refs. |
| `07-workflow.test.mjs` | `deploy-ghpages.yml` uses `node scripts/build.mjs`, triggers on `main`. |
| `08-readme.test.mjs` | README doesn't mention `public/`; mentions 150 questions. |
| `09-i18n.test.mjs` | `questions.en.json` has 150 rows; ids match ES; TTS prompt includes A–D. |
| `10-runtime-contract.test.mjs` | Boot eval, base href, i18n wiring, audio locale paths, AudioPlayerBar tip+question. |
| `11-session-shuffle.test.mjs` | Fisher–Yates shuffle; `buildSession` keeps question order by id; HomeView uses `buildSession`. |
| `12-ui-contracts.test.mjs` | Tab `disabled` wiring; circular play/stop; right tip panel; tip audio paths. |
| `13-option-shuffle.test.mjs` | `shuffleQuestionOptions` remaps correctAnswer + explanations; buildSession applies it; retry reshuffles. |

---

## 8. Schema invariants (canonical contract)

The runtime contract that `data/questions.json` must satisfy. **Tests enforce these.**

```ts
type AnswerId = "A" | "B" | "C" | "D";

type Question = {
  id: string;            // /^q\d{3}$/, unique, contiguous q001..q{N}
  topic: string;         // one of the 11 canonical topics (see below)
  difficulty: "básico" | "intermedio" | "avanzado";
  question: string;      // ASCII-only, no accents
  options: { id: AnswerId; text: string }[];  // exactly 4 items
  correctAnswer: AnswerId;
  tip: string;
  explanations: Record<AnswerId, string>;  // all 4 keys present
  en?: {                              // merged from data/questions.en.json
    question: string;
    options: { id: AnswerId; text: string }[];
    tip: string;
    explanations: Record<AnswerId, string>;
  };
  // audioFile auto-injected: audio/es/{id}.mp3 (localizeQuestion swaps to audio/en/ for EN)
};

type QuestionBank = {
  metadata: {
    exam: string;
    version: string;             // "2.0"
    language: "es-CO" | string;
    totalQuestions: number;      // must match questions.length
    topics: string[];            // sorted alphabetically
  };
  questions: Question[];        // length === metadata.totalQuestions
};
```

Canonical topics (alphabetical):

```
App-ID, Content-ID, Decryption, HA, NAT, Panorama,
Security Policies, Troubleshooting, User-ID, VPN, WildFire
```

Sum across topics must equal `metadata.totalQuestions`.

---

## 9. Common operations cheatsheet

### Add 10 more questions

1. Generate in `src/data/q{NNN}_{NNN+9}.json` (no accents, ASCII only).
2. Validate locally with `tests/01-schema.test.mjs` running on the partial file (we'll merge soon).
3. Generate audio: `npm run generate:audio -- --ids=qNNN` (or `--force` for full regen).
4. MP3s land in `audio/es/` and `audio/en/` (not repo root).
5. Merge into `data/questions.json` and `src/data/questions.json` (script in §10).
6. `npm run build` — but the bundle doesn't actually change because loadQuestions fetches JSON at runtime.
   Still, run it to be safe.
7. Run `npm test`. All should pass.
8. `git add ... && git commit -m "feat: add 10 more questions (qNNN-qMMM)" && git push origin main`.

### Verify deployment URL

After pushing, the workflow takes ~30s. Check:

```bash
$env:GH_TOKEN = (gh auth token); gh run watch <run-id> --exit-status
```

Then smoke test:

```bash
python -c "import urllib.request; r=urllib.request.urlopen('https://jeff-aporta.github.io/william-quest/'); print(r.status)"
```

### Re-trigger deploy after Pages enabled

Empty commit + push:

```bash
git commit --allow-empty -m "ci: re-trigger Pages deploy"
git push origin main
```

---

## 10. Helper scripts

These live in `C:\Users\JAGUDELOE\AppData\Local\Temp\` during the build sessions and get re-generated
on demand:

| Script | Purpose |
|---|---|
| `gen_q{NN}_{NN}.py` | Pattern generator for new question banks (ASCII-only). |
| `build_tts_batches.py` | Builds 10-batch JSON files for `matrix_batch_text_to_audio`. |
| `merge_questions.py` | Merges partial `src/data/q*.json` files into the canonical `data/questions.json`. |
| `validate_merge.py` | Validates the merged JSON schema before commit. |
| `final_validate.py` | End-to-end smoke test of dev server (HTTP fetch + JSON parse + bundle check). |
| `test_live.py` | Smoke test of the **deployed** GitHub Pages URL. |

When working on this project next time, look in `C:\Users\JAGUDELOE\AppData\Local\Temp\` for the
most recent versions.

---

## 11. When you have questions

If something in this file contradicts the code, **the code is wrong** (or the code has evolved
and this file is stale). Fix one or the other — don't leave them disagreeing.

If you add a new invariant, **add a test for it** in `tests/` before merging.
