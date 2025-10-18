<script>
  import { getCollection } from 'astro:content';
  import { modificationCost } from '$lib/modifications';
  import Icon from '$components/Icon.svelte';

  function normalize(type) {
    return (item) => {
      let cost = item.data.cost;

      if (type === 'runes' || type === 'seals') {
        cost = modificationCost(item);
      }

      let craft =
        item.data.crafting.wood +
        item.data.crafting.textile +
        item.data.crafting.stone +
        item.data.crafting.metal;

      if (type === 'runes' || type === 'seals') {
        craft =
          item.data.crafting.elementalis +
          item.data.crafting.mithril +
          item.data.crafting.fadeite;
      }

      let countdown = Math.floor(cost / 50) + 2;

      if (craft > 0) {
        countdown += craft * 2;

        if (type === 'runes' || type === 'seals') {
          countdown = Math.round(countdown / 10) * 10;
        }
      } else {
        countdown = '-';
      }

      return {
        title: item.data.title,
        cost: cost,
        weight: item.data.weight || 0,
        crafting: item.data.crafting,
        countdown,
        type,
      };
    };
  }

  const weapons = (await getCollection('weapons')).map(normalize('weapons'));

  const wt = weapons.map((w) => w.title);

  const foci = (await getCollection('foci'))
    .map(normalize('foci'))
    .filter((a) => !wt.includes(a.title));

  const armor = (await getCollection('armor')).map(normalize('armor'));

  const allGear = await getCollection('gear');

  const gear = allGear
    .filter((g) => g.data.consumable === false)
    .map(normalize('gear'));

  const consumables = allGear
    .filter((g) => g.data.consumable === true)
    .map(normalize('consumables'));

  const modifications = await getCollection('modifications');

  const runes = modifications
    .filter((m) => m.data.type === 'rune')
    .sort((a, b) => {
      if (a.data.rare && !b.data.rare) return 1;
      if (!a.data.rare && b.data.rare) return -1;
      return 0;
    })
    .map(normalize('runes'));

  const seals = modifications
    .filter((m) => m.data.type === 'seal')
    .sort((a, b) => {
      if (a.data.rare && !b.data.rare) return 1;
      if (!a.data.rare && b.data.rare) return -1;
      return 0;
    })
    .map(normalize('seals'));

  const order = [
    'weapons',
    'foci',
    'armor',
    'gear',
    'consumables',
    'runes',
    'seals',
  ];

  const equipment = Object.groupBy(
    Array.from(
      new Set([
        ...weapons,
        ...foci,
        ...armor,
        ...gear,
        ...consumables,
        ...runes,
        ...seals,
      ]),
    ).sort((a, b) => a.title.localeCompare(b.title)),
    (a) => a.type,
  );

  function buildMaterial(item) {
    const required = [];

    for (const [k, v] of Object.entries(item.crafting)) {
      if (v > 0) {
        required.push(`${v} ${k}`);
      }
    }

    if (required.length === 0) {
      required.push('-');
    }

    return required.join(', ');
  }
</script>

<div class="wrapper">
  <table>
    <thead>
      <tr>
        <th style="width: 100%">Item</th>
        <th style="width: 100%">Material</th>
        <th style="width: 5ch; text-align: center;">
          <span class="center">
            <Icon label="Count" icon="hourglass" />
          </span>
        </th>
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
              <td>{buildMaterial(e)}</td>
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
