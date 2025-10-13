<script lang="ts">
  import { getCollection } from 'astro:content';

  let { simple = false } = $props();

  const foci = await Promise.all(
    (await getCollection('foci')).sort((a, b) =>
      a.data.title.localeCompare(b.data.title),
    ),
  );
</script>

<div class="wrapper">
  <table>
    <thead>
      <tr>
        <th style="width: 100%">Foci</th>
        <th style="width: 10ch">Properties</th>
        <th style="width: 6ch; text-align: center;">Cost</th>
        <th style="width: 7ch; text-align: center;">Weight</th>
      </tr>
    </thead>
    <tbody>
      {#each foci as focus}
        <tr>
          <td>{focus.data.title}</td>
          <td
            >{focus.data.properties.length > 0
              ? focus.data.properties.join(', ')
              : '-'}</td
          >
          <td style="text-align: center;">{focus.data.cost}</td>
          <td style="text-align: center;"
            >{focus.data.weight === 0.1 ? 'light' : focus.data.weight}</td
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
