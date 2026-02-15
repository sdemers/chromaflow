<script>
  const size = 30;
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

  let grid = createGrid();
  let region = new Set();
  let started = false;
  let moves = 0;
  let won = false;
  let regionColor = null;

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
    won = checkWin();
  }

  function resetGame() {
    grid = createGrid();
    region = new Set();
    started = false;
    moves = 0;
    won = false;
    regionColor = null;
  }
</script>

<svelte:head>
  <title>Chromaflow Grid</title>
</svelte:head>

<div class="page">
  <header class="hero">
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
        <span class="label">Region</span>
        <span class="value">{region.size}</span>
      </div>
      <button class="reset" on:click={resetGame}>New Board</button>
    </div>
  </header>

  <section class="board" aria-live="polite">
    {#each grid as row, rowIndex}
      {#each row as colorIndex, colIndex}
        {@const id = indexOf(rowIndex, colIndex)}
        <button
          class={`tile ${region.has(id) ? 'tile--active' : ''} ${started && !region.has(id) && isAdjacentToRegion(rowIndex, colIndex) ? 'tile--hint' : ''}`}
          style={`background: ${colors[colorIndex]}`}
          on:click={() => handleClick(rowIndex, colIndex)}
          aria-label={`Tile ${rowIndex + 1}-${colIndex + 1}`}
        />
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

<style>
  @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600&family=Space+Grotesk:wght@400;600&display=swap');

  :global(body) {
    margin: 0;
    font-family: 'Space Grotesk', system-ui, sans-serif;
    background: radial-gradient(circle at top, #fff7e8 0%, #f2f1ff 45%, #e8f7f1 100%);
    color: #1e1d28;
    min-height: 100vh;
  }

  .page {
    max-width: 1320px;
    margin: 0 auto;
    padding: 32px 24px 64px;
    display: grid;
    gap: 28px;
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

  .board {
    --tile-size: 20px;
    display: grid;
    grid-template-columns: repeat(30, var(--tile-size));
    gap: 5px;
    background: rgba(255, 255, 255, 0.7);
    padding: 20px;
    border-radius: 18px;
    box-shadow: 0 20px 40px rgba(30, 29, 40, 0.16);
    max-width: 1160px;
    margin: 0 auto;
  }

  .tile {
    width: var(--tile-size);
    height: var(--tile-size);
    border: none;
    border-radius: 8px;
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
    background: rgba(255, 255, 255, 0.95);
    border-radius: 18px;
    padding: 20px;
    text-align: center;
    box-shadow: 0 14px 32px rgba(30, 29, 40, 0.18);
  }

  .win h2 {
    font-family: 'Fredoka', sans-serif;
    margin: 0 0 6px;
  }

  .win p {
    margin: 0 0 12px;
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
  }

  @media (max-width: 600px) {
    .page {
      padding: 24px 16px 48px;
    }
  }
</style>
