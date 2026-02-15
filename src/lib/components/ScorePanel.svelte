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
