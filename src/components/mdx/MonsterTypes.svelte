<script>
  const types = {
    Beast: `Animals native to the material plane. Includes hybrid animals, like owlbears and griffons`,
    Humanoid: `Creatures native to the material plane that form societies`,
    Celestial: `Creatures native to the upper planes. Usually benevolent`,
    Fiends: `Creatures native to the lower planes. Usually selfish `,
    Undead: `Creatures that have been brought back from the dead but not fully to life, like skeletons and zombies`,
    Elemental: `Creatures from elemental planes or are manifestations of an element`,
    Ooze: `Homogenous creatures made of jelly-like substances`,
    Aberration: `Creatures alien to the material plane, like an eldritch horror`,
    Fey: `Creatures native to the feyrealm and deeply connected to nature`,
    Dragon: `Big lizards, breath weapons, like gold, you know, a dragon`,
    Construct: `Mechanical creatures`,
    Monstrosity: `Any creature that doesn't fit into another type`,
  };
</script>

<table>
  <thead>
    <tr>
      <th style="width: 11ch">Type</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    {#each Object.entries(types) as [t, d]}
      <tr>
        <td>{t}</td>
        <td>{d}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  th {
    text-align: left;
  }
</style>
