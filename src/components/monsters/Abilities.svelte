<script lang="ts">
  import { getEntry } from 'astro:content';
  import { createMarkdownProcessor } from '@astrojs/markdown-remark';
  import { markdown } from '$$lib/markdown';
  import type { Monster } from '$lib/shared';
  import type { CalculatedMonster } from '$lib/monsters';

  interface Props {
    monster: Monster;
    m: CalculatedMonster;
  }

  const { monster, m }: Props = $props();

  const md = await createMarkdownProcessor(markdown);

  /**
   * Fetch technique entries with their data for display
   */
  const techniqueEntries = await Promise.all(
    monster.techniques.map(async (t) => {
      const entry = await getEntry(t);
      return { id: t, data: entry.data };
    }),
  );

  /**
   * Prepare feats with rendered markdown content
   */
  const featDisplays: Array<{ name: string; html: string }> = [];
  for (const f of monster.feats) {
    const feat = await getEntry(f);
    const desc = (await md.render(`**${feat.data.title}:** ` + feat.body)).code;
    featDisplays.push({ name: feat.data.title, html: desc });
  }

  const hasAbilities = techniqueEntries.length > 0 || featDisplays.length > 0;
</script>

{#if hasAbilities}
  <div class="tgroup">
    <h2>Abilities</h2>
    {#if techniqueEntries.length > 0}
      <p>
        <strong>Techniques:</strong>{' '}
        {#each techniqueEntries as t, i}<s-ref src={`techniques/${t.id}`}
            >{t.data.title}</s-ref
          >{#if i < techniqueEntries.length - 1},
          {/if}{/each}
      </p>
    {/if}
    {#each featDisplays as feat}
      <div class="type trait">{@html feat.html}</div>
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
      margin-inline: 0;
      max-width: unset;
    }
  }

  .trait {
    :global(> :not(:first-child)) {
      margin-inline-start: 1rem;
    }
  }
</style>
