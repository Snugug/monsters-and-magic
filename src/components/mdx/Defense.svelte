<script>
  const def = {
    'Stout / Frail': { desc: '±5 HP', points: '±1' },
    'Armored / Exposed': { desc: '±1 AC', points: '±2' },
    Resistant: { desc: 'Add resistance to an element', points: '+2' },
    Vulnerable: { desc: 'Add vulnerability to an element ', points: '-1' },
    Immune: {
      desc: 'Adds immunity to an element',
      points: '+5',
    },
    Resilient: {
      desc: 'Adds immunity to a condition',
      points: '+3',
    },
    Absorbent: { desc: 'Healed when hit by an element', points: '+6' },
  };
</script>

<table>
  <thead>
    <tr>
      <th style="width: 20%">Trait</th>
      <th>Effect</th>
      <th style="width: 7ch;">Points</th>
    </tr>
  </thead>
  <tbody>
    {#each Object.entries(def) as [k, v]}
      <tr>
        <td>{k}</td>
        <td>{v.desc}</td>
        <td style="text-align: center;">{v.points}</td>
      </tr>
    {/each}
  </tbody>
</table>
