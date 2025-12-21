<script>
  import { getEntry } from 'astro:content';
  import { createMarkdownProcessor } from '@astrojs/markdown-remark';
  import { markdown } from '$$lib/markdown';
  import { tags } from '$lib/shared';
  import { capitalize } from '$lib/helpers';

  const { monster, m } = $props();

  const meta = monster;
  const md = await createMarkdownProcessor(markdown);

  // Collect all traits into a single array with { name, html } structure
  const allTraits = [];

  // 1. Lineage traits
  for (const t of meta.traits) {
    const tr = await getEntry(t);
    const desc = (await md.render(`**${tr.data.title}:** ` + tr.body)).code;
    allTraits.push({ name: tr.data.title, html: desc });
  }

  // 2. Swarm
  if (meta.swarm !== false) {
    allTraits.push({
      name: 'Swarm',
      html: '<p><strong>Swarm:</strong> Cannot gain temporary HP, cannot regain HP, deal ½ damage when bloodied.</p>',
    });
  }

  // 3. Spicy
  if (meta.spicy !== '') {
    const spicyText =
      meta.spicy === 'fatigue'
        ? `marks ¼ of ${m.baseDamage} (minimum 1) ${meta.spicy}`
        : `takes ${m.baseDamage} ${meta.spicy} damage`;
    allTraits.push({
      name: 'Spicy',
      html: `<p><strong>Spicy:</strong> The first time a creature touches this monster each turn, it ${spicyText}.</p>`,
    });
  }

  // 4. Radiates
  if (meta.radiates !== '') {
    const radiatesText =
      meta.radiates === 'fatigue'
        ? `marks ¼ of ${m.baseDamage} (minimum 1) ${meta.radiates}`
        : `takes ${m.baseDamage} ${meta.radiates} damage`;
    allTraits.push({
      name: 'Radiates',
      html: `<p><strong>Radiates:</strong> Once each turn when a creature is within ${m.space * 2} ft. of the monster, it ${radiatesText}.</p>`,
    });
  }

  // 5. Tags
  for (const [t, d] of Object.entries(tags)) {
    if (meta[t]) {
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
