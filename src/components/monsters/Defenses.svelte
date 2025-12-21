<script lang="ts">
  import { swarmImmunities } from '$lib/shared';
  import type { Monster, elem } from '$lib/shared';
  import type { CalculatedMonster } from '$lib/monsters';

  interface Props {
    monster: Monster;
    m: CalculatedMonster;
  }

  const { monster, m }: Props = $props();

  /**
   * Build resistance list, adding physical resistance for swarms
   */
  const resist = [...monster.resistance] as string[];
  const vuln = monster.vulnerable;
  const absorb = monster.absorbent;

  /**
   * Build immunity list, combining elemental immunities and conditions,
   * plus swarm-specific condition immunities
   */
  const immune = [...monster.immunity, ...monster.conditions] as Array<
    string | { id: string; collection: string }
  >;

  if (monster.swarm) {
    if (!monster.immunity.includes('physical')) {
      resist.push('physical');
    }

    for (const s of swarmImmunities) {
      immune.push({ id: s, collection: 'conditions' });
    }
  }

  /**
   * Format vision types into a readable string
   */
  function vision(v: string[]): string {
    let output = '';
    for (const t of v) {
      const key = t as keyof Monster;
      if (monster[key]) {
        output += `, ${t} ${monster[key]} ft.`;
      } else {
        output += `, ${t}`;
      }
    }
    return output.slice(2);
  }

  /**
   * Format immunities list, rendering references as s-ref elements
   */
  function immuneStr(
    i: Array<string | { id: string; collection: string }>,
  ): string {
    let output = '';
    for (const im of i) {
      if (typeof im === 'object' && im.id) {
        output += `, <s-ref src="${im.collection}/${im.id}">${im.id}</s-ref>`;
      } else {
        output += `, ${im}`;
      }
    }
    return output.slice(2);
  }
</script>

<dl class="critical rvi">
  {#if resist.length > 0}
    <div class="cgroup">
      <dt>Resistances</dt>
      <dd class="cap">{resist.join(', ')}</dd>
    </div>
  {/if}

  {#if vuln.length > 0}
    <div class="cgroup">
      <dt>Vulnerabilities</dt>
      <dd class="cap">{vuln.join(', ')}</dd>
    </div>
  {/if}

  {#if immune.length > 0}
    <div class="cgroup">
      <dt>Immunities</dt>
      <dd class="cap">{@html immuneStr(immune)}</dd>
    </div>
  {/if}

  {#if absorb.length > 0}
    <div class="cgroup">
      <dt>Absorbs</dt>
      <dd class="cap">{absorb.join(', ')}</dd>
    </div>
  {/if}

  {#if monster.vision.length > 0}
    <div class="cgroup">
      <dt>Senses</dt>
      <dd class="cap">{vision(monster.vision)}</dd>
    </div>
  {/if}

  <div class="cgroup">
    <dt>CR</dt>
    <dd>{m.cr} ({m.points} points)</dd>
  </div>
</dl>

<style lang="scss">
  .rvi {
    @container (max-width: 600px) {
      grid-column: 1 / -1;
    }
  }

  .cap {
    text-transform: capitalize;
  }

  .cgroup {
    display: flex;
    gap: 0.25rem;

    &:has(.cgroup) {
      gap: 0.5rem;
    }

    dt {
      font-weight: bold;
      color: var(--dark-red);
    }
  }
</style>
