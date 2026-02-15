<script lang="ts">
  type Score = {
    moves: number;
    seconds: number;
    name: string;
  };

  export let size: 10 | 20 | 30;
  export let scoresLoading: boolean;
  export let scoresError: string;
  export let scores: Record<10 | 20 | 30, Score[]>;
  export let formatTime: (value: number) => string;
</script>

<section class="scores">
  <div class="scores__header">
    <h3>Best Runs</h3>
    <span class="label">{size}x{size}</span>
  </div>
  <div class="scores__list">
    {#if scoresLoading}
      <p class="score__empty">Loading scores...</p>
    {:else if scoresError}
      <p class="score__empty">{scoresError}</p>
    {:else if scores[size]?.length}
      {#each scores[size] as score, index}
        <div class="score">
          <span class="score__rank">#{index + 1}</span>
          <span class="score__name">{score.name || 'AAA'}</span>
          <span class="score__value">{score.moves} moves</span>
          <span class="score__time">{formatTime(score.seconds)}</span>
        </div>
      {/each}
    {:else}
      <p class="score__empty">No wins yet. Claim the first spot!</p>
    {/if}
  </div>
</section>

<style>
  .label {
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #68657c;
  }

  .scores {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 18px;
    padding: 20px;
    box-shadow: 0 16px 28px rgba(30, 29, 40, 0.12);
    min-width: 280px;
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

  .score__name {
    min-width: 3ch;
    font-weight: 700;
    letter-spacing: 0.2em;
    color: #1e1d28;
    text-align: right;
  }

  .score__empty {
    margin: 0;
    color: #4b4961;
  }
</style>
