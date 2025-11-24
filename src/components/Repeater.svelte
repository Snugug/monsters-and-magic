<script module>
  export interface RepeaterActions {
    up: (i: number) => Snippet;
    down: (i: number) => Snippet;
    remove: (i: number) => Snippet;
    add: (i: number) => Snippet;
    all: (i: number) => Snippet;
  }
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    list = $bindable(),
    base,
    empty = 'Add',
    item,
    min = 0,
  }: {
    list: Array<any>;
    base: any;
    empty?: string;
    min?: number;
    item: Snippet<[{ l: any }, { i: number }, { actions: typeof all }]>;
  } = $props();

  function nw(i: number, action: 'add' | 'subtract' | 'up' | 'down') {
    return function (e: Event) {
      e.preventDefault();
      if (action === 'add') {
        list.push(base);
      }
      if (action === 'subtract') {
        list.splice(i, 1);
      }
      if (action === 'up' || action === 'down') {
        const newPos = action === 'up' ? i - 1 : i + 1;
        list.splice(newPos, 0, ...list.splice(i, 1));
      }
    };
  }

  function startList(e: Event) {
    e.preventDefault();
    list.push(base);
  }

  const all = {
    up,
    down,
    remove,
    add,
    all: actions,
  } as const;
</script>

{#snippet up(i: number)}
  <button aria-label="Move Up" onclick={nw(i, 'up')} disabled={i === 0}>
    ↑
  </button>
{/snippet}

{#snippet down(i: number)}
  <button
    onclick={nw(i, 'down')}
    aria-label="Move Down"
    disabled={i === list.length - 1}
  >
    ↓
  </button>
{/snippet}

{#snippet remove(i: number)}
  <button
    aria-label="Remove"
    onclick={nw(i, 'subtract')}
    disabled={list.length - 1 < min}
  >
    -
  </button>
{/snippet}

{#snippet add(i: number)}
  <button aria-label="Add Another" onclick={nw(i, 'add')}>+</button>
{/snippet}

{#snippet actions(i: number)}
  <div class="actions">
    {@render up(i)}
    {@render down(i)}
    {@render remove(i)}
    {@render add(i)}
  </div>
{/snippet}

{#if list && list.length === 0}
  <button class="empty" onclick={startList}>{empty}</button>
{/if}

{#each list as l, i}
  {@render item(l, i, all)}
{/each}

<style lang="scss">
  .actions {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    padding-top: 0.75rem;
    justify-content: center;
  }

  button:not(.empty) {
    padding: 0;
    margin: 0;
    border: 0;
    // border: 0;
    background: 0;
    aspect-ratio: 1 / 1;
    font-weight: bold;
  }
</style>
