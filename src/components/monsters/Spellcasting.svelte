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
   * Fetch cantrip entries with their data for display
   */
  const cantripEntries = await Promise.all(
    monster.cantrips.map(async (c) => {
      const entry = await getEntry(c);
      return { id: c, data: entry.data };
    }),
  );

  /**
   * Fetch charm entries with their data for display
   */
  const charmEntries = await Promise.all(
    monster.charms.map(async (c) => {
      const entry = await getEntry(c);
      return { id: c, data: entry.data };
    }),
  );

  const hasSpellcasting = cantripEntries.length > 0 || charmEntries.length > 0;

  /**
   * Calculate spellcasting DC using the monster's spellcasting ability
   */
  const spellcastingAbility = monster.spellcasting as
    | 'power'
    | 'focus'
    | 'cunning'
    | 'luck';
  const dc = 8 + m.cr + (monster[spellcastingAbility] || 0);

  /**
   * Format bonus with proper sign: +N for positive, -N for negative, empty for 0
   */
  function formatBonus(value: number): string {
    if (value > 0) return `+${value}`;
    if (value < 0) return `${value}`;
    return '';
  }

  const bonusStr = formatBonus(m.bonus);
  const piercingStr = formatBonus(m.piercing);
</script>

{#if hasSpellcasting}
  <div class="tgroup">
    <h2>Spellcasting</h2>
    <p>
      DC: {dc} Attack: +{dc - 8}{bonusStr ? ` ${bonusStr}` : ''}{piercingStr
        ? `, ${piercingStr} piercing`
        : ''}
    </p>
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
