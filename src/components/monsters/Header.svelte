<script lang="ts">
  import { getEntry } from 'astro:content';
  import type { Monster } from '$lib/shared';
  import type { CalculatedMonster } from '$lib/monsters';

  interface Props {
    monster: Monster;
    m: CalculatedMonster;
  }

  const { monster, m }: Props = $props();

  /**
   * Resolve lineage reference to get its display title
   */
  const lineageTitle = monster.lineage.id
    ? (await getEntry(monster.lineage)).data.title
    : '';
</script>

<header>
  <h1 class="title modesto">{monster.title}</h1>
  <p class="size-type">
    {#if monster.ancient}Ancient
    {/if}{#if monster.legendary}Legendary
    {/if}{monster.size}
    {monster.swarm
      ? ` swarm of ${monster.swarm} ${monster.type}s`
      : monster.type}{lineageTitle ? ` (${lineageTitle})` : ''}
  </p>
</header>

<style lang="scss">
  .title {
    grid-column: 1 / -1;
    font-size: 2rem;
    color: var(--dark-red);
    line-height: 1;
    border-bottom: 1px solid var(--gold);
  }

  .size-type {
    font-size: 0.9rem;
    text-transform: capitalize;
    font-style: italic;
    color: var(--dark-grey);
  }
</style>
