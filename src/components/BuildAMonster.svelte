<script lang="ts">
  import ImagePicker from '$components/ImagePicker.svelte';
  import { get, set } from 'idb-keyval';
  import { db } from '$lib/db';
  console.log('~~~');
  const bell = await db.gear.get('bell');
  const rope = await db.gear.get('rope');
  const elf = await db.lineage.get('elf');
  console.log(bell);
  console.log(rope);
  console.log(elf);
  console.log('!!!!');

  let folder = $state(await get('project'));

  // let dir = $state(null) as File;

  let image = $state('');
  let file = $state(null);

  // $inspect(image);
  // $inspect(file);
  // $inspect(image);

  async function chooseFolder(e: Event) {
    folder = await showDirectoryPicker();
    await set('project', folder);
  }

  // $inspect(folder);

  async function saveMonster(e: SubmitEvent) {
    e.preventDefault();
  }

  const elements = [
    'fire',
    'cold',
    'force',
    'lightning',
    'poison',
    'acid',
    'radiant',
    'necrotic',
    'physical',
    'fatigue',
  ];

  const abilities = $state({
    focus: {
      min: -5,
      max: 5,
    },
    power: {
      min: -5,
      max: 5,
    },
    cunning: {
      min: -5,
      max: 5,
    },
  });

  const monster = $state({
    title: '',
    size: 'medium',
    type: 'beast',
    body: '',
    focus: 0,
    power: 0,
    cunning: 0,
    // luck: 0,

    vicious: 0,
    specialized: [] as Array<string>,
    savage: 0,
    strong: 0,
    energetic: 0,
    conditioned: 0,
    skilled: 0,
    caster: 0,
    charming: 0,
    upcast: 0,
    grappler: 0,
    elemental: '',
    spicy: '',
  });

  const dieSizes = [
    '1',
    '1d2',
    '1d4',
    '1d6',
    '1d8',
    '1d10',
    '1d12',
    '2d6',
    '3d4',
  ];

  $effect(() => {
    abilities.focus.max = 5;
    abilities.focus.min = -5;
    abilities.power.max = 5;
    abilities.power.min = -5;
    abilities.cunning.max = 5;
    abilities.cunning.min = -5;
    monster.focus = 0;
    monster.power = 0;
    monster.cunning = 0;

    switch (monster.type) {
      case 'beast':
        abilities.focus.max = 0;
        monster.focus = -1;
        monster.power = 1;
        monster.cunning = 2;
        break;
      case 'humanoid':
        abilities.focus.min = -2;
        abilities.power.min = -2;
        abilities.cunning.min = -2;
        monster.focus = 1;
        monster.power = 1;
        break;
      case 'celestial':
        abilities.focus.min = 0;
        abilities.power.min = -2;
        monster.focus = 1;
        monster.power = 1;
        break;
      case 'fiend':
        abilities.cunning.min = 0;
        abilities.power.min = -2;
        monster.cunning = 1;
        monster.power = 1;
        break;
      case 'undead':
        monster.power = 2;
        break;
      case 'elemental':
        monster.power = 2;
        monster.spicy = 'fire';
        break;
      case 'ooze':
        abilities.focus.max = 0;
        abilities.cunning.max = 0;
        monster.power = 2;
        monster.spicy = 'acid';
        break;
      case 'aberration':
        monster.focus = 3;
        monster.power = -1;
        monster.cunning = 2;
        break;
      case 'fey':
        monster.power = -1;
        monster.cunning = 3;
        break;
      case 'dragon':
        monster.power = 2;
        monster.cunning = 1;
        monster.focus = 1;
        break;
      case 'construct':
        monster.power = 2;
        break;
      case 'monstrosity':
        monster.power = 2;
    }
  });

  const preview = $derived.by(() => {
    const base = {
      hp: 5,
      fatigue: 2,
      exhaustion: 1,
      ac: 0,
      damage: '1d6',
      tags: [] as Array<string>,
    };
    const p = {
      points: 0,
      speed: 30,
      cr: 0,
      bonus: 0,
      piercing: 0,
      reach: 5,
      ...base,
    };

    // Set starting based on size
    switch (monster.size) {
      case 'tiny':
        p.points -= 2;
        p.speed = 15;
        p.bonus -= 2;
        break;
      case 'large':
        p.hp += 5;
        p.points += 2;
        p.reach += 5;
        p.speed = 35;
        p.bonus += 1;
        break;
      case 'huge':
        p.hp += 10;
        p.points += 3;
        p.reach += 5;
        p.speed = 40;
        p.bonus += 3;
        break;
      case 'gargantuan':
        p.hp += 15;
        p.points += 5;
        p.reach += 5;
        p.speed = 40;
        p.bonus += 3;
        break;
    }

    // Abilities
    p.points += points(monster.focus + monster.power + monster.cunning - 2, 2);
    p.ac += monster.cunning;
    // p.points += points(monster.luck, 2);

    // Offense
    if (monster.vicious !== 0) {
      const { damage } = p;
      const di = dieSizes.findIndex((e) => e === damage);
      p.damage = dieSizes[di + monster.vicious];
      p.points += points(monster.vicious);
      if (monster.vicious > 0) {
        p.tags.push('vicious');
      } else if (monster.vicious < 0) {
        p.tags.push('timid');
      }
    }

    if (monster.savage !== 0) {
      p.piercing += monster.savage;
      console.log(p);
      p.points += points(monster.savage, 2);
      p.tags.push('savage');
    }
    if (monster.strong !== 0) {
      p.bonus += monster.strong * 2;
      p.points += points(monster.strong, 2);
      if (monster.strong > 0) {
        p.tags.push('strong');
      } else if (monster.strong < 0) {
        p.tags.push('weak');
      }
    }

    if (monster.energetic !== 0) {
      p.fatigue += monster.energetic * 3;
      p.points += points(monster.energetic, 2);
      p.tags.push('energetic');
    }

    if (monster.conditioned !== 0) {
      p.exhaustion += 2 * monster.conditioned;
      p.points += points(monster.conditioned, 4);
      p.tags.push('conditioned');
    }

    if (monster.elemental !== '') {
      p.points += 1;
      p.tags.push('elemental');
    }

    if (monster.spicy !== '') {
      p.points += 4;
      p.tags.push('spicy');
    }

    // Set CR at the end
    if (p.points < 10) {
      p.cr = 0;
    } else if (p.points < 15) {
      p.cr = 1;
    } else if (p.points < 20) {
      p.cr = 2;
    } else if (p.points < 30) {
      p.cr = 3;
    } else {
      p.cr = 4;
    }

    return p;
  });

  function points(steps: number, start: number = 1) {
    // Raw steps may be negative
    const negative = steps < 0;
    steps = Math.abs(steps);
    // 1. Handle edge cases for steps
    if (steps <= 0) {
      return 0;
    }
    if (steps === 1) {
      if (negative) {
        return 0 - start;
      }
      return start;
    }

    // Initialize the first two terms and the running sum.
    // 'a' holds the (n-2) term, 'b' holds the (n-1) term.
    let a = start;
    let b = start;

    // The sum starts with the first two terms: start + start
    let sum = a + b;

    // Loop starts at i=3 because the first two elements (i=1 and i=2) are already accounted for.
    // It runs up to and including 'steps' to generate the remaining terms.
    for (let i = 3; i <= steps; i++) {
      // Calculate the next term (n)
      const next = a + b;

      // Add the next term to the running sum
      sum += next;

      // Shift the terms for the next iteration:
      // The old (n-1) term (b) becomes the new (n-2) term (a)
      // The new term (nextTerm) becomes the new (n-1) term (b)
      a = b;
      b = next;
    }

    if (negative) {
      return 0 - sum;
    }

    return sum;
  }

  // $inspect(monster);
  // $inspect(preview);

  function capitalize(str: string) {
    return str.charAt(0).toLocaleUpperCase() + str.slice(1);
  }
