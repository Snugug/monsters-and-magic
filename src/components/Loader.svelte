<script lang="ts">
  let { size = '4rem' }: { size?: string } = $props();
</script>

<div class="loader" style:--size={size}></div>

<style>
  /* HTML: <div class="loader"></div> */
  .loader {
    width: var(--size);
    height: var(--size);
    aspect-ratio: 1 / 1;
    display: grid;
    color: transparent;
    font-size: 1px;
    overflow: hidden;
  }
  .loader::before,
  .loader::after {
    content: '';
    grid-area: 1/1;
    --c: no-repeat linear-gradient(var(--dark-yellow, #ffd700) 0 0);
    background:
      var(--c) 0 0,
      var(--c) 100% 0,
      var(--c) 100% 100%,
      var(--c) 0 100%;
    animation:
      l10-1 2s infinite linear,
      l10-2 2s infinite linear;
  }
  .loader::after {
    margin: 25%;
    transform: scale(-1);
  }
  @keyframes l10-1 {
    0% {
      background-size:
        0 0.25rem,
        0.25rem 0,
        0 0.25rem,
        0.25rem 0;
    }
    12.5% {
      background-size:
        100% 0.25rem,
        0.25rem 0,
        0 0.25rem,
        0.25rem 0;
    }
    25% {
      background-size:
        100% 0.25rem,
        0.25rem 100%,
        0 0.25rem,
        0.25rem 0;
    }
    37.5% {
      background-size:
        100% 0.25rem,
        0.25rem 100%,
        100% 0.25rem,
        0.25rem 0;
    }
    45%,
    55% {
      background-size:
        100% 0.25rem,
        0.25rem 100%,
        100% 0.25rem,
        0.25rem 100%;
    }
    62.5% {
      background-size:
        0 0.25rem,
        0.25rem 100%,
        100% 0.25rem,
        0.25rem 100%;
    }
    75% {
      background-size:
        0 0.25rem,
        0.25rem 0,
        100% 0.25rem,
        0.25rem 100%;
    }
    87.5% {
      background-size:
        0 0.25rem,
        0.25rem 0,
        0 0.25rem,
        0.25rem 100%;
    }
    100% {
      background-size:
        0 0.25rem,
        0.25rem 0,
        0 0.25rem,
        0.25rem 0;
    }
  }

  @keyframes l10-2 {
    0%,
    49.9% {
      background-position:
        0 0,
        100% 0,
        100% 100%,
        0 100%;
    }
    50%,
    100% {
      background-position:
        100% 0,
        100% 100%,
        0 100%,
        0 0;
    }
  }
</style>
