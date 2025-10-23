<script lang="ts">
  import Icon from '$components/Icon.svelte';

  let {
    list = $bindable(),
    items,
    legend,
    button,
    filter = () => true,
  }: {
    list: Array<string>;
    items: Array<{
      id: string;
      title: string;
      rare?: boolean;
    }>;
    legend: string;
    button: string;
    filter?: (i: any) => boolean;
  } = $props();

  const options = $derived(
    items.filter((i) => !list.includes(i.id)).filter(filter),
  );

  let selected = $state('');

  function removeItem(item: string) {
    return function (e: Event) {
      e.preventDefault();
      const i = list?.indexOf(item);
      if (i > -1) list?.splice(i, 1);
    };
  }

  function addItem(e: Event) {
    e.preventDefault();
    if (selected) {
      if (list === undefined) {
        list = [selected];
      } else {
        list.push(selected);
      }
    }
    selected = '';
  }

  function display(i: string) {
    const f = items?.find((l) => l.id === i);
    if (f) {
      return f.title + (f.rare ? '*' : '');
    }

    return i;
  }
</script>

<fieldset>
  <legend>{legend}</legend>
  {#if list?.length}
    <ul role="list">
      {#each list as i}
        <li class="pill">
          <span>{display(i)}</span>
          <button class="remove" onclick={removeItem(i)}>
            <Icon label="remove" icon="close" />
          </button>
        </li>
      {/each}
    </ul>
  {/if}
  {#if options.length}
    <div class="actions">
      <select
        name="options--{legend.toLowerCase().replace(/\s/g, '-')}"
        aria-labelledby="options--{legend.toLowerCase().replace(/\s/g, '-')}"
        class="options"
        bind:value={selected}
      >
        <option value="">-</option>
        {#each options as o}
          <option value={o.id}>{o.title}{o.rare ? '*' : ''}</option>
        {/each}
      </select>
      <button
        id="options--{legend.toLowerCase().replace(/\s/g, '-')}"
        onclick={addItem}
        class="add">{button}</button
      >
    </div>
  {/if}
</fieldset>

<style lang="scss">
  fieldset {
    grid-column: 1 / -1;
    display: grid;
    gap: 1rem;
  }

  ul {
    display: flex;
    gap: 0.5rem;
    // row-gap: 0.25rem;
    flex-wrap: wrap;
  }

  .wrapper {
    position: relative;
  }

  .pill {
    font-size: 0.75rem;
    text-transform: uppercase;
    border: 1px solid black;
    padding: 0.25rem 0.5rem;
    border-radius: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background: var(--white);
  }

  .remove {
    height: 0.75rem;
    width: 0.75rem;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;

    :global(.icon) {
      height: 0.75rem;
      width: 0.75rem;
    }
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
  }

  .options {
    min-width: 50%;
    width: 100%;
  }

  .add {
    flex-shrink: 0;
  }
</style>
