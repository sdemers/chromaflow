<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import Instructions from '$lib/components/Instructions.svelte';
  import GameBoard from '$lib/components/GameBoard.svelte';
  import ScorePanel from '$lib/components/ScorePanel.svelte';
  import StatsPanel from '$lib/components/StatsPanel.svelte';
  import {
    checkWin,
    createGrid,
    expandRegion,
    floodFill,
    indexOf,
    isAdjacentToRegion,
    recolorRegion
  } from '$lib/game/logic';

  type Score = {
    moves: number;
    seconds: number;
  };

  type ScoresBySize = {
    10: Score[];
    20: Score[];
    30: Score[];
  };

  type BoardSize = 10 | 20 | 30;

  const sizeOptions: BoardSize[] = [10, 20, 30];
  const colors = [
    '#f7c945',
    '#f28c8c',
    '#5fc2a4',
    '#6aa5ff',
    '#b68cff',
    '#f5a65a',
    '#7fd0ff',
    '#9ad65b'
  ];

  let size: BoardSize = 30;
  let tileSize = 18;
  let boardGap = 5;
  let boardPadding = 20;
  let grid = createGrid(size, colors.length);
  let region: Set<number> = new Set();
  let started = false;
  let moves = 0;
  let seconds = 0;
  let timerId: ReturnType<typeof setInterval> | null = null;
  let won = false;
  let regionColor: number | null = null;
  let scores = defaultScores();
  let scoresLoading = true;
  let scoresError = '';
  let pageEl: HTMLDivElement | undefined;
  let headerEl: HTMLElement | null = null;
  let scoresEl: HTMLElement | null = null;

  onMount(() => {
    loadScores(size);
    updateTileSize();
    const onResize = () => updateTileSize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  });

  onDestroy(() => {
    stopTimer();
  });

  function defaultScores(): ScoresBySize {
    return { 10: [], 20: [], 30: [] };
  }

  async function loadScores(boardSize: BoardSize) {
    scoresLoading = true;
    scoresError = '';
    try {
      const response = await fetch(`/api/scores?size=${boardSize}`);
      if (!response.ok) throw new Error('Failed to load scores');
      const data: { scores?: Score[] } = await response.json();
      scores = { ...scores, [boardSize]: data.scores ?? [] };
    } catch (error) {
      scoresError = 'Could not load scores.';
    } finally {
      scoresLoading = false;
    }
  }

  async function recordScore(value: number) {
    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ size, moves: value, seconds })
      });
      if (!response.ok) throw new Error('Failed to save score');
      const data: { scores?: Score[] } = await response.json();
      scores = { ...scores, [size]: data.scores ?? [] };
    } catch (error) {
      scoresError = 'Could not save score.';
    }
  }

  function updateTileSize() {
    const paddingLeft = pageEl ? parseFloat(getComputedStyle(pageEl).paddingLeft) : 24;
    const paddingRight = pageEl ? parseFloat(getComputedStyle(pageEl).paddingRight) : 24;
    const paddingTop = pageEl ? parseFloat(getComputedStyle(pageEl).paddingTop) : 32;
    const paddingBottom = pageEl ? parseFloat(getComputedStyle(pageEl).paddingBottom) : 32;
    const pageGap = 28;
    const playGap = 20;

    const headerHeight = headerEl?.getBoundingClientRect().height ?? 0;
    const scoresRect = scoresEl?.getBoundingClientRect();
    const scoresWidth = scoresRect?.width ?? 0;
    const scoresHeight = scoresRect?.height ?? 0;
    const stacked = window.innerWidth <= 900;

    boardGap = stacked ? 3 : 5;
    boardPadding = stacked ? 12 : 20;

    const availableWidth =
      window.innerWidth - paddingLeft - paddingRight - (stacked ? 0 : scoresWidth + playGap);
    const availableHeight =
      window.innerHeight -
      paddingTop -
      paddingBottom -
      headerHeight -
      pageGap -
      (stacked ? scoresHeight + playGap : 0);

    const usableWidth = availableWidth - boardPadding * 2 - boardGap * (size - 1);
    const usableHeight = availableHeight - boardPadding * 2 - boardGap * (size - 1);
    const nextSize = Math.floor(Math.min(usableWidth / size, usableHeight / size));
    tileSize = Math.max(6, nextSize);
  }

  function handleClick(row: number, col: number) {
    if (won) return;

    if (!started) {
      started = true;
      startTimer();
      region = floodFill(grid, size, row, col, grid[row][col]);
      regionColor = grid[row][col];
      return;
    }

    const id = indexOf(row, col, size);
    if (region.has(id)) return;
    if (!isAdjacentToRegion(region, size, row, col)) return;

    const targetColor = grid[row][col];
    if (targetColor === regionColor) return;

    recolorRegion(grid, size, region, targetColor);
    region = expandRegion(grid, size, region, targetColor);
    regionColor = targetColor;
    moves += 1;
    if (checkWin(grid, size)) {
      won = true;
      stopTimer();
      recordScore(moves);
    }
  }

  function resetGame() {
    stopTimer();
    grid = createGrid(size, colors.length);
    region = new Set<number>();
    started = false;
    moves = 0;
    seconds = 0;
    won = false;
    regionColor = null;
  }

  function startTimer() {
    if (timerId) return;
    timerId = setInterval(() => {
      seconds += 1;
    }, 1000);
  }

  function stopTimer() {
    if (!timerId) return;
    clearInterval(timerId);
    timerId = null;
  }

  function formatTime(value: number) {
    const minutes = Math.floor(value / 60);
    const remaining = value % 60;
    return `${minutes}:${String(remaining).padStart(2, '0')}`;
  }

  function setSize(nextSize: BoardSize) {
    if (size === nextSize) return;
    size = nextSize;
    resetGame();
    loadScores(nextSize);
    updateTileSize();
  }
