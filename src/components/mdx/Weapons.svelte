<script lang="ts">
  import { getCollection } from 'astro:content';
  import Icon from '$components/Icon.svelte';

  let { simple = false } = $props();

  const weapons = await Promise.all(
    (await getCollection('weapons'))
      .filter((a) => {
        if (simple && a.data.properties?.includes('simple')) return true;
        if (!simple && !a.data.properties?.includes('simple')) return true;
      })
      .sort((a, b) => a.data.title.localeCompare(b.data.title))
      .sort((a, b) => a.data.range - b.data.range)
      .map((a) => {
        const si = a.data.properties?.findIndex((a) => a === 'simple');
        if (si !== undefined && si >= 0) {
          a.data.properties?.splice(si, 1);
        }
        return a;
      }),
  );
</script>

<div class="wrapper">
  <table>
    <caption>{simple ? 'Simple Weapons' : 'Martial Weapons'}</caption>
    <thead>
      <tr>
        <th style="width: 11ch;">Weapon</th>
        <th style="width: 9ch; text-align: center;">Damage</th>
        <th style="width: 7ch; text-align: center;">Range</th>
        <th style="width: 10ch">Properties</th>
        <th style="width: 9ch;">Mastery</th>
        <th style="width: 5ch; text-align: center;">
          <span class="center">
            <Icon label="cost" icon="coin" />
          </span>
        </th>
        <th style="width: 5ch; text-align: center;">
          <span class="center">
            <Icon label="weight" icon="weight" />
          </span>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th colspan="7">Primary Weapons</th>
      </tr>
      {#each weapons as weapon}
        {#if weapon.data.primary}
          <tr>
            <td>{weapon.data.title}</td>
            <td style="text-align: center;">{weapon.data.damage}</td>
            <td style="text-align: center;"
              >{weapon.data.range === 0 ? '-' : `${weapon.data.range}'`}</td
            >
            <td
              >{weapon.data.properties.length > 0
                ? weapon.data.properties.join(', ')
                : '-'}</td
            >
            <td>{weapon.data.mastery}</td>
            <td style="text-align: center;">{weapon.data.cost}g</td>
            <td style="text-align: center;"
              >{weapon.data.weight === 0.1 ? 'light' : weapon.data.weight}</td
            >
          </tr>
        {/if}
      {/each}
      <tr>
        <th colspan="7">Secondary Weapons</th>
      </tr>
      {#each weapons as weapon}
        {#if weapon.data.secondary}
          <tr>
            <td>{weapon.data.title}</td>
            <td style="text-align: center;">{weapon.data.damage}</td>
            <td style="text-align: center;"
              >{weapon.data.range === 0 ? '-' : `${weapon.data.range}'`}</td
            >
            <td
              >{weapon.data.properties.length > 0
                ? weapon.data.properties.join(', ')
                : '-'}</td
            >
            <td>{weapon.data.mastery}</td>
            <td style="text-align: center;">{weapon.data.cost}g</td>
            <td style="text-align: center;"
              >{weapon.data.weight === 0.1 ? 'light' : weapon.data.weight}</td
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
</style>
