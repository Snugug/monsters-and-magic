<script lang="ts">
  import Icon from '$components/Icon.svelte';
  import { getCollection, getEntry } from 'astro:content';

  const { type } = $props();

  const gear = await Promise.all(
    (await getCollection('gear')).sort((a, b) =>
      a.data.title.localeCompare(b.data.title),
    ),
  );

  const packs = await Promise.all(
    (await getCollection('packs'))
      .sort((a, b) => a.data.title.localeCompare(b.data.title))
      .map(async (p) => {
        let weight = 0;
        // if (p.slug === 'fisherman-s-pack') {
        for (const c of p.data.contents) {
          const i = gear.find((g) => g.slug === c.item.id);
          if (i) {
            weight += i.data.weight * c.count;
          } else {
            const w = await getEntry('weapons', c.item.id);
            weight += w?.data.weight * c.count;
          }
        }

        p.data.weight = weight;

        return p;
      }),
  );
</script>

<div class="wrapper">
  <table>
    <thead>
      <tr>
        <th style="width: 30%; text-transform: capitalize"
          >{type.replace(/s$/, '')}</th
        >
        <th style="width: 70%">Description</th>
        <th style="width: 6ch; text-align: center;">
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
      {#if type === 'packs'}
        {#each packs as p}
          <tr>
            <td>{p.data.title}</td>
            <td>{@html p.rendered.html}</td>
            <td style="text-align: center;">{p.data.cost}g</td>
            <td style="text-align: center;"
              >{p.data.weight > 0 && p.data.weight <= 0.5
                ? 'light'
                : Math.round(p.data.weight)}</td
            >
          </tr>
        {/each}
      {:else if type === 'gear'}
        {#each gear as g}
          {#if g.data.tool === false && g.data.instrument === false && g.data.consumable === false}
            <tr>
              <td>{g.data.title}</td>
              <td>{@html g.rendered.html}</td>
              <td style="text-align: center;">{g.data.cost}g</td>
              <td style="text-align: center;"
                >{g.data.weight === 0.1 ? 'light' : g.data.weight}</td
              >
            </tr>
          {/if}
        {/each}
      {:else if type === 'instruments'}
        {#each gear as g}
          {#if g.data.instrument === true}
            <tr>
              <td>{g.data.title}</td>
              <td>{@html g.rendered.html}</td>
              <td style="text-align: center;">{g.data.cost}g</td>
              <td style="text-align: center;"
                >{g.data.weight === 0.1 ? 'light' : g.data.weight}</td
              >
            </tr>
          {/if}
        {/each}
      {:else if type === 'tools'}
        {#each gear as g}
          {#if g.data.tool === true}
            <tr>
              <td>{g.data.title}</td>
              <td>{@html g.rendered.html}</td>
              <td style="text-align: center;">{g.data.cost}g</td>
              <td style="text-align: center;"
                >{g.data.weight === 0.1 ? 'light' : g.data.weight}</td
              >
            </tr>
          {/if}
        {/each}
      {:else if type === 'potions'}
        {#each gear as g}
          {#if g.data.consumable === true}
            <tr>
              <td>{g.data.title}</td>
              <td>{@html g.rendered.html}</td>
              <td style="text-align: center;">{g.data.cost}g</td>
              <td style="text-align: center;"
                >{g.data.weight === 0.1 ? 'light' : g.data.weight}</td
              >
            </tr>
          {/if}
        {/each}
      {/if}
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
