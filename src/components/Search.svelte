<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from '$components/Icon.svelte';

  interface Pagefind {
    options: (options: PagefindOptions) => Promise<void>;
    init: () => Promise<void>;
    search: (query: string) => Promise<PagefindResponse>;
  }

  interface PagefindOptions {
    basePath: string;
  }

  interface PagefindResponse {
    results: PagefindResult[];
  }

  interface PagefindResult {
    id: string;
    data: () => Promise<PagefindDocument>;
  }

  interface PagefindDocument {
    url: string;
    raw_url: string;
    excerpt: string;
    filters: {
      author: string;
    };
    meta: {
      title: string;
      image: string;
    };
    content: string;
    word_count: number;
  }

  let basePath = import.meta.env.BASE_URL;
  if (!basePath.endsWith('/')) {
    basePath += '/';
  }
  basePath += 'pagefind/';

  let pagefind: Pagefind;
  let results: Array<PagefindDocument> | null = $state(null);
  let looked: string = $state('');
  let looking = $state('');
  let total: number = $state(0);
  let searchInput: HTMLInputElement;

  onMount(async () => {
    const pf = (await import(
      /* @vite-ignore */ `${basePath}pagefind.js`
    )) as Pagefind;

    await pf.options({
      basePath,
    });

    pf.init();

    pagefind = pf;
  });

  async function search(event: SubmitEvent) {
    event.preventDefault();
    window.location = `/search?q=${looked}`;
  }

  $effect(() => {
    if (looking === '') {
      results = null;
    } else {
      pagefind.search(looking).then(async ({ results: found }) => {
        if (found.length) {
          total = found.length;
          const max = total < 5 ? total : 5;
          const f = [];
          for (let i = 0; i < max; i++) {
            const d = await found[i].data();
            f.push(d);
          }
          results = f;
        } else {
          total = 0;
          results = [];
        }
        looked = looking;
      });
    }
  });

  function clear(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      looking = '';
      searchInput.focus();
    }
  }
</script>

<div class="search">
  <form onsubmit={search}>
    <input
      type="text"
      name="search"
      placeholder="Search"
      bind:value={looking}
      onkeyup={clear}
      bind:this={searchInput}
    />
    <button>
      <Icon label="Search" icon="search" />
    </button>
  </form>

  {#if results}
    <div class="results">
      <div class="total">
        <p>
          <strong>{looked}</strong> resulted in {total} result{total !== 1
            ? 's'
            : ''}.{results?.length < total ? ' Showing first 5.' : ''}
        </p>
        <!-- <a href={`/search?q=${looked}`} class="all" onkeyup={clear}
          ><span>See All</span><Icon icon="forward-arrow" hidden={true}
          ></Icon></a
        > -->
      </div>

      {#if results.length}
        <ul class="results--list" role="list">
          {#each results as result}
            <li class="results--list-item">
              <a href={result.url} class="result" onkeyup={clear}>
                <p class="result--title">{result.meta.title}</p>
                <p>{@html result.excerpt}</p>
              </a>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</div>

<style lang="scss">
  .search {
    position: relative;
  }

  .results {
    position: absolute;
    background: var(--white);
    width: 100%;
    border: 1px solid var(--black);
    padding: 0;
    max-height: calc(100vh - 3rem);
    overflow-y: auto;

    :global(mark) {
      background-color: var(--light-yellow);
    }

    &--list {
      padding: 0;

      &-item {
        &:first-of-type {
          border-top: 1px solid var(--black);
        }
        &:not(:last-of-type) .result {
          border-bottom: 1px solid var(--black);
        }
      }
    }
  }

  .total {
    padding: 0.5rem;
    display: grid;
    grid-template-columns: auto max-content;
    gap: 1rem;
  }

  .all {
    display: grid;
    grid-template-columns: auto 1rem;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    color: var(--black);

    :global(.icon) {
      height: 1rem;
      width: 1rem;
      fill: currentColor;
    }
  }

  .result {
    color: var(--black);
    text-decoration: none;
    display: block;
    padding-block: 0.5rem;
    padding-inline: 1rem;

    &:focus {
      outline: none;
      background: var(--light-purple);
    }

    &--title {
      font-weight: 700;
    }
  }

  form {
    display: grid;
    grid-template-columns: auto 1.5rem;
    gap: 0;

    button {
      grid-column: 2 / span 1;
      grid-row: 1;

      border: 0;
      padding: 0;
      background: none;

      :global(svg) {
        height: 1.25rem;
        width: 1.25rem;
        margin-inline-end: 0.25rem;
        fill: var(--white);
      }
    }
  }

  [name='search'] {
    background: transparent;
    border: 1px solid var(--grey);
    border-radius: 5px;
    color: white;
    padding: 0.25rem;
    font-size: 1rem;
    height: 1.5rem;
    width: 100%;
    grid-column: 1 / span 2;
    grid-row: 1;
    padding-inline-end: 1.75rem;

    // &:focus {
    //   outline: none;
    //   border-color: var(--light-purple);
    // }
  }
</style>
