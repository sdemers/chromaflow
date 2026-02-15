<script lang="ts">
  export let moves: number;
  export let time: string;
  export let size: 10 | 20 | 30;
  export let sizeOptions: Array<10 | 20 | 30>;
  export let setSize: (nextSize: 10 | 20 | 30) => void;
  export let resetGame: () => void;
</script>

<div class="panel">
  <div>
    <span class="label">Moves</span>
    <span class="value">{moves}</span>
  </div>
  <div>
    <span class="label">Time</span>
    <span class="value">{time}</span>
  </div>
  <div>
    <span class="label">Board Size</span>
    <div class="sizes">
      {#each sizeOptions as option}
        <button class={`size ${size === option ? 'size--active' : ''}`} on:click={() => setSize(option)}>
          {option}x{option}
        </button>
      {/each}
    </div>
  </div>
  <button class="reset" on:click={resetGame}>New Board</button>
</div>
