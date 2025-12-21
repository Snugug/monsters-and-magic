<script lang="ts">
  import { getEntry } from 'astro:content';
  import { capitalize } from '$lib/helpers';
  import type { Monster } from '$lib/shared';
  import type { CalculatedMonster } from '$lib/monsters';
  import Icon from '$components/Icon.svelte';

  interface Props {
    monster: Monster;
    m: CalculatedMonster;
  }

  interface WeaponDisplay {
    name: string;
    damage: string;
    element: string;
    properties: string[];
    mastery?: string;
    range?: number;
    isNatural: boolean;
    toHit: number;
    damageBonus: number;
    piercing: number;
  }

  const { monster, m }: Props = $props();

  /**
   * Check if monster has mastery tag for displaying weapon mastery
   */
  const hasMastery = monster.mastery === true;

  /**
   * Calculate attack stat based on weapon properties:
   * - agile: max(cunning, power)
   * - precise: max(focus, power)
   * - default: power
   */
  function getAttackStat(properties: string[] = []): number {
    if (properties.includes('agile')) {
      return Math.max(monster.cunning, monster.power);
    } else if (properties.includes('precise')) {
      return Math.max(monster.focus, monster.power);
    }
    return monster.power;
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
   * Global piercing and damage bonus from calculated monster stats
   */
  const globalPiercing = m.piercing;
  const globalDamageBonus = m.bonus;

  /**
   * Build combined list of all weapons (natural + equipped)
   */
  const allWeapons: WeaponDisplay[] = [
    ...monster.naturalWeapons.map((w) => {
      const attackStat = getAttackStat(w.properties || []);
      return {
        name: w.name,
        damage: w.damage,
        element: w.element,
        properties: w.properties || [],
        mastery: hasMastery ? w.mastery : undefined,
        range: w.range,
        isNatural: true,
        toHit: attackStat,
        damageBonus: attackStat + globalDamageBonus,
        piercing: globalPiercing,
      };
    }),
    ...(await Promise.all(
      monster.weapons.map(async (w) => {
        const weapon = await getEntry(w);
        const attackStat = getAttackStat(weapon.data.properties);
        const weaponRange =
          weapon.data.range > 0 ? weapon.data.range : undefined;
        return {
          name: weapon.data.title,
          damage: weapon.data.damage,
          element: 'physical',
          properties: weapon.data.properties || [],
          range: weaponRange,
          isNatural: false,
          toHit: attackStat,
          damageBonus: attackStat + globalDamageBonus,
          piercing: globalPiercing,
        };
      }),
    )),
  ];

  const hasWeapons = allWeapons.length > 0;
  const meleeWeapons = allWeapons.filter((w) => !w.range);
  const rangedWeapons = allWeapons.filter((w) => w.range);

  /**
   * Build properties string for weapon display, handling empty parentheses
   */
  function buildPropertiesArray(w: WeaponDisplay): string[] {
    const parts: string[] = [];

    // Add weapon properties
    if (w.properties.length > 0) {
      parts.push(...w.properties);
    }

    // Add piercing if non-zero
    if (w.piercing !== 0) {
      parts.push(`${formatBonus(w.piercing)} Piercing`);
    }

    // Add mastery if present
    if (w.mastery) {
      parts.push(w.mastery);
    }

    return parts;
  }

  function buildPropertiesList(props: string[]): string {
    let output = '';
    output += props
      .map((p) => {
        if (p.includes('Piercing')) {
          return `<s-ref src="properties/piercing">${p}</s-ref>`;
        }
        return `<s-ref src="properties/${p}">${capitalize(p)}</s-ref>`;
      })
      .join(', ');

    output = output.trimEnd();
    return output;
  }
</script>

{#if hasWeapons}
  <div class="tgroup">
    <h2>Weapons</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 30%;">Weapon</th>
          <th style="width: 7ch;">Range</th>
          <th style="width: 4ch;">Hit</th>
          <th style="width: 10ch;">Damage</th>
          <th style="width: 70%;">Properties</th>
        </tr>
      </thead>
      <tbody>
        {#each meleeWeapons as w}
          {@const damageBonusStr = formatBonus(w.damageBonus)}
          {@const propsArray = buildPropertiesArray(w)}
          <tr>
            <td class="name">
              <strong>{w.name}</strong>
              <p>Melee Weapon</p>
            </td>
            <td>
              <strong
                >{propsArray.includes('reach') ? m.reach + 5 : m.reach} ft.</strong
              >
              <p>Reach</p>
            </td>
            <td>+{w.toHit}</td>
            <td>
              <span class="damage">
                {w.damage}{damageBonusStr}
                <Icon icon={w.element} label={w.element}></Icon>
              </span>
            </td>
            <td>{@html buildPropertiesList(propsArray)}</td>
          </tr>
        {/each}
        {#each rangedWeapons as w}
          {@const damageBonusStr = formatBonus(w.damageBonus)}
          {@const propsArray = buildPropertiesArray(w)}
          <tr>
            <td class="name">
              <strong>{w.name}</strong>
              <p>Ranged Weapon</p>
            </td>
            <td>
              <strong>{w.range} ft.</strong>
              <p>Range</p>
            </td>
            <td>+{w.toHit}</td>
            <td>
              <span class="damage">
                {w.damage}{damageBonusStr}
                <Icon icon={w.element} label={w.element}></Icon>
              </span>
            </td>
            <td>{@html buildPropertiesList(propsArray)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
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

    h3 {
      font-size: 0.9rem;
      color: var(--dark-red);
      margin-block-start: 0.5rem;
    }
  }

  .damage {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;

    :global(.icon) {
      width: 1em;
      height: 1em;
    }
  }

  .weapons-list {
    margin: 0;
    padding: 0;
    padding-inline-start: 1rem;
    list-style: disc;

    li {
      margin-block: 0.25rem;
    }

    .to-hit {
      font-weight: bold;
      color: var(--dark-red);
    }

    .properties {
      font-style: italic;
      color: var(--dark-grey);
    }
  }
</style>
