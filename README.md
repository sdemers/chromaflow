# Chromaflow

Chromaflow is a SvelteKit color-flood puzzle on a 10x10, 20x20, or 30x30 grid. Start on any tile, then click adjacent tiles to expand the highlighted region and repaint it. Solve the board in the fewest moves and fastest time.

## How to Play

1. Click any tile to choose your starting region.
2. Click a tile adjacent to the highlighted region to flood it with that color.
3. Keep expanding until all tiles match.
4. Aim for the fewest moves and best time.

## Features

- Board sizes: 10x10, 20x20, 30x30
- 8 color palette with adjacency highlight
- Move counter and timer
- Top-10 leaderboard per board size (Turso/libSQL)
- Responsive layout tuned for full-screen play

## This is a test

## Tech Stack

- SvelteKit + TypeScript
- Turso (libSQL) for server-side score persistence
- Vite for dev/build

## Local Development

Install dependencies:

```sh
npm install
```

Set environment variables:

```sh
TURSO_DATABASE_URL=...
TURSO_AUTH_TOKEN=...
```

Run the dev server:

```sh
npm run dev -- --open
```

## Build

```sh
npm run build
npm run preview
```

## Deployment Notes

- Turso credentials must be set in your hosting environment (e.g. Vercel).
- The scores table auto-creates on first request.
