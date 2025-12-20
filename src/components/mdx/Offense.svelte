<script>
  const traits = [
    {
      name: 'Savage',
      desc: 'Adds +1 piercing to natural and weapon attacks.',
      points: '+2',
    },
    {
      name: 'Strong',
      desc: 'Adds +2 ongoing to damage rolls.',
      points: '+2',
    },
    {
      name: 'Energetic',
      desc: 'Adds +3 fatigue.',
      points: '+2',
    },
    {
      name: 'Conditioned',
      desc: 'Adds +2 exhaustion.',
      points: '+4',
    },
    {
      name: 'Spicy',
      desc: `The first time a creature touches this monster each turn, it takes damage equal to the monster's base damage of the chosen type (¼ if fatigue, minimum 1).`,
      points: 3,
    },
    {
      name: 'Radiates',
      desc: `Once each turn when a creature is within twice the monster's space, it takes damage equal to the monster's base damage of the chosen type (¼ if fatigue, minimum 1).`,
      points: 4,
    },
  ];
</script>

<table>
  <thead>
    <tr>
      <th style="width: 11ch; text-align: left;">Trait</th>
      <th style="text-align: left;">Effect</th>
      <th style="width: 7ch;">Points</th>
    </tr>
  </thead>
  <tbody>
    {#each traits as t}
      <tr>
        <td>{t.name}</td>
        <td>{t.desc}</td>
        <td style="text-align: center">{t.points}</td>
      </tr>
    {/each}
  </tbody>
</table>
