<script lang="ts">
  import { getCollection } from 'astro:content';
  import { modificationCost } from '$lib/modifications';
  import Icon from '$components/Icon.svelte';

  const { type }: { type: 'rune' | 'seal' } = $props();

  const modifications = await Promise.all(
    (await getCollection('modifications'))
      .sort((a, b) => a.data.title.localeCompare(b.data.title))
      .sort((a, b) => {
        if (a.data.rare && !b.data.rare) return 1;
        if (!a.data.rare && b.data.rare) return -1;
        return 0;
      }),
  );

  const items = Object.groupBy(modifications, (i) => i.data.type)[type];
</script>

<div class="wrapper">
  <table>
    <thead>
      <tr>
        <th>Weapon</th>
        <th>Armor</th>
        <th>Focus</th>
        <th style="width: 7ch;">Cost</th>
      </tr>
    </thead>
    <tbody>
      {#each items as item}
        <tr>
          <th style="text-transform: capitalize" colspan="4">
            <div class="title">
              <span>{item.data.title}</span>
              {#if item.data.rare}
                <span class="rare">
                  <Icon label="Rare Feat" icon="flare" />
                </span>
              {/if}
            </div>
          </th>
        </tr>
        <tr>
          <td style={!item.data.weapon ? 'text-align: center' : ''}
            >{item.data.weapon || '-'}</td
          >
          <td style={!item.data.armor ? 'text-align: center' : ''}
            >{item.data.armor || '-'}</td
          >
          <td style={!item.data.focus ? 'text-align: center' : ''}
            >{item.data.focus || '-'}</td
          >
          <td>{modificationCost(item)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style lang="scss">
  .wrapper {
    overflow-x: auto;
    width: 100%;
  }

  table {
    width: 100%;
  }

  .title {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    width: 100%;

    :global(svg) {
      height: 0.75em;
      width: 0.75em;
    }
  }
</style>
