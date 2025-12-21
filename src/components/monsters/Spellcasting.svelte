<script>
  import { getEntry } from 'astro:content';

  const { monster, m } = $props();

  const meta = monster;

  // Fetch cantrip entries
  const cantripEntries = await Promise.all(
    meta.cantrips.map(async (c) => {
      const entry = await getEntry(c);
      return { id: c, data: entry.data };
    }),
  );

  // Fetch charm entries
  const charmEntries = await Promise.all(
    meta.charms.map(async (c) => {
      const entry = await getEntry(c);
      return { id: c, data: entry.data };
    }),
  );

  const hasSpellcasting = cantripEntries.length > 0 || charmEntries.length > 0;
</script>

{#if hasSpellcasting}
  <div class="tgroup">
    <h2>Spellcasting</h2>
    {#if cantripEntries.length > 0}
      <p>
        <strong>Cantrips:</strong>{' '}
        {#each cantripEntries as c, i}<s-ref src={`cantrips/${c.id}`}
            >{c.data.title}</s-ref
          >{#if i < cantripEntries.length - 1},
          {/if}{/each}
      </p>
    {/if}
    {#if charmEntries.length > 0}
      <p>
        <strong>Charms:</strong>{' '}
        {#each charmEntries as c, i}<s-ref src={`charms/${c.id}`}
            >{c.data.title}</s-ref
          >{#if i < charmEntries.length - 1},
          {/if}{/each}
      </p>
    {/if}
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
  }
</style>
