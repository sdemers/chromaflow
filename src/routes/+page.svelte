<script>
  import { onDestroy, onMount } from 'svelte';

  const sizeOptions = [10, 20, 30];
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

  let size = 30;
  let tileSize = 18;
  let boardGap = 5;
  let boardPadding = 20;
  let grid = createGrid();
  let region = new Set();
  let started = false;
  let moves = 0;
  let seconds = 0;
  let timerId = null;
  let won = false;
  let regionColor = null;
  let scores = defaultScores();
  let scoresLoading = true;
  let scoresError = '';
  let pageEl;
  let headerEl;
  let scoresEl;

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

  function defaultScores() {
    return { 10: [], 20: [], 30: [] };
  }

  async function loadScores(boardSize) {
    scoresLoading = true;
    scoresError = '';
    try {
      const response = await fetch(`/api/scores?size=${boardSize}`);
      if (!response.ok) throw new Error('Failed to load scores');
      const data = await response.json();
      scores = { ...scores, [String(boardSize)]: data.scores ?? [] };
    } catch (error) {
      scoresError = 'Could not load scores.';
    } finally {
      scoresLoading = false;
    }
  }

  async function recordScore(value) {
    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ size, moves: value, seconds })
      });
      if (!response.ok) throw new Error('Failed to save score');
      const data = await response.json();
      scores = { ...scores, [String(size)]: data.scores ?? [] };
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

  function createGrid() {
    return Array.from({ length: size }, () =>
      Array.from({ length: size }, () => Math.floor(Math.random() * colors.length))
    );
  }

  function indexOf(row, col) {
    return row * size + col;
  }

  function inBounds(row, col) {
    return row >= 0 && row < size && col >= 0 && col < size;
  }

  function neighbors(row, col) {
    return [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1]
    ].filter(([r, c]) => inBounds(r, c));
  }

  function floodFill(startRow, startCol, targetColor) {
    const filled = new Set();
    const stack = [[startRow, startCol]];

    while (stack.length) {
      const [row, col] = stack.pop();
      const id = indexOf(row, col);
      if (filled.has(id)) continue;
      if (grid[row][col] !== targetColor) continue;
      filled.add(id);
      for (const [r, c] of neighbors(row, col)) {
        if (!filled.has(indexOf(r, c))) stack.push([r, c]);
      }
    }

    return filled;
  }

  function isAdjacentToRegion(row, col) {
    for (const [r, c] of neighbors(row, col)) {
      if (region.has(indexOf(r, c))) return true;
    }
    return false;
  }

  function recolorRegion(newColor) {
    for (const id of region) {
      const row = Math.floor(id / size);
      const col = id % size;
      grid[row][col] = newColor;
    }
  }

  function expandRegion(newColor) {
    const expanded = new Set(region);
    const stack = Array.from(region, (id) => [Math.floor(id / size), id % size]);

    while (stack.length) {
      const [row, col] = stack.pop();
      for (const [r, c] of neighbors(row, col)) {
        const id = indexOf(r, c);
        if (expanded.has(id)) continue;
        if (grid[r][c] !== newColor) continue;
        expanded.add(id);
        stack.push([r, c]);
      }
    }

    region = expanded;
  }

  function checkWin() {
    const firstColor = grid[0][0];
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        if (grid[row][col] !== firstColor) return false;
      }
    }
    return true;
  }

  function handleClick(row, col) {
    if (won) return;

    if (!started) {
      started = true;
      startTimer();
      region = floodFill(row, col, grid[row][col]);
      regionColor = grid[row][col];
      return;
    }

    const id = indexOf(row, col);
    if (region.has(id)) return;
    if (!isAdjacentToRegion(row, col)) return;

    const targetColor = grid[row][col];
    if (targetColor === regionColor) return;

    recolorRegion(targetColor);
    expandRegion(targetColor);
    regionColor = targetColor;
    moves += 1;
    if (checkWin()) {
      won = true;
      stopTimer();
      recordScore(moves);
    }
  }

  function resetGame() {
    stopTimer();
    grid = createGrid();
    region = new Set();
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

  function formatTime(value) {
    const minutes = Math.floor(value / 60);
    const remaining = value % 60;
    return `${minutes}:${String(remaining).padStart(2, '0')}`;
  }

  function setSize(nextSize) {
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
  <header class="hero" bind:this={headerEl}>
    <div>
      <p class="eyebrow">Chromaflow</p>
      <h1>Paint the board with the fewest moves.</h1>
      <p class="subtitle">
        Start on any tile, then click neighboring tiles to flood the highlighted region with their
        color. Make all tiles match.
      </p>
    </div>
    <div class="panel">
      <div>
        <span class="label">Moves</span>
        <span class="value">{moves}</span>
      </div>
      <div>
        <span class="label">Time</span>
        <span class="value">{formatTime(seconds)}</span>
      </div>
      <div>
        <span class="label">Board Size</span>
        <div class="sizes">
          {#each sizeOptions as option}
            <button
              class={`size ${size === option ? 'size--active' : ''}`}
              on:click={() => setSize(option)}
            >
              {option}x{option}
            </button>
          {/each}
        </div>
      </div>
      <button class="reset" on:click={resetGame}>New Board</button>
    </div>
  </header>

  <section class="play">
    <div class="board-wrap">
      <section
        class="board"
        style={`--tile-size: ${tileSize}px; --board-size: ${size}; --tile-gap: ${boardGap}px; --board-padding: ${boardPadding}px;`}
        aria-live="polite"
      >
        {#each grid as row, rowIndex}
          {#each row as colorIndex, colIndex}
            {@const id = indexOf(rowIndex, colIndex)}
            <button
              class={`tile ${region.has(id) ? 'tile--active' : ''} ${started && !region.has(id) && isAdjacentToRegion(rowIndex, colIndex) ? 'tile--hint' : ''}`}
              style={`background: ${colors[colorIndex]}`}
              on:click={() => handleClick(rowIndex, colIndex)}
              aria-label={`Tile ${rowIndex + 1}-${colIndex + 1}`}
            ></button>
          {/each}
        {/each}
      </section>

      {#if won}
        <div class="win">
          <h2>Perfect flood!</h2>
          <p>You filled the board in {moves} moves.</p>
          <button class="reset" on:click={resetGame}>Play Again</button>
        </div>
      {/if}
    </div>

    <section class="scores" bind:this={scoresEl}>
      <div class="scores__header">
        <h3>Best Runs</h3>
        <span class="label">{size}x{size}</span>
      </div>
      <div class="scores__list">
        {#if scoresLoading}
          <p class="score__empty">Loading scores...</p>
        {:else if scoresError}
          <p class="score__empty">{scoresError}</p>
        {:else if scores[String(size)]?.length}
          {#each scores[String(size)] as score, index}
            <div class="score">
              <span class="score__rank">#{index + 1}</span>
              <span class="score__value">{score.moves} moves</span>
              <span class="score__time">{formatTime(score.seconds)}</span>
            </div>
          {/each}
        {:else}
          <p class="score__empty">No wins yet. Claim the first spot!</p>
        {/if}
      </div>
    </section>
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

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 280px;
    gap: 24px;
    align-items: center;
  }

  .eyebrow {
    font-family: 'Fredoka', sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    font-size: 12px;
    color: #3d3a5b;
    margin: 0 0 6px;
  }

  h1 {
    font-family: 'Fredoka', sans-serif;
    font-size: clamp(28px, 4vw, 44px);
    margin: 0 0 8px;
  }

  .subtitle {
    margin: 0;
    max-width: 560px;
    line-height: 1.5;
    color: #4b4961;
  }

  .panel {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 18px;
    padding: 18px;
    display: grid;
    gap: 12px;
    box-shadow: 0 16px 28px rgba(30, 29, 40, 0.12);
  }

  .panel > div {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
  }

  .label {
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #68657c;
  }

  .value {
    font-size: 24px;
    font-weight: 600;
  }

  .reset {
    border: none;
    background: linear-gradient(135deg, #2c2a45, #4b3f88);
    color: #fff;
    border-radius: 999px;
    padding: 10px 16px;
    font-family: 'Fredoka', sans-serif;
    font-size: 14px;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .reset:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 16px rgba(45, 39, 86, 0.25);
  }

  .sizes {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 8px;
  }

  .size {
    border: 1px solid rgba(30, 29, 40, 0.2);
    background: transparent;
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.2s ease, border-color 0.2s ease;
  }

  .size--active {
    background: rgba(30, 29, 40, 0.1);
    border-color: rgba(30, 29, 40, 0.4);
    font-weight: 600;
  }

  .board-wrap {
    position: relative;
    justify-self: start;
  }

  .play {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 260px;
    gap: 20px;
    align-items: start;
    margin-top: -8px;
  }

  .board {
    display: grid;
    grid-template-columns: repeat(var(--board-size), var(--tile-size));
    gap: var(--tile-gap);
    background: rgba(255, 255, 255, 0.7);
    padding: var(--board-padding);
    border-radius: 18px;
    box-shadow: 0 20px 40px rgba(30, 29, 40, 0.16);
    max-width: 1160px;
    margin: 0;
  }

  .tile {
    width: var(--tile-size);
    height: var(--tile-size);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    position: relative;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .tile--active {
    box-shadow: 0 0 0 3px rgba(30, 29, 40, 0.45);
    transform: scale(1.02);
  }

  .tile--hint {
    box-shadow: 0 0 0 2px rgba(30, 29, 40, 0.2);
  }

  .tile:focus-visible {
    outline: 2px solid #1e1d28;
    outline-offset: 2px;
  }

  .win {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    text-align: center;
    background: rgba(255, 255, 255, 0.92);
    border-radius: 18px;
    padding: 24px;
    box-shadow: 0 14px 32px rgba(30, 29, 40, 0.18);
    backdrop-filter: blur(6px);
  }

  .win h2 {
    font-family: 'Fredoka', sans-serif;
    margin: 0 0 6px;
  }

  .win p {
    margin: 0 0 12px;
    color: #4b4961;
  }

  .scores {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 18px;
    padding: 20px;
    box-shadow: 0 16px 28px rgba(30, 29, 40, 0.12);
  }

  .scores__header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 12px;
  }

  .scores__header h3 {
    margin: 0;
    font-family: 'Fredoka', sans-serif;
    font-size: 20px;
  }

  .scores__list {
    display: grid;
    gap: 8px;
  }

  .score {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border-radius: 12px;
    background: rgba(30, 29, 40, 0.06);
    gap: 10px;
  }

  .score__rank {
    font-weight: 600;
  }

  .score__value {
    color: #4b4961;
  }

  .score__time {
    font-weight: 600;
    color: #2c2a45;
  }

  .score__empty {
    margin: 0;
    color: #4b4961;
  }

  @media (max-width: 900px) {
    .hero {
      grid-template-columns: 1fr;
    }

    .board {
      gap: 3px;
      padding: 12px;
    }

    .play {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 600px) {
    .page {
      padding: 24px 16px 48px;
    }
  }
</style>
