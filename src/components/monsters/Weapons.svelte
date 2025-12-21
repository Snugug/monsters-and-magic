<script>
  import { getEntry } from 'astro:content';
  import { capitalize } from '$lib/helpers';

  const { monster, m } = $props();

  const meta = monster;

  // Check if monster has mastery tag
  const hasMastery = meta.mastery === true;

  // Calculate attack stat based on weapon properties
  function getAttackStat(properties = []) {
    if (properties.includes('agile')) {
      return Math.max(meta.cunning, meta.power);
    } else if (properties.includes('precise')) {
      return Math.max(meta.focus, meta.power);
    }
    return meta.power;
  }

  // Global piercing from the monster
  const globalPiercing = m.piercing;
  const globalDamageBonus = m.bonus;

  const allWeapons = [
    ...meta.naturalWeapons.map((w) => {
      const attackStat = getAttackStat(w.properties || []);
      return {
        name: w.name,
        damage: w.damage,
        element: w.element,
        properties: w.properties,
        mastery: hasMastery ? w.mastery : undefined,
        range: w.range,
        isNatural: true,
        toHit: attackStat,
        damageBonus: attackStat + globalDamageBonus,
        piercing: globalPiercing,
      };
    }),
    ...(await Promise.all(
      meta.weapons.map(async (w) => {
        const weapon = await getEntry(w);
        const attackStat = getAttackStat(weapon.data.properties);
        const weaponRange =
          weapon.data.range > 0 ? weapon.data.range : undefined;
        return {
          name: weapon.data.title,
          damage: weapon.data.damage,
          element: 'physical',
          properties: weapon.data.properties,
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
  const hasBothWeaponTypes =
    meleeWeapons.length > 0 && rangedWeapons.length > 0;
</script>

{#if hasWeapons}
  <div class="tgroup">
    <h2>Weapons</h2>
    {#if hasBothWeaponTypes && meleeWeapons.length > 0}
      <h3>Melee</h3>
    {/if}
    {#if meleeWeapons.length > 0}
      <ul class="weapons-list">
        {#each meleeWeapons as w}
          {@const damageBonusStr =
            w.damageBonus >= 0 ? `+${w.damageBonus}` : `${w.damageBonus}`}
          <li>
            <strong>{w.name}</strong>
            <span class="to-hit">To Hit +{w.toHit}</span>, {w.damage}
            {damageBonusStr}
            {w.element}
            <span class="properties">
              ({#each w.properties || [] as p, i}<s-ref src={`glossary/${p}`}
                  >{capitalize(p)}</s-ref
                >{#if i < (w.properties?.length || 0) - 1},
                {/if}{/each}{#if w.piercing > 0}{w.properties?.length
                  ? ', '
                  : ''}+{w.piercing} Piercing{/if}{#if w.mastery}, <s-ref
                  src={`glossary/${w.mastery}`}>{capitalize(w.mastery)}</s-ref
                >{/if})
            </span>
          </li>
        {/each}
      </ul>
    {/if}
    {#if hasBothWeaponTypes && rangedWeapons.length > 0}
      <h3>Ranged</h3>
    {/if}
    {#if rangedWeapons.length > 0}
      <ul class="weapons-list">
        {#each rangedWeapons as w}
          {@const damageBonusStr =
            w.damageBonus >= 0 ? `+${w.damageBonus}` : `${w.damageBonus}`}
          <li>
            <strong>{w.name}</strong>
            <span class="range">(Range: {w.range} ft)</span>
            <span class="to-hit">To Hit +{w.toHit}</span>, {w.damage}
            {damageBonusStr}
            {w.element}
            <span class="properties">
              ({#each w.properties || [] as p, i}<s-ref src={`glossary/${p}`}
                  >{capitalize(p)}</s-ref
                >{#if i < (w.properties?.length || 0) - 1},
                {/if}{/each}{#if w.piercing > 0}{w.properties?.length
                  ? ', '
                  : ''}+{w.piercing} Piercing{/if}{#if w.mastery}, <s-ref
                  src={`glossary/${w.mastery}`}>{capitalize(w.mastery)}</s-ref
                >{/if})
            </span>
          </li>
        {/each}
      </ul>
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

    h3 {
      font-size: 0.9rem;
      color: var(--dark-red);
      margin-block-start: 0.5rem;
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
