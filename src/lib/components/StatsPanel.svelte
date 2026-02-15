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

<style>
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
</style>
