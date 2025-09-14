<script>
  import Mark from '$assets/micro.svg?raw';
  import CompactWordmark from '$assets/wordmark.svg?raw';

  let { children } = $props();

  let open = $state(false);

  $effect(() => {
    console.log(open);
  });
</script>

<header>
  <div class="inner">
    <button class="menu ribbon" popovertarget="global-nav">
      {@html Mark}
    </button>

    {@render children?.()}
  </div>
</header>

<div id="global-nav" popover>
  <!-- <button popovertarget="global-nav">Close</button> -->
  <a href="/" class="home-link">
    {@html CompactWordmark}
  </a>
  <nav class="holder">
    <ul role="list">
      <li><a href="/characters">Characters</a></li>
      <li><a href="/rules">Rules</a></li>
    </ul>
  </nav>
</div>

<style lang="scss">
  :global(body:has(#global-nav:popover-open)) {
    overflow: hidden;

    .inner {
      transform: translateX(20rem);
    }
  }

  header {
    border-bottom: 2px solid var(--purple);
    background: var(--offblack);
    overflow: hidden;
    position: fixed;
    width: 100%;
    height: 3.75rem;
  }

  .inner {
    transition: transform 0.25s ease-in-out;
    padding: 0.75rem;
  }

  :global(.micromark),
  :global(.compactmark) {
    fill: var(--white);
  }

  .menu {
    padding: 0;
    border: 0;
    width: 4rem;
    background: none;
    // background: red;
    cursor: pointer;
    position: relative;
    z-index: 2;
  }

  #global-nav {
    width: calc(100% - 5.5rem);
    max-width: 20rem;
    display: block;
    transform: translateX(-100%);
    transition: transform 0.25s ease-in-out;
    height: 100vh;
    background: var(--offblack);
    color: var(--white);
    border: 0;
    display: grid;

    &:popover-open {
      transform: translateX(0%);
    }

    &::backdrop {
      opacity: 0;
      background: black;
      width: 100vw;
      height: calc(100vh - 3.75rem);
      top: 3.75rem;
      transition: opacity 0.25s ease-in-out;
    }

    &:popover-open::backdrop {
      opacity: 0.5;
    }
  }

  .home-link {
    padding: 0.75rem;
  }

  // body:has(:popover-open) .inner {
  //   transform: translateX(20rem);
  // }
</style>
