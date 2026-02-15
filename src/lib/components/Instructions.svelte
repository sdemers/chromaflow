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

<style>
  .hero {
    display: grid;
    gap: 8px;
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
</style>