</script>

<svelte:head>
  <title>Chromaflow Grid</title>
</svelte:head>

<div class="page" bind:this={pageEl}>
  <section class="layout">
    <div class="left">
      <Instructions bind:element={headerEl} />

      <GameBoard
        {grid}
        {colors}
        {size}
        {tileSize}
        {boardGap}
        {boardPadding}
        {region}
        {started}
        {won}
        {moves}
        indexOf={(row, col) => indexOf(row, col, size)}
        isAdjacentToRegion={(row, col) => isAdjacentToRegion(region, size, row, col)}
        {handleClick}
        {resetGame}
      />
    </div>

    <aside class="right" bind:this={scoresEl}>
      <StatsPanel
        {moves}
        time={formatTime(seconds)}
        {size}
        {sizeOptions}
        {setSize}
        {resetGame}
      />

      <ScorePanel {size} {scoresLoading} {scoresError} {scores} {formatTime} />
    </aside>
  </section>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600&family=Space+Grotesk:wght@400;600&display=swap');

  :global(body) {
    margin: 0;
    font-family: 'Space Grotesk', system-ui, sans-serif;
    background: radial-gradient(circle at top, #fff7e8 0%, #f2f1ff 45%, #e8f7f1 100%);
    color: #1e1d28;
    min-height: 100vh;
    overflow: hidden;
  }

  .page {
    max-width: 1320px;
    margin: 0 auto;
    padding: 32px 24px 64px;
    display: grid;
    gap: 28px;
    height: 100vh;
    box-sizing: border-box;
  }

  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 260px;
    gap: 20px;
    align-items: start;
  }

  .left {
    display: grid;
    gap: 16px;
  }

  .right {
    display: grid;
    gap: 20px;
    align-content: start;
  }

  @media (max-width: 900px) {
    .layout {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 600px) {
    .page {
      padding: 24px 16px 48px;
    }
  }
</style>
