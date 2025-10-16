<script lang="ts">
  import { getCollection } from 'astro:content';

  const { type }: { type: 'rune' | 'seal' } = $props();

  const modifications = await Promise.all(
    (await getCollection('modifications')).sort((a, b) =>
      a.data.title.localeCompare(b.data.title),
    ),
  );

  const items = Object.groupBy(modifications, (i) => i.data.type)[type];
</script>

<div class="wrapper">
  <table>
    <thead>
      <tr>
        <th style="text-transform: capitalize">{type.replace(/s$/, '')}</th>
        <th>Weapon</th>
        <th>Armor</th>
        <th>Focus</th>
      </tr>
    </thead>
    <tbody>
      {#each items as item}
        <tr>
          <td>{item.data.title}</td>
          <td style={!item.data.weapon ? 'text-align: center' : ''}
            >{item.data.weapon || '-'}</td
          >
          <td style={!item.data.armor ? 'text-align: center' : ''}
            >{item.data.armor || '-'}</td
          >
          <td style={!item.data.focus ? 'text-align: center' : ''}
            >{item.data.focus || '-'}</td
          >
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
</style>
