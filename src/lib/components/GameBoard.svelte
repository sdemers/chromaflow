<script lang="ts">
  import { indexOf } from '$lib/game/logic';

  type Grid = number[][];

  export let grid: Grid;
  export let colors: string[];
  export let size: 10 | 20 | 30;
  export let tileSize: number;
  export let boardGap: number;
  export let boardPadding: number;
  export let region: Set<number>;
  export let started: boolean;
  export let won: boolean;
  export let moves: number;

  export let handleClick: (row: number, col: number) => void;
  export let isAdjacentToRegion: (row: number, col: number) => boolean;
  export let resetGame: () => void;
</script>

<div class="board-wrap">
  <section
    class="board"
    style={`--tile-size: ${tileSize}px; --board-size: ${size}; --tile-gap: ${boardGap}px; --board-padding: ${boardPadding}px; --tile-radius: ${size === 10 ? 8 : 4}px;`}
    aria-live="polite"
  >
    {#each grid as row, rowIndex}
      {#each row as colorIndex, colIndex}
        {@const id = indexOf(rowIndex, colIndex, size)}
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

<style>
  .board-wrap {
    position: relative;
    justify-self: start;
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
    border-radius: var(--tile-radius, 4px);
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

  @media (max-width: 900px) {
    .board {
      gap: 3px;
      padding: 12px;
    }
  }
</style>
