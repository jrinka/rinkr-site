# rinkr-site — Claude Context

## What this is
A teacher's class website for **Mr. Rinka's English Classes**, hosted at **rinkr.net**.
Built as a plain static site (HTML/CSS/JS, no framework) deployed via **Vercel**, connected to **GitHub** (`github.com/jrinka/rinkr`).
All content is driven by **`content.json`** — no database, no backend.

## Classes
- **IB LIT** — IB English Literature
- **IB LANG & LIT** — IB English Language & Literature
- **E10** — Grade 10 English (third class, added later)

## File structure
```
index.html          — Homepage: 3-column card layout (desktop), stacked (mobile)
reading.html        — Currently Reading detail page (works library)
resources.html      — Class Resources detail page
rabbit-hole.html    — Reading Rabbit Hole detail page
content.json        — ALL editable content (books, works, links)
css/style.css       — All styles (single file, CSS custom properties)
js/app.js           — All JS (single file, fetches content.json and renders)
package.json        — Minimal, no dependencies (Supabase was removed)
```

## Colour system
Each section has a signature colour used consistently across the homepage card
top-border, the detail page header top-border, and the link card headers:

| Section | Colour | Hex |
|---------|--------|-----|
| Currently Reading | Navy | `#1E3A5F` |
| Class Resources | Teal | `#1E6080` |
| Reading Rabbit Hole | Plum | `#3D1A60` |

Works Library card headers are colour-coded by class:
- **IB LIT / IB LANG & LIT** → Navy `#1E3A5F`
- **E10** → Forest green `#1A472A`

CSS custom properties (dark/light) are in `:root` and `[data-theme="light"]`.
**Light mode is the default.** Theme preference is saved in `localStorage`.

## content.json schema
```json
{
  "reading": [
    {
      "class": "IB LIT",          // shown as card label
      "title": "Book Title",
      "author": "Author Name",
      "note": "Ch. 1–4 this week" // optional; italic below author
    }
  ],
  "works": [
    {
      "title": "Work Title",
      "author": "Author Name",     // can be "" for genre entries (Poetry, Essays)
      "class": "IB LIT",           // or "E10" — drives card header colour
      "files": [
        {
          "name": "Display name",
          "url": "https://...",    // OneDrive link, PDF, YouTube, etc.
          "type": "pdf"            // badge label: pdf, notes, link, video, worksheet
        }
      ]
    }
  ],
  "resources": [ /* same shape as rabbit — see below */ ],
  "rabbit": [
    {
      "title": "Link title",
      "url": "https://...",
      "note": "Optional description",
      "for": "students"            // adds CLASS badge; omit for personal ref
    }
  ]
}
```

## Works library (reading.html)
- 9 **IB LIT** works: Interior Chinatown, In the Time of the Butterflies, No Exit,
  A Doll's House, The World's Wife, Interpreter of Maladies, Minor Feelings,
  Metamorphosis, Death of a Salesman
- 4 **E10** works: Lord of the Flies, Romeo and Juliet, Personal Essays, Poetry
- Files collapse after 2 — "+N more" toggle expands inline (no page load)
- Active books (from `"reading"` array) appear as cards above the Works Library,
  separated by an `<hr>` divider

## Rendering logic (app.js)
- `load()` fetches `/content.json` and renders everything
- `renderLinks(id, items, emptyMsg, headerClass?)`:
  - If the container has class `link-cards-grid` → renders as cards (detail pages)
  - Otherwise → renders as plain list (homepage)
- Reading entries use `active-reading-grid` class on reading.html to trigger card mode
- Works cards apply `.e10` class to `.work-header` when `w.class === 'E10'`
- File toggle uses event delegation on `document` for `.files-toggle` buttons

## Body classes (detail pages)
Each detail page has a body class that drives the header accent colour:
- `reading.html` → `<body class="page-reading">`
- `resources.html` → `<body class="page-resources">`
- `rabbit-hole.html` → `<body class="page-rabbit">`

## Local preview
```
npx serve . -p 3000
```
Server config is in `.claude/launch.json`. Run via the preview tool (server ID
persists within a session). Note: `/api/*` routes don't work locally — they're
Vercel serverless functions and only run in production.

## Deployment
- Push to `main` on GitHub → Vercel auto-deploys to rinkr.net (~30s)
- No build step — pure static files
- Vercel project: `rinkr-site` under `jrinkas-projects`
- No env vars needed (Supabase was removed entirely in v2)

## Things to do / ideas discussed
- Add Unsplash (or similar) hero/icon assets to differentiate pages visually
- Subcategories within sections (user's idea, not yet implemented)
- The detail pages are stubs ready to be expanded — more content can be added
  as files accumulate in the works library
- No Supabase, no backend — keep it that way unless there's a clear need
