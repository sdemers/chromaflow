<script lang="ts">
  type Props = {
    moves: number;
    time: string;
    size: 10 | 20 | 30;
    sizeOptions: Array<10 | 20 | 30>;
    setSize: (nextSize: 10 | 20 | 30) => void;
    resetGame: () => void;
  };

  let { moves, time, size, sizeOptions, setSize, resetGame }: Props = $props();
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
        <button class={`size ${size === option ? 'size--active' : ''}`} onclick={() => setSize(option)}>
          {option}x{option}
        </button>
      {/each}
    </div>
  </div>
  <button class="reset" onclick={resetGame}>New Board</button>
</div>
