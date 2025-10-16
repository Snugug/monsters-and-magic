<script>
  import { getCollection } from 'astro:content';

  function normalize(type) {
    return (item) => ({
      title: item.data.title,
      cost: item.data.cost,
      weight: item.data.weight,
      crafting: item.data.crafting,
      countdown:
        (item.data.crafting.wood +
          item.data.crafting.cloth +
          item.data.crafting.hide +
          item.data.crafting.metal) *
          2 +
        Math.floor(item.data.cost / 50) +
        2,
      type,
    });
  }

  const weapons = (await getCollection('weapons')).map(normalize('weapons'));

  const wt = weapons.map((w) => w.title);

  const foci = (await getCollection('foci'))
    .map(normalize('foci'))
    .filter((a) => !wt.includes(a.title));

  const armor = (await getCollection('armor')).map(normalize('armor'));

  const gear = (await getCollection('gear')).map(normalize('gear'));

  const order = ['weapons', 'foci', 'armor', 'gear'];

  const equipment = Object.groupBy(
    Array.from(new Set([...weapons, ...foci, ...armor, ...gear])).sort((a, b) =>
      a.title.localeCompare(b.title),
    ),
    (a) => a.type,
  );
</script>

<div class="wrapper">
  <table>
    <thead>
      <tr>
        <th style="width: 100%;">Item</th>
        <th style="width: 7ch; text-align: center;">Cloth</th>
        <th style="width: 7ch; text-align: center;">Hide</th>
        <th style="width: 7ch; text-align: center;">Wood</th>
        <th style="width: 7ch; text-align: center;">Metal</th>
        <th style="width: 7ch; text-align: center;">Count</th>
      </tr>
    </thead>
    <tbody>
      {#each order as o}
        {#if equipment[o]}
          <tr>
            <th colspan="6" style="text-transform: capitalize;">{o}</th>
          </tr>
          {#each equipment[o] as e}
            <tr>
              <td>{e.title}</td>
              <td style="text-align: center;">{e.crafting.cloth}</td>
              <td style="text-align: center;">{e.crafting.hide}</td>
              <td style="text-align: center;">{e.crafting.wood}</td>
              <td style="text-align: center;">{e.crafting.metal}</td>
              <td style="text-align: center;">{e.countdown}</td>
            </tr>
          {/each}
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
