<script>
  import { getEntry } from 'astro:content';

  const { monster, m } = $props();

  const meta = monster;

  // Calculate attack stat based on weapon properties
  function getSpeed(s) {
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

  // Resolve armor titles
  const armorTitles =
    meta.armor.length > 0
      ? await Promise.all(
          meta.armor.map(async (a) => (await getEntry(a)).data.title),
        )
      : [];

  const hasDamageModifiers = meta.strong !== 0 || meta.savage !== 0;
</script>

<dl class="critical ahs">
  <div class="cgroup">
    <dt>AC</dt>
    <dd>
      {m.ac}{armorTitles.length > 0 && ` (${armorTitles.join(', ')})`}
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

  {#if hasDamageModifiers}
    <div class="cgroup">
      {#if m.bonus !== 0}
        <div class="cgroup">
          <dt>Damage</dt>
          <dd>+{m.bonus}</dd>
        </div>
      {/if}
      {#if m.piercing !== 0}
        <div class="cgroup">
          <dt>Piercing</dt>
          <dd>+{m.piercing}</dd>
        </div>
      {/if}
    </div>
  {/if}

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
      <dd>{meta.focus}</dd>
    </div>
    <div class="cgroup">
      <dt>PWR</dt>
      <dd>{meta.power}</dd>
    </div>
    <div class="cgroup">
      <dt>CNG</dt>
      <dd>{meta.cunning}</dd>
    </div>
    <div class="cgroup">
      <dt>LCK</dt>
      <dd>{meta.luck}</dd>
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
