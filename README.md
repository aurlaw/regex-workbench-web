# Regex Workbench

A web-based regular expression testing tool. Enter a regex pattern and test text to see matches highlighted in real time, with detailed results including capturing groups and named groups.

## Features

### Real-Time Regex Engine
- Live pattern validation with instant error feedback as you type
- Match extraction with support for global and non-global modes
- Capturing group extraction (both numbered and named groups)
- Zero-length match protection to prevent infinite loops

### Match Mode
- Color-coded match highlighting in the test text (alternating yellow/orange)
- Numbered match badges for quick identification
- Detailed results panel showing each match with position metadata
- Expandable capturing groups per match (named and numbered)
- Copy individual matches or all matches at once

### Replace Mode
- Replacement string input with support for back-references (`$1`, `$<name>`)
- Inline diff preview showing removed (red strikethrough) and added (green) segments
- Copy the final replaced text

### Match Statistics
- Live match count, total characters matched, and percentage of test text matched
- Animated stat transitions on value changes

### Regex Flags
- Individually toggleable flags: Global (`g`), Case Insensitive (`i`), Multiline (`m`), Dot All (`s`), Unicode (`u`)

### Shareable URLs
- Full app state encoded into the URL (pattern, flags, test text, replacement, mode)
- URLs update automatically via `history.replaceState` as you type
- Share button to copy the current URL to the clipboard

### Dark Mode
- Toggle between light and dark themes
- Respects system preference on first visit
- Persists choice to `localStorage`

### Keyboard Shortcuts
- `Ctrl/Cmd + L` — Focus the pattern input
- `Ctrl/Cmd + T` — Focus the test text area
- `Escape` — Blur the current element

### Authentication (Supabase)
- GitHub OAuth sign-in via Supabase Auth
- Displays user avatar and username when signed in
- Gracefully degrades when Supabase is not configured

### AI Pattern Generation (Edge Function)
- Supabase Edge Function that generates regex patterns from highlighted text and context using the Anthropic Claude API
- Requires authentication; returns a structured pattern with explanation, flags, and confidence score
- See [`supabase/functions/generate-pattern/README.md`](supabase/functions/generate-pattern/README.md) for setup, deployment, and usage details

## Tech Stack

- Vue 3 (Composition API)
- TypeScript
- Vite
- Tailwind CSS v4
- Supabase (Auth + Edge Functions)

## Prerequisites

- Node.js 20.19+ or 22.12+
- npm

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Opens a local dev server at `http://localhost:5173`.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | No | Supabase project URL (enables auth features) |
| `VITE_SUPABASE_ANON_KEY` | No | Supabase anonymous key |
| `VITE_GA_MEASUREMENT_ID` | No | Google Analytics 4 measurement ID |

Create a `.env` or `.env.local` file in the project root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## Production Build

```bash
npm run build
```

Output is written to the `dist/` directory. To preview the production build locally:

```bash
npm run preview
```
