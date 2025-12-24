<script lang="ts">
  import type { Monster } from '$lib/shared';
  import type { CalculatedMonster } from '$lib/monsters';

  interface Props {
    monster: Monster;
    m: CalculatedMonster;
  }

  const { monster, m }: Props = $props();

  /**
   * Filter out the 'mastery' tag as it's handled separately
   */
  const filteredTags = m.tags.filter((t) => t !== 'mastery');
  const hasTags = filteredTags.length > 0;
</script>

{#if hasTags}
  <div class="tgroup tags">
    <h2>Tags</h2>
    <ul>
      {#each filteredTags.sort() as t}
        <li class="tag">{t}</li>
      {/each}
    </ul>
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

  .tags {
    grid-column: 1 / -1;

    ul {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      margin: 0;
      padding: 0;
      padding-block-start: 0.5rem;
    }

    .tag {
      background: var(--white);
      padding: 0.25rem 0.5rem;
      border-radius: 5px;
      border: 1px solid var(--gold);
      line-height: 1;
      font-size: 0.7rem;
    }
  }
</style>
