# BLOOM OS ULTRA

Local-first media library / content tracker. Vanilla JS, no build step, no backend —
localStorage for persistence, an optional local proxy for Claude API calls.

## Structure

```
bloom-app/
├── index.html              entry point — markup + script/style tags only
├── css/
│   └── styles.css          all design tokens + component styles
├── js/
│   ├── config.example.js   template — copy to config.js, fill in your key
│   ├── config.js           ⚠ gitignored — your real CLAUDE_KEY / CLAUDE_URL
│   ├── core.js             state, localStorage persist, shared utils, router
│   ├── home.js             stats bar, ticker, filmstrip, hero slider, recent/video feed
│   ├── stream.js           stream page + queue
│   ├── library.js          filters, sort, grid/list/cinema card rendering
│   ├── detail.js           detail modal, zoom overlay, post panel, catalogue panel
│   ├── entry-editor.js     add/edit/save, media input, bulk import, delete
│   ├── refs.js             visual refs tab
│   ├── ai-export.js        Claude API calls, JSON import, CSV export, batch AI
│   ├── ui-system.js        modal utils, keyboard shortcuts, PIN lock, slideshow,
│   │                       storage bar, swipe navigation
│   └── init.js             boot sequence (runs last)
└── assets/
    └── refs/                drop ref1.jpg – ref11.jpg here (or your own filenames)
```

Scripts are loaded in the order listed in `index.html` — that order matters, since
this is classic global-scope JS (no modules/bundler), and later files call
functions/state defined in earlier ones.

## Setup

1. `cp js/config.example.js js/config.js` and put your real Claude API key in it.
   `js/config.js` is in `.gitignore` — it will never get committed or pushed to
   GitHub Pages.
2. Drop reference images into `assets/refs/`.
3. Serve locally (Chrome blocks local file/image loads over `file://`):
   ```
   npx serve .
   ```
   then open `http://localhost:3000`.
4. For GitHub Pages deployment, push everything **except** `js/config.js`.
   Since GitHub Pages is public, the AI features (which need `CLAUDE_KEY`) won't
   work there unless you route them through a small serverless proxy you control —
   see the security note below.

## ⚠️ Security note

Your uploaded `bloom.html` had a live Anthropic API key hardcoded directly in the
JS. I've pulled it out into `js/config.js` and gitignored that file, but:

- **That key was shared with me in plaintext and should be treated as compromised
  — rotate/regenerate it in the Anthropic Console before using this app again.**
- Even with `config.js` gitignored, any key shipped to a browser (including via
  `npx serve .` on your own machine, or worse, GitHub Pages) is visible to anyone
  who opens dev tools or views page source. A gitignore only stops it from
  landing in your *repo* — it doesn't stop it from being readable client-side.
- If you want AI features to work on a publicly hosted version, the key needs to
  live server-side (e.g. a small Cloudflare Worker / Vercel function / your
  Termux proxy kept off the public internet) that the browser calls without ever
  seeing the key itself.

## Data

- Entries: `localStorage['hf_bloom_v3']`
- Refs: `localStorage['hf_bloom_refs']`
- Catalogue: `localStorage['hf_bloom_cat']`

No backend, no sync — same device/browser only unless you wire up the planned
Google Sheets / Supabase sync layer.
