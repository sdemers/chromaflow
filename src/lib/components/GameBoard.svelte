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
  export let showNamePrompt: boolean;
  export let playerName: string;
  export let handleNameInput: (event: Event) => void;
  export let submitName: () => void;

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
      {#if showNamePrompt}
        <div class="name-card name-card--inline highscore-panel">
          <div class="highscore-badge">New High Score</div>
          <div class="highscore-header">
            <p class="highscore-title">Legendary run!</p>
            <span class="highscore-value">{moves} moves</span>
          </div>
          <p class="highscore-subtitle">
            You set a new record. Enter your initials to claim the spot.
          </p>
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
          <p class="highscore-footer">Your name will appear on the leaderboard.</p>
        </div>
      {/if}
      <button class="reset" on:click={resetGame}>Play Again</button>
    </div>
  {/if}
</div>
