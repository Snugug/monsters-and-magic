<script lang="ts">
  import ImagePicker from '$components/ImagePicker.svelte';
  import { get, set } from 'idb-keyval';
  import { db } from '$lib/db';
  import { sizes, elements } from '$lib/shared';
  import {
    calculatePoints,
    types as monsterTypes,
    type Monster,
  } from '$lib/monsters';

  const lineages = await db.lineage.toArray();
  const armor = await db.armor.toArray();
  const techniques = await db.techniques.toArray();
  const traits = await db.traits.toArray();
  const classes = await db.classes.toArray();
  const feats = await db.feats.toArray();

  let folder = $state(await get('project'));

  // let dir = $state(null) as File;

  let image = $state('');
  let file = $state(null);
  let lineage = $state('') as string | undefined;
  let type = $state('') as (typeof monsterTypes)[number];
  let size = $state('') as (typeof sizes)[number];

  async function chooseFolder(e: Event) {
    folder = await showDirectoryPicker();
    await set('project', folder);
  }

  // $inspect(folder);

  async function saveMonster(e: SubmitEvent) {
    e.preventDefault();
  }

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
    luck: {
      min: -2,
      max: 5,
    },
  });

  const monster = $state({
    title: '',
    size: 'medium',
    type: monsterTypes[0],
    body: '',
    focus: 0,
    power: 0,
    cunning: 0,
    luck: 0,

    // Humanoids get Lineage, Traits, and Class
    lineage: '',
    traits: [],
    feats: [],

    // Humanoid, Celestial, Fiend, Undead, Fey, and Construct get equipment
    weapons: [],
    armor: [],

    vicious: 0,
    savage: 0,
    strong: 0,
    energetic: 0,
    conditioned: 0,
    grappler: 0,
    elemental: undefined,
    spicy: undefined,
  }) as Monster;

  // Set defaults based on monster type;
  $effect(() => {
    const t = type !== monster.type;
    const s = size !== monster.size;
    if (t) {
      abilities.focus.max = 5;
      abilities.focus.min = -5;
      abilities.power.max = 5;
      abilities.power.min = -5;
      abilities.cunning.max = 5;
      abilities.cunning.min = -5;
      abilities.luck.max = 5;
      abilities.luck.min = -2;
      monster.focus = 0;
      monster.power = 0;
      monster.cunning = 0;
      monster.luck = 0;

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
          monster.luck = 1;
          break;
        case 'fiend':
          abilities.cunning.min = 0;
          abilities.power.min = -2;
          monster.cunning = 1;
          monster.power = 1;
          monster.luck = 1;
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
          monster.luck = 1;
          break;
        case 'dragon':
          monster.power = 2;
          monster.cunning = 1;
          monster.focus = 1;
          monster.luck = 1;
          break;
        case 'construct':
          monster.power = 2;
          break;
        case 'monstrosity':
          monster.power = 2;
      }
      type = monster.type;
    }

    if (s || t) {
      switch (size) {
        case 'tiny':
          abilities.power.max += 1;
          break;
        case 'large':
          abilities.power.min -= 1;
          break;
        case 'huge':
          abilities.power.min -= 2;
          break;
        case 'gargantuan':
          abilities.power.min -= 3;
          break;
      }

      switch (monster.size) {
        case 'tiny':
          abilities.power.max -= 1;
          break;
        case 'large':
          abilities.power.min += 1;
          break;
        case 'huge':
          abilities.power.min += 2;
          break;
        case 'gargantuan':
          abilities.power.min += 3;
          break;
      }

      if (monster.power > abilities.power.max) {
        monster.power = abilities.power.max;
      }
      if (monster.power < abilities.power.min) {
        monster.power = abilities.power.min;
      }

      size = monster.size;
    }
  });
  // Reset lineage, traits, and feats if humanoid
  $effect(() => {
    if (monster.type !== 'humanoid') {
      monster.lineage = '';
      monster.traits = [];
      monster.feats = [];
    }
  });

  // Reset monster traits if lineage changes
  $effect(() => {
    if (monster.lineage !== lineage) {
      monster.traits = [];
      lineage = monster.lineage;
    }
  });

  const preview = $derived.by(() => calculatePoints(monster));

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
        {#each sizes as s}
          <option value={s}>{capitalize(s)}</option>
        {/each}
      </select>
    </div>

    <div class="group">
      <label for="type">Type</label>
      <select name="type" bind:value={monster.type} required>
        {#each monsterTypes as type}
          <option value={type}>{capitalize(type)}</option>
        {/each}
      </select>
    </div>

    <div class="group">
      <label for="body">Description</label>
      <textarea name="body" bind:value={monster.body} required></textarea>
    </div>

    <div class="image">
      <ImagePicker bind:image bind:file type="monster" />
    </div>

    <fieldset class="abilities">
      <legend>Abilities</legend>
      <div class="group">
        <label for="focus"
          >Focus ({abilities.focus.min}-{abilities.focus.max})</label
        >
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
        <label for="power"
          >Power ({abilities.power.min}-{abilities.power.max})</label
        >
        <input
          type="number"
          name="power"
          bind:value={monster.power}
          min={abilities.power.min}
          max={abilities.power.max}
          required
        />
      </div>
      <div class="group">
        <label for="cunning"
          >Cunning ({abilities.cunning.min}-{abilities.cunning.max})</label
        >
        <input
          type="number"
          name="cunning"
          bind:value={monster.cunning}
          min={abilities.cunning.min}
          max={abilities.cunning.max}
          required
        />
      </div>
      <div class="group">
        <label for="cunning"
          >Luck ({abilities.luck.min}-{abilities.luck.max})</label
        >
        <input
          type="number"
          name="cunning"
          bind:value={monster.luck}
          min={abilities.luck.min}
          max={abilities.luck.max}
          required
        />
      </div>
      <p>
        Abilities can be purchased for 2+/2-, the first two ability increases
        are free.
      </p>
      <!-- <div class="group">
        <label for="luck">Luck</label>
        <input type="number" name="luck" bind:value={monster.luck} />
      </div> -->
    </fieldset>

    {#if monster.type === 'humanoid'}
      <fieldset>
        <legend>Lineage & Class</legend>
        <div class="group">
          <label for="lineage">Lineage</label>
          <select name="type" bind:value={monster.lineage}>
            <option value="">-</option>
            {#each lineages as l}
              <option value={l.id}>{l.title}</option>
            {/each}
          </select>
        </div>
        <div class="group">
          <label for="lineage">Traits</label>
          <select
            name="type"
            bind:value={monster.traits}
            disabled={!monster.lineage}
            multiple
          >
            {#each traits as t}
              {#if t.lineage.id === monster.lineage}
                <option value={t.id}>{t.title}</option>
              {/if}
            {/each}
          </select>
        </div>
        <div class="group">
          <label for="lineage">Feats</label>
          <select name="type" bind:value={monster.feats} multiple>
            {#each feats as f}
              <option value={f.id}>{f.title}{f.rare ? '*' : ''}</option>
            {/each}
          </select>
        </div>
      </fieldset>
    {/if}

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
        <label for="grappler">Grappler</label>
        <input type="number" name="grappler" bind:value={monster.grappler} />
      </div>

      <fieldset>
        <legend>Energy</legend>
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
            min="0"
            max="3"
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>Elements</legend>

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

  select[multiple] {
    height: min-content;
  }

  fieldset {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(10ch, 1fr));
    gap: 1rem;

    p,
    fieldset {
      grid-column: 1 / -1;
    }

    p {
      font-size: 0.9rem;
    }
  }
</style>
