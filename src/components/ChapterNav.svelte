<script lang="ts">
  import Icon from '$components/Icon.svelte';

  interface Link {
    url: String;
    title: String;
    chapter: Number;
  }

  const { previous, next }: { previous: Link; next: Link } = $props();
</script>

<nav class="chapter-nav">
  <ul role="list" class="nav">
    <li class="modesto" aria-hidden={previous === undefined}>
      {#if previous}
        <a href={previous.url}>
          <Icon hidden={true} icon="forward"></Icon>
          <span
            >{previous.chapter === 0 ? 'Introduction:' : `${previous.chapter}.`}
            {previous.title}</span
          >
        </a>
      {/if}
    </li>
    <li>
      <a href="/rules">
        <Icon label="Table of Contents" icon="book-ribbon"></Icon>
      </a>
    </li>
    <li class="modesto" aria-hidden={next === undefined}>
      {#if next}
        <a href={next.url}>
          <span>{next.chapter}. {next.title}</span>
          <Icon hidden={true} icon="forward"></Icon>
        </a>
      {/if}
    </li>
  </ul>
</nav>

<style lang="scss">
  .chapter-nav {
    background: var(--white);
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--dark-yellow);
  }
  .nav {
    display: grid;
    grid-template-columns: 1fr 1.5rem 1fr;
    gap: 1rem;

    li {
      &:first-of-type {
        a {
          justify-content: flex-start;
        }
        :global(svg) {
          transform: scaleX(-100%);
        }
      }
      &:last-of-type a {
        justify-content: flex-end;
      }
    }

    a {
      text-decoration: none;
      color: var(--black);
      display: flex;
      width: 100%;
      gap: 0rem;
    }

    :global(svg) {
      height: 1.5rem;
      width: 1.5rem;
      flex-shrink: 0;
    }
  }
</style>
