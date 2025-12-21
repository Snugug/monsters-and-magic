<script lang="ts">
  import { getEntry } from 'astro:content';
  import { createMarkdownProcessor } from '@astrojs/markdown-remark';
  import { markdown } from '$$lib/markdown';
  import { tags } from '$lib/shared';
  import { capitalize } from '$lib/helpers';
  import type { Monster, allTags } from '$lib/shared';
  import type { CalculatedMonster } from '$lib/monsters';

  interface Props {
    monster: Monster;
    m: CalculatedMonster;
  }

  interface TraitDisplay {
    name: string;
    html: string;
  }

  const { monster, m }: Props = $props();
  const md = await createMarkdownProcessor(markdown);

  /**
   * Collect all traits into a single array with { name, html } structure
   */
  const allTraits: TraitDisplay[] = [];

  // 1. Lineage traits
  for (const t of monster.traits) {
    const tr = await getEntry(t);
    const desc = (await md.render(`**${tr.data.title}:** ` + tr.body)).code;
    allTraits.push({ name: tr.data.title, html: desc });
  }

  // 2. Swarm trait
  if (monster.swarm !== false) {
    allTraits.push({
      name: 'Swarm',
      html: '<p><strong>Swarm:</strong> Cannot gain temporary HP, cannot regain HP, deal ½ damage when bloodied.</p>',
    });
  }

  // 3. Spicy trait
  if (monster.spicy !== '') {
    const spicyText =
      monster.spicy === 'fatigue'
        ? `marks ¼ of ${m.baseDamage} (minimum 1) ${monster.spicy}`
        : `takes ${m.baseDamage} ${monster.spicy} damage`;
    allTraits.push({
      name: 'Spicy',
      html: `<p><strong>Spicy:</strong> The first time a creature touches this monster each turn, it ${spicyText}.</p>`,
    });
  }

  // 4. Radiates trait
  if (monster.radiates !== '') {
    const radiatesText =
      monster.radiates === 'fatigue'
        ? `marks ¼ of ${m.baseDamage} (minimum 1) ${monster.radiates}`
        : `takes ${m.baseDamage} ${monster.radiates} damage`;
    allTraits.push({
      name: 'Radiates',
      html: `<p><strong>Radiates:</strong> Once each turn when a creature is within ${m.space * 2} ft. of the monster, it ${radiatesText}.</p>`,
    });
  }

  // 5. Tags that generate traits
  for (const [t, d] of Object.entries(tags)) {
    const tagKey = t as allTags;
    if (monster[tagKey]) {
      const tagName = d.tag || capitalize(t);
      const desc = (await md.render(`**${tagName}:** ` + d.full)).code;
      allTraits.push({ name: tagName, html: desc });
    }
  }

  // Sort alphabetically by name
  allTraits.sort((a, b) => a.name.localeCompare(b.name));

  const hasTraits = allTraits.length > 0;
</script>

{#if hasTraits}
  <div class="tgroup">
    <h2>Traits</h2>
    {#each allTraits as trait}
      <div class="type trait">{@html trait.html}</div>
    {/each}
  </div>
{/if}

<style lang="scss">
  .tgroup {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.9rem;

    h2 {
      font-size: 1rem;
      border-bottom: 1px solid var(--gold);
    }

    .type {
      width: 100%;
      font-size: 0.9rem;
    }
  }

  .trait {
    :global(> :not(:first-child)) {
      margin-inline-start: 1rem;
    }
  }
</style>
