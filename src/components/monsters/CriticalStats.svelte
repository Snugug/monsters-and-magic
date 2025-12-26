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
   * Format speed output string from speed object
   */
  function getSpeed(s: Record<string, number>): string {
    let output = '';
    for (const [t, sp] of Object.entries(s)) {
      if (t === 'walking') {
        output += sp + ' ft.';
      } else {
        output += `, ${t.replace(/((m?)ing)$/, '')} ${sp} ft.`;
      }
    }
    return output;
  }

  /**
   * Format bonus/piercing with proper sign: +N for positive, -N for negative, empty for 0
   */
  function formatBonus(value: number): string {
    if (value > 0) return `+${value}`;
    if (value < 0) return `${value}`;
    return '';
  }

  /**
   * Resolve armor entries to get their display titles.
   * Also includes "Armor Charm" if the Armor charm's AC bonus is being applied.
   */
  const armorTitles =
    monster.armor.length > 0
      ? await Promise.all(
          monster.armor.map(async (a) => (await getEntry(a)).data.title),
        )
      : [];

  // Add Armor Charm to the list if it's contributing to AC
  if (m.armorCharm) {
    armorTitles.push('Armor Charm');
  }
</script>

<dl class="critical ahs">
  <div class="cgroup">
    <dt>AC</dt>
    <dd>
      {m.ac}{armorTitles.length > 0 ? ` (${armorTitles.join(', ')})` : ''}
    </dd>
  </div>

  <div class="cgroup">
    <dt>HP</dt>
    <dd>{m.hp}</dd>
  </div>

  <div class="cgroup">
    <dt>Speed</dt>
    <dd>{getSpeed(m.speed)}</dd>
  </div>

  <div class="cgroup">
    <div class="cgroup">
      <dt>AP</dt>
      <dd>{m.ap}</dd>
    </div>
    <div class="cgroup">
      <dt>Fatigue</dt>
      <dd>{m.fatigue}</dd>
    </div>
    <div class="cgroup">
      <dt>Exhaustion</dt>
      <dd>{m.exhaustion}</dd>
    </div>
  </div>

  <div class="cgroup">
    <div class="cgroup">
      <dt>FCS</dt>
      <dd>{monster.focus}</dd>
    </div>
    <div class="cgroup">
      <dt>PWR</dt>
      <dd>{monster.power}</dd>
    </div>
    <div class="cgroup">
      <dt>CNG</dt>
      <dd>{monster.cunning}</dd>
    </div>
    <div class="cgroup">
      <dt>LCK</dt>
      <dd>{monster.luck}</dd>
    </div>
  </div>
</dl>

<style lang="scss">
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
