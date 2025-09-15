<script>
  import Mark from '$assets/micro.svg?raw';
  import CompactWordmark from '$assets/wordmark.svg?raw';
  import Icon from '$components/Icon.svelte';
  import Search from '$components/Search.svelte';

  let { children } = $props();
</script>

<header>
  <div class="inner">
    <a href="/" class="menu">
      {@html Mark}
    </a>

    <div class="hoisted">
      {@render children?.()}
    </div>

    <div class="search"><Search /></div>

    <button class="open" popovertarget="global-nav">
      <Icon label="Open Menu" icon="menu"></Icon>
    </button>
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
  :global(:root) {
    --header-height: calc(3rem + 2px);
  }

  :global(body:has(#global-nav:popover-open)) {
    overflow: hidden;

    .inner {
      transform: translateX(-20rem);
    }
  }

  header {
    border-bottom: 2px solid var(--purple);
    background: var(--offblack);
    height: var(--header-height);
    // overflow: hidden;
    position: fixed;
    width: 100%;
  }

  .inner {
    transition: transform 0.25s ease-in-out;
    padding: 0.75rem;

    display: grid;
    grid-template-columns: 3rem min-content auto 1.5rem;
    gap: 1rem;
  }

  .search {
    grid-column: 3 / span 1;
  }

  .open {
    grid-column: 4 / span 1;
    border: 0;
    padding: 0;
    background: none;
    // background: red;
    cursor: pointer;

    :global(svg) {
      height: 1.5rem;
      width: 1.5rem;
      fill: var(--white);
    }
  }

  :global(.micromark),
  :global(.compactmark) {
    fill: var(--white);
  }

  .menu {
    height: 1.5rem;
  }

  #global-nav {
    width: calc(100% - 5.5rem);
    max-width: 20rem;
    display: block;
    left: 100%;
    // transform: translateX(100%);
    transition: transform 0.25s ease-in-out;
    height: 100vh;
    background: var(--offblack);
    color: var(--white);
    border: 0;
    display: grid;
    padding: 0;

    &:popover-open {
      transform: translateX(-100%);
    }

    &::backdrop {
      opacity: 0;
      background: black;
      width: 100vw;
      height: calc(100vh - var(--header-height));
      top: var(--header-height);
      transition: opacity 0.25s ease-in-out;
    }

    &:popover-open::backdrop {
      opacity: 0.5;
    }
  }

  .home-link {
    padding: 0.75rem;
    height: var(--header-height);
    display: flex;
    justify-content: center;
    // border-bottom: 2px solid var(--purple);

    :global(svg) {
      height: 1.5rem;
      fill: var(--white);
    }
  }

  // body:has(:popover-open) .inner {
  //   transform: translateX(20rem);
  // }
</style>
