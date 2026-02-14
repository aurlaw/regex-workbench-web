# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Regex Workbench - a web-based regular expression testing tool.

## Tech Stack

- **Framework:** Vue 3 (Composition API with `<script setup>`)
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/vite` plugin)

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Type-check and build for production
- `npm run preview` — Preview production build

## Project Structure

- `src/components/` — Vue components
- `src/composables/` — Vue composables (hooks)
- `src/types/` — TypeScript type definitions
- `src/App.vue` — Root component
- `src/main.ts` — App entry point
- `src/style.css` — Global styles (Tailwind import)
