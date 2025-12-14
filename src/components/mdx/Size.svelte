<script>
  const sizes = [
    {
      size: 'Tiny',
      damage: '1d4',
      hp: 3,
      speed: 20,
      space: `2½'×2½'`,
      reach: 5,
      points: -1,
    },
    {
      size: 'Small',
      damage: '1d6',
      hp: 4,
      speed: 30,
      space: `5'×5'`,
      reach: 5,
      points: 0,
    },
    {
      size: 'Medium',
      damage: '1d6',
      hp: 5,
      speed: 30,
      space: `5'×5'`,
      reach: 5,
      points: 0,
    },
    {
      size: 'Large',
      damage: '1d8',
      hp: 6,
      speed: 40,
      space: `10'×10'`,
      reach: 5,
      points: 1,
    },
    {
      size: 'Huge',
      damage: '1d10',
      hp: 7,
      speed: 40,
      space: `15'×15'`,
      reach: 7,
      points: 2,
    },
    {
      size: 'Gargantuan',
      damage: '1d12',
      hp: 10,
      speed: 40,
      space: `20'×20'`,
      reach: 15,
      points: 3,
    },
  ];
</script>

<table>
  <thead>
    <tr>
      <th style="width: 11ch; ">Size</th>
      <th>Damage</th>
      <th style="width: 4ch;">HP</th>
      <th>Speed</th>
      <th>Space</th>
      <th>Reach</th>
      <th>Points</th>
    </tr>
  </thead>
  <tbody>
    {#each sizes as s}
      <tr>
        <td>{s.size}</td>
        <td>{s.damage}</td>
        <td>{s.hp}</td>
        <td>{s.speed}'</td>
        <td>{s.space}</td>
        <td>{s.reach}'</td>
        <td>{s.points}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  td {
    text-align: center;
  }
</style>
