<script lang="ts">
  import { getCollection } from 'astro:content';

  const gear = await Promise.all(
    (await getCollection('gear')).sort((a, b) =>
      a.data.title.localeCompare(b.data.title),
    ),
  );
</script>

<div class="wrapper">
  <table>
    <thead>
      <tr>
        <th style="width: 30%">Gear</th>
        <th style="width: 70%">Description</th>
        <th style="width: 6ch; text-align: center;">Cost</th>
        <th style="width: 7ch; text-align: center;">Weight</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th colspan="4">Adventuring Gear</th>
      </tr>
      {#each gear as g}
        {#if g.data.tool === false && g.data.instrument === false}
          <tr>
            <td>{g.data.title}</td>
            <td>{@html g.rendered.html}</td>
            <td style="text-align: center;">{g.data.cost}</td>
            <td style="text-align: center;"
              >{g.data.weight === 0.1 ? 'light' : g.data.weight}</td
            >
          </tr>
        {/if}
      {/each}
      <tr>
        <th colspan="4">Instruments</th>
      </tr>
      {#each gear as g}
        {#if g.data.instrument === true}
          <tr>
            <td>{g.data.title}</td>
            <td>{@html g.rendered.html}</td>
            <td style="text-align: center;">{g.data.cost}</td>
            <td style="text-align: center;"
              >{g.data.weight === 0.1 ? 'light' : g.data.weight}</td
            >
          </tr>
        {/if}
      {/each}
      <tr>
        <th colspan="4">Tools</th>
      </tr>
      {#each gear as g}
        {#if g.data.tool === true}
          <tr>
            <td>{g.data.title}</td>
            <td>{@html g.rendered.html}</td>
            <td style="text-align: center;">{g.data.cost}</td>
            <td style="text-align: center;"
              >{g.data.weight === 0.1 ? 'light' : g.data.weight}</td
            >
          </tr>
        {/if}
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
