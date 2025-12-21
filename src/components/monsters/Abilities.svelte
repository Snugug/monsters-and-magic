<script>
  import { getEntry } from 'astro:content';
  import { createMarkdownProcessor } from '@astrojs/markdown-remark';
  import { markdown } from '$$lib/markdown';

  const { monster, m } = $props();

  const meta = monster;
  const md = await createMarkdownProcessor(markdown);

  // Fetch technique entries
  const techniqueEntries = await Promise.all(
    meta.techniques.map(async (t) => {
      const entry = await getEntry(t);
      return { id: t, data: entry.data };
    }),
  );

  // Prepare feats with rendered content
  const featDisplays = [];
  for (const f of meta.feats) {
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
    }
  }

  .trait {
    :global(> :not(:first-child)) {
      margin-inline-start: 1rem;
    }
  }
</style>
