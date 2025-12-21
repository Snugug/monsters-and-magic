<script lang="ts">
  import ActionCard from './ActionCard.svelte';
  import type { Monster } from '$lib/shared';
  import type { CalculatedMonster } from '$lib/monsters';

  interface Props {
    monster: Monster;
    m: CalculatedMonster;
  }

  const { monster, m }: Props = $props();

  const hasActions = monster.attacks.length > 0;

  /**
   * Global piercing and damage bonus values from calculated monster stats
   */
  const globalPiercing = m.piercing;
  const globalDamageBonus = m.bonus;
</script>

{#if hasActions}
  <div class="tgroup">
    <h2>Actions</h2>
    <div class="action-cards">
      {#each monster.attacks as attack}
        <ActionCard
          {attack}
          meta={monster}
          {m}
          {globalDamageBonus}
          {globalPiercing}
        />
      {/each}
    </div>
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

  .action-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 0.5rem;
  }
</style>
