<script>
  import { swarmImmunities } from '$lib/shared';

  const { monster, m } = $props();

  const meta = monster;

  const resist = [...meta.resistance];
  const vuln = meta.vulnerable;
  const absorb = meta.absorbent;
  const immune = [...meta.immunity, ...meta.conditions];

  if (meta.swarm) {
    if (!meta.immunity.includes('physical')) {
      resist.push('physical');
    }

    for (const s of swarmImmunities) {
      immune.push({ id: s, collection: 'conditions' });
    }
  }

  function vision(v) {
    let output = '';
    for (const t of v) {
      if (meta[t]) {
        output += `, ${t} ${meta[t]} ft.`;
      } else {
        output += `, ${t}`;
      }
    }
    return output.slice(2);
  }

  function immuneStr(i) {
    let output = '';
    for (const im of i) {
      if (im.id) {
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

  {#if meta.vision.length > 0}
    <div class="cgroup">
      <dt>Senses</dt>
      <dd class="cap">{vision(meta.vision)}</dd>
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
