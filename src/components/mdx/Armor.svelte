<script lang="ts">
  import { getCollection } from 'astro:content';

  const order = ['light', 'medium', 'heavy', 'shield'];

  const armor = await Promise.all(
    (await getCollection('armor'))
      .sort((a, b) => a.data.ac - b.data.ac)
      .sort((a, b) => order.indexOf(a.data.type) - order.indexOf(b.data.type)),
  );
</script>

<div class="wrapper">
  <table>
    <thead>
      <tr>
        <th style="width: 100%">Armor</th>
        <th style="width: 4ch; text-align: center">AC</th>
        <th style="width: 8ch; text-align: center">Type</th>
        <th style="width: 7ch; text-align: center">Power</th>
        <th style="width: 6ch; text-align: center;">Cost</th>
        <th style="width: 7ch; text-align: center;">Weight</th>
      </tr>
    </thead>
    <tbody>
      {#each armor as a}
        <tr>
          <td>{a.data.title}</td>
          <td style="text-align: center;"
            >{a.data.type === 'shield' ? '+' : ''}{a.data.ac}</td
          >
          <td style="text-align: center; text-transform: capitalize"
            >{a.data.type}</td
          >
          <td style="text-align: center;">{a.data.power}</td>
          <td style="text-align: center;">{a.data.cost}</td>
          <td style="text-align: center;"
            >{a.data.weight === 0.1 ? 'light' : a.data.weight}</td
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
