# William Quest — Simulador PCNSE

Simulador gratuito de opción múltiple para la certificación **PCNSE** (Palo Alto Networks Certified Security Engineer).

- **50 preguntas** reales estilo examen, distribuidas en los 11 temas del manual oficial: App-ID, User-ID, Content-ID, Security Policies, NAT, VPN, Panorama, HA, Decryption, WildFire y Troubleshooting.
- **Audio en español** generado con IA para cada pregunta (TTS MiniMax).
- **Tip del porqué** la respuesta correcta es correcta, y explicación detallada de por qué cada opción incorrecta es incorrecta.
- **Calificación final** con score, desempeño por tema y revisión pregunta por pregunta.
- **UI neon-glass** idéntica a las demás apps Jeff-Aporta / Personal Apps (sin login, sin backend).

## Stack

- **Frontend:** TypeScript + React 18 + MUI 9 + Emotion (via importmap ESM + Babel standalone runtime, sin build step)
- **Datos:** JSON estático en `public/data/questions.json`
- **Audio:** 50 MP3 en `public/audio/q001.mp3 ... q050.mp3`
- **Vendor:** `public/vendor/william-shared/` (tema, UI, layout) + `public/vendor/front-shared/` (neon-glass.min.css, base.css, feedback.css, stack.mjs)
- **Publicación:** GitHub Pages desde `main` (raíz del repo)

## Estructura

```
william_quest/
├── index.html                      # Entry HTML con importmap
├── _dist/
│   └── js/
│       ├── boot/
│       │   ├── loader.mjs          # Boot principal
│       │   └── cdn.mjs
│       └── app/
│           ├── isa-setup.ts        # Bootstrap metadata
│           ├── app-meta.js
│           ├── main.tsx            # createRoot + <App />
│           ├── App.tsx             # Routing + estado global
│           ├── core/
│           │   ├── quiz.ts         # Tipos + loadQuestions + grading
│           │   └── audio.ts        # Reproductor de MP3
│           └── views/
│               ├── HomeView.tsx    # Selector de tema + arranque
│               ├── QuizView.tsx    # Pregunta + audio + verificación
│               └── ResultsView.tsx # Score + revisión detallada
├── public/
│   ├── vendor/                     # Vendor local (sin CDN externa)
│   ├── audio/                      # 50 MP3
│   ├── data/questions.json
│   └── css/
├── scripts/
│   ├── dev-server.ps1              # python -m http.server 8081
│   └── validate-audio.ps1          # valida 50 audios
└── .github/workflows/
    └── deploy-ghpages.yml
```

## Desarrollo local

```powershell
# Servir en localhost:8081
.\scripts\dev-server.ps1
```

Abre `http://localhost:8081` en el navegador.

## Validar audios

```powershell
.\scripts\validate-audio.ps1
```

## Publicar en GitHub Pages

1. Crea el repo en GitHub: `jagudeloe/william-quest`
2. Push a `main` — el workflow `.github/workflows/deploy-ghpages.yml` publica automáticamente en `gh-pages`
3. Configura GitHub Pages: Settings → Pages → Source: `gh-pages` branch / root

## Preguntas del banco

Las 50 preguntas fueron redactadas manualmente con:

- **Escenarios realistas** del día a día de un administrador de firewall
- **4 opciones** A/B/C/D con respuesta clara
- **Tip del porqué**: explicación clara del razonamiento detrás de la respuesta correcta
- **Explicación por opción**: para cada respuesta incorrecta, una razón específica de por qué no aplica

Las preguntas NO son oficiales de Palo Alto Networks — son material de práctica creado con base en la documentación pública de Palo Alto Networks y en experiencia común de administradores PCNSE.

## Licencia

MIT — Úsalo libremente, modifícalo, compártelo.

---

Hecho con neon-glass por **jagudeloe** — InSoft / Jeff-Aporta / Personal Apps ecosystem.