</script>

{#if !folder}
  <button onclick={chooseFolder}>Choose local folder</button>
{/if}

<div class="container">
  <h1 class="type--h1">Build a Monster</h1>

  <form onsubmit={saveMonster}>
    <div class="group">
      <label for="title">Name</label>
      <input type="text" name="title" bind:value={monster.title} required />
    </div>

    <div class="group">
      <label for="size">Size</label>
      <select name="size" bind:value={monster.size} required>
        <option value="tiny">Tiny</option>
        <option value="small">Small</option>
        <option value="medium" selected>Medium</option>
        <option value="large">Large</option>
        <option value="huge">Huge</option>
        <option value="gargantuan">Gargantuan</option>
      </select>
    </div>

    <div class="group">
      <label for="type">Type</label>
      <select name="type" bind:value={monster.type} required>
        <option value="beast">Beast</option>
        <option value="humanoid">Humanoid</option>
        <option value="celestial">Celestial</option>
        <option value="fiend">Fiend</option>
        <option value="undead">Undead</option>
        <option value="elemental">Elemental</option>
        <option value="ooze">Ooze</option>
        <option value="aberration">Aberration</option>
        <option value="fey">Fey</option>
        <option value="dragon">Dragon</option>
        <option value="construct">Construct</option>
        <option value="monstrosity">Monstrosity</option>
      </select>
    </div>

    <div class="group">
      <label for="body">Description</label>
      <textarea name="body" bind:value={monster.body} required></textarea>
    </div>

    <div class="image">
      <ImagePicker bind:image bind:file type="monster" />
    </div>

    <fieldset>
      <legend>Abilities</legend>
      <p>
        Abilities can be purchased for 2+/2-, the first two ability increases
        are free.
      </p>
      <div class="group">
        <label for="focus">Focus</label>
        <input
          type="number"
          name="focus"
          bind:value={monster.focus}
          min={abilities.focus.min}
          max={abilities.focus.max}
          required
        />
      </div>
      <div class="group">
        <label for="power">Power</label>
        <input
          type="number"
          name="power"
          bind:value={monster.power}
          min={abilities.power.min}
          max={abilities.focus.max}
          required
        />
      </div>
      <div class="group">
        <label for="cunning">Cunning</label>
        <input
          type="number"
          name="cunning"
          bind:value={monster.cunning}
          min={abilities.cunning.min}
          max={abilities.cunning.max}
          required
        />
      </div>
      <!-- <div class="group">
        <label for="luck">Luck</label>
        <input type="number" name="luck" bind:value={monster.luck} />
      </div> -->
    </fieldset>

    <fieldset>
      <legend>Offense</legend>
      <div class="group">
        <label for="vicious">Vicious</label>
        <input
          type="number"
          name="vicious"
          bind:value={monster.vicious}
          min="-3"
          max="5"
        />
      </div>

      <div class="group">
        <label for="vicious">Savage</label>
        <input
          type="number"
          name="vicious"
          bind:value={monster.savage}
          min="0"
        />
      </div>
      <div class="group">
        <label for="vicious">Strength</label>
        <input type="number" name="vicious" bind:value={monster.strong} />
      </div>

      <div class="group">
        <label for="energetic">Energetic</label>
        <input
          type="number"
          name="energetic"
          bind:value={monster.energetic}
          min="0"
        />
      </div>
      <div class="group">
        <label for="conditioned">Conditioned</label>
        <input
          type="number"
          name="conditioned"
          bind:value={monster.conditioned}
        />
      </div>

      <div class="group">
        <label for="grappler">Grappler</label>
        <input type="number" name="grappler" bind:value={monster.grappler} />
      </div>

      <div class="group">
        <label for="type">Elemental</label>
        <select name="type" bind:value={monster.elemental}>
          <option value="">-</option>
          {#each elements as e}
            <option value={e}>{capitalize(e)}</option>
          {/each}
        </select>
      </div>

      <div class="group">
        <label for="type">Spicy</label>
        <select name="type" bind:value={monster.spicy}>
          <option value="">-</option>
          {#each elements as e}
            <option value={e}>{capitalize(e)}</option>
          {/each}
        </select>
      </div>
    </fieldset>
  </form>

  <div class="sidebar">
    {#each Object.entries(preview) as [k, v]}
      <p>{k}: {v}</p>
    {/each}
  </div>
</div>

<style lang="scss">
  .image {
    border: 1px solid black;
    grid-column: 1 / span 1;
    grid-row: 1 / span 4;
  }

  .container {
    display: grid;
    grid-template-columns: 1fr 200px;
    gap: 1rem;
  }

  h1 {
    grid-column: 1 / -1;
    margin: 0;
  }

  form {
    display: grid;
    grid-template-columns: 200px 1fr 1fr;
    gap: 1rem;
  }

  fieldset {
    grid-column: 1 / -1;
  }

  .group {
    display: flex;
    flex-direction: column;

    &:has([name='title']) {
      grid-column: 2 / span 2;
    }

    &:has([name='body']) {
      grid-column: 2 / span 2;
      grid-row: 3 / span 2;
    }

    label {
      font-size: 0.75rem;
      text-transform: uppercase;
      line-height: 1.25;
    }

    input,
    select {
      width: 100%;
      height: 2rem;
      padding: 0.25rem;
    }

    textarea {
      resize: none;
    }
  }
</style>
