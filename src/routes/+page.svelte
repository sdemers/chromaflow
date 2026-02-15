<script lang="ts">
  import { browser } from '$app/environment';
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
    name: string;
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

  let size: BoardSize = $state(30);
  let tileSize = $state(18);
  let boardGap = $state(5);
  let boardPadding = $state(20);
  let grid = $state(createGrid(size, colors.length));
  let region: Set<number> = $state(new Set());
  let started = $state(false);
  let moves = $state(0);
  let seconds = $state(0);
  let timerId: ReturnType<typeof setInterval> | null = null;
  let won = $state(false);
  let regionColor: number | null = $state(null);
  let scores = $state(defaultScores());
  let scoresLoading = $state(true);
  let scoresError = $state('');
  let showNamePrompt = $state(false);
  let pendingScore = $state<{ moves: number; seconds: number } | null>(null);
  let playerName = $state('');
  let pageEl: HTMLDivElement | undefined;
  let headerEl: HTMLElement | null = $state(null);
  let scoresEl: HTMLElement | null = null;
  let lastLoadedSize: BoardSize | null = null;

  $effect(() => {
    if (!browser) return;

    if (lastLoadedSize !== size) {
      lastLoadedSize = size;
      loadScores(size);
    }

    updateTileSize();
    const onResize = () => updateTileSize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      stopTimer();
    };
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

  function normalizeName(value: string) {
    return value.replace(/[^a-z0-9]/gi, '').slice(0, 3).toUpperCase();
  }

  function isHighScore(value: number, time: number) {
    const list = scores[size] ?? [];
    if (list.length < 10) return true;
    const ranked = [...list]
      .slice()
      .sort((a, b) => (a.moves - b.moves) || (a.seconds - b.seconds));
    const last = ranked[ranked.length - 1];
    if (!last) return true;
    return value < last.moves || (value === last.moves && time < last.seconds);
  }

  async function recordScore(value: number, time: number, name: string) {
    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ size, moves: value, seconds: time, name })
      });
      if (!response.ok) throw new Error('Failed to save score');
      const data: { scores?: Score[] } = await response.json();
      scores = { ...scores, [size]: data.scores ?? [] };
    } catch (error) {
      scoresError = 'Could not save score.';
    }
  }

  function handleNameInput(event: Event) {
    const target = event.target as HTMLInputElement;
    playerName = normalizeName(target.value);
  }

  function submitName() {
    if (!pendingScore) return;
    const finalName = normalizeName(playerName || 'AAA');
    const { moves, seconds } = pendingScore;
    recordScore(moves, seconds, finalName);
    showNamePrompt = false;
    pendingScore = null;
    playerName = '';
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
      const finalMoves = moves;
      const finalSeconds = seconds;
      if (isHighScore(finalMoves, finalSeconds)) {
        pendingScore = { moves: finalMoves, seconds: finalSeconds };
        showNamePrompt = true;
        playerName = '';
      } else {
        recordScore(finalMoves, finalSeconds, 'AAA');
      }
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
    showNamePrompt = false;
    pendingScore = null;
    playerName = '';
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

      {#if showNamePrompt}
        <div class="name-card">
          <div>
            <p class="name-label">New High Score</p>
            <p class="name-title">Enter 3-letter name</p>
          </div>
          <div class="name-row">
            <input
              class="name-input"
              maxlength="3"
              placeholder="AAA"
              value={playerName}
              on:input={handleNameInput}
            />
            <button class="name-save" on:click={submitName}>Save</button>
          </div>
        </div>
      {/if}

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

  .name-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 18px;
    padding: 18px;
    display: grid;
    gap: 12px;
    box-shadow: 0 16px 28px rgba(30, 29, 40, 0.12);
  }

  .name-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  .name-label {
    margin: 0;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #68657c;
  }

  .name-row {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .name-input {
    flex: 1;
    border: 1px solid rgba(30, 29, 40, 0.2);
    border-radius: 12px;
    padding: 10px 12px;
    font-size: 16px;
    font-family: 'Fredoka', sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.2em;
  }

  .name-save {
    border: none;
    background: #1e1d28;
    color: #fff;
    border-radius: 12px;
    padding: 10px 16px;
    font-family: 'Fredoka', sans-serif;
    font-size: 14px;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .name-save:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 16px rgba(30, 29, 40, 0.2);
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
