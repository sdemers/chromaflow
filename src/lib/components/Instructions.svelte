<script lang="ts">
  export let element: HTMLElement | null = null;
</script>

<header class="hero" bind:this={element}>
  <p class="eyebrow">Chromaflow</p>
  <h1>Paint the board with the fewest moves.</h1>
  <p class="subtitle">
    Start on any tile, then click neighboring tiles to flood the highlighted region with their
    color. Make all tiles match.
  </p>
</header>
