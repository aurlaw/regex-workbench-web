# Regex Workbench

A web-based regular expression testing tool. Enter a regex pattern and test text to see matches highlighted in real time, with detailed results including capturing groups and named groups.

## Tech Stack

- Vue 3 (Composition API)
- TypeScript
- Vite
- Tailwind CSS v4

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

## Google Analytics 4

GA4 tracking is enabled when the `VITE_GA_MEASUREMENT_ID` environment variable is set. Without it, no analytics code runs.

To configure, create a `.env` or `.env.production` file in the project root:

```
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
