# William Quest — Simulador PCNSE

Simulador gratuito de opción múltiple para la certificación **PCNSE** (Palo Alto Networks Certified Security Engineer).

- **150 preguntas** reales estilo examen, distribuidas en los 11 temas del manual oficial: App-ID, User-ID, Content-ID, Security Policies, NAT, VPN, Panorama, HA, Decryption, WildFire y Troubleshooting.
- **Audio en español** generado con IA para cada pregunta (TTS MiniMax Multi-Language).
- **Tip del porqué** la respuesta correcta es correcta, y explicación detallada de por qué cada opción incorrecta es incorrecta.
- **Calificación final** con score, desempeño por tema y revisión pregunta por pregunta.
- **UI neon-glass** idéntica a las demás apps Jeff-Aporta / Personal Apps (sin login, sin backend).
- **Desplegado en GitHub Pages** desde la raíz del repo.

## Stack

- **Frontend:** TypeScript + React 18 + MUI 9 + Emotion (vía importmap ESM, sin transpilación runtime).
- **Build:** esbuild compila los `.ts/.tsx` a bundles IIFE que consumen `window.*` global (no runtime de Babel en producción).
- **Datos:** JSON estático en `data/questions.json` (servido desde la raíz).
- **Audio:** 150 MP3 en `audio/q001.mp3 ... q150.mp3`.
- **Vendor:** `vendor/william-shared/` (tema, UI, layout) + `vendor/front-shared/` (neon-glass.min.css, base.css, feedback.css, stack.mjs).
- **Publicación:** GitHub Pages desde `main` (raíz del repo).

## Estructura

```
william_quest/
├── index.html                      # Entry HTML con importmap
├── _dist/js/
│   ├── boot/
│   │   ├── loader.mjs              # Boot loader (stack.mjs + 3 IIFE bundles)
│   │   ├── stack.mjs
│   │   └── cdn.mjs
│   ├── william-front.bundle.js    # Tema + UI + registerApp
│   ├── app-shell.bundle.js        # AppShell + NavTabRow + ViewFrame
│   └── app.bundle.js              # App + views + core
├── src/                            # Fuente TypeScript/TSX (compilable)
├── audio/q001.mp3 ... q150.mp3     # 150 MP3s TTS
├── data/questions.json             # Banco de preguntas
├── vendor/
│   ├── william-shared/             # Tema y layout propios
│   └── front-shared/               # Stack base reutilizable
├── scripts/
│   ├── build.mjs                   # esbuild + plugins
│   └── dev-server.py               # python -m http.server 8081
└── .github/workflows/
    └── deploy-ghpages.yml
```

## Desarrollo local

```powershell
# Servir en localhost:8081
python scripts\dev-server.py
```

Abre `http://localhost:8081` en el navegador.

## Build de producción

```bash
node scripts/build.mjs
```

Genera tres bundles IIFE en `_dist/js/` que se cargan en orden desde `loader.mjs`:

1. `william-front.bundle.js` — tema MUI + UI reutilizable (`registerApp`).
2. `app-shell.bundle.js` — AppShell y layout.
3. `app.bundle.js` — el simulador (HomeView, QuizView, ResultsView, core/quiz, core/audio).

## Publicar en GitHub Pages

1. Crea el repo en GitHub: `jagudeloe/william-quest`.
2. Push a `main` — el workflow `.github/workflows/deploy-ghpages.yml` ejecuta `node scripts/build.mjs` y publica el artefacto en `gh-pages` automáticamente.
3. Configura GitHub Pages: **Settings → Pages → Source: `gh-pages` branch / root**.

## Preguntas del banco

Las 150 preguntas fueron redactadas manualmente con:

- **Escenarios realistas** del día a día de un administrador de firewall.
- **4 opciones** A/B/C/D con respuesta clara.
- **Tip del porqué**: explicación clara del razonamiento detrás de la respuesta correcta.
- **Explicación por opción**: para cada respuesta incorrecta, una razón específica de por qué no aplica.

Las preguntas NO son oficiales de Palo Alto Networks — son material de práctica creado con base en la documentación pública de Palo Alto Networks y en experiencia común de administradores PCNSE.

### Distribución por tema

| Tema | Preguntas |
|---|---:|
| App-ID | 9 |
| User-ID | 9 |
| Content-ID | 9 |
| Security Policies | 13 |
| NAT | 8 |
| VPN | 15 |
| Panorama | 15 |
| HA | 10 |
| Decryption | 16 |
| WildFire | 16 |
| Troubleshooting | 30 |

## Licencia

MIT — Úsalo libremente, modifícalo, compártelo.

---

Hecho con neon-glass por **jagudeloe** — InSoft / Jeff-Aporta / Personal Apps ecosystem.
