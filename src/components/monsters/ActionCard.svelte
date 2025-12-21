<script>
  const { attack, meta, m, globalDamageBonus, globalPiercing } = $props();

  // Determine if this is a save type
  const isSave = ['power', 'focus', 'cunning', 'luck'].includes(attack.type);
  const isReaction = attack.type === 'reaction';

  // Use ability field for stat, default to power
  const abilityKey = attack.ability || 'power';
  const attackStat = meta[abilityKey];
  const dc = 8 + attackStat + m.cr;
  const damageBonus = attackStat + globalDamageBonus;
  const damageBonusStr =
    damageBonus >= 0 ? `+${damageBonus}` : `${damageBonus}`;
</script>

<div class="action-card">
  <div class="action-header">
    <strong>{attack.name}</strong>
    <span class="action-cost">
      {attack.ap} AP
      {#if attack.fatigue > 0}, {attack.fatigue} fatigue{/if}
    </span>
    {#if attack.recharge}
      <span class="recharge">Recharge: {attack.recharge}</span>
    {/if}
    {#if attack.thread}
      <span class="thread">[Thread]</span>
    {/if}
  </div>

  {#if isReaction && attack.trigger}
    <p class="trigger">
      <em>Trigger:</em>
      {attack.trigger}
    </p>
  {/if}

  <div class="action-body">
    {#if isSave}
      <p class="save-dc">DC {dc} {abilityKey} save</p>
    {/if}

    {#if attack.damage}
      <p class="action-damage">
        {attack.damage}
        {damageBonusStr}
        {attack.element || 'damage'}
        <span class="properties"> (+{globalPiercing} Piercing)</span>
      </p>
    {/if}

    {#if attack.condition}
      <p class="action-condition">
        → <s-ref src={`conditions/${attack.condition.id}`}
          >{attack.condition.id}</s-ref
        >
      </p>
    {/if}

    {#if attack.range}
      <p class="action-range">Range: {attack.range} ft</p>
    {/if}

    {#if attack.description}
      <p class="action-desc">{attack.description}</p>
    {/if}
  </div>
</div>

<style lang="scss">
  .action-card {
    background: var(--white);
    border: 1px solid var(--gold);
    border-radius: 5px;
    padding: 0.5rem;

    .action-header {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 0.5rem;
      border-bottom: 1px solid var(--gold);
      padding-bottom: 0.25rem;
      margin-bottom: 0.25rem;

      strong {
        color: var(--dark-red);
      }

      .action-cost {
        color: var(--dark-grey);
        font-size: 0.85rem;
      }

      .recharge {
        color: var(--dark-red);
        font-style: italic;
        font-size: 0.85rem;
      }

      .thread {
        color: var(--dark-red);
        font-weight: bold;
        font-size: 0.85rem;
      }
    }

    .trigger {
      font-size: 0.85rem;
      color: var(--dark-grey);
      margin: 0.25rem 0;
    }

    .action-body {
      p {
        margin: 0.25rem 0;
      }

      .save-dc {
        font-weight: bold;
        color: var(--dark-red);
        text-transform: capitalize;
      }

      .action-damage {
        text-transform: capitalize;

        .properties {
          font-style: italic;
          color: var(--dark-grey);
        }
      }

      .action-condition {
        text-transform: capitalize;
      }

      .action-desc {
        margin-block-start: 0.25rem;
      }
    }
  }
</style>
