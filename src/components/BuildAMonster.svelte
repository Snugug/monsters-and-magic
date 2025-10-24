<script lang="ts">
  import ImagePicker from '$components/ImagePicker.svelte';
  import { db } from '$lib/db';
  import { sizes, elements, vision, speeds } from '$lib/shared';
  import {
    baseMonster,
    calculatePoints,
    types as monsterTypes,
  } from '$lib/monsters';
  import { md } from '$lib/md';
  import { fileToImage, stringToImage } from '$lib/images';
  import { slugify } from '$lib/helpers';
  import {
    chooseFolder,
    folder,
    getPath,
    writeFile,
    writeImage,
    getFileHandle,
    getDir,
  } from '$lib/fs.svelte';
  import Multiselect from '$components/Multiselect.svelte';

  const lineages = await db.lineage.toArray();
  const armor = await db.armor.toArray();
  const techniques = await db.techniques.toArray();
  const traits = await db.traits.toArray();
  const weapons = await db.weapons.toArray();
  const feats = await db.feats.toArray();
  const cantrips = await db.cantrips.toArray();
  const charms = await db.charms.toArray();

  let image = $state('');
  let file = $state() as File;
  let handler = $state() as FileSystemFileHandle;
  let lineage = $state('') as string | undefined;
  let type = $state('') as (typeof monsterTypes)[number];
  let size = $state('') as (typeof sizes)[number];
  let body = $state('');

  async function saveMonster(e: SubmitEvent) {
    e.preventDefault();
    let imagePath = '';
    const slug = slugify(monster.title);
    const uid = Math.floor(Date.now()).toString(36);

    let pth;
    if (handler) {
      pth = await getPath(handler);
    } else if (image) {
      const f = await writeImage(
        `public/images/monsters/${slug}-${uid}.png`,
        image,
      );
      pth = await getPath(f);
    }

    if (pth) {
      if (pth[0] === 'public') {
        pth.shift();
      }
      imagePath = pth.join('/');
    }

    const m = structuredClone($state.snapshot(monster));
    m.image = imagePath;
    try {
      const copy = await md.compile(body, m);
      const f = await writeFile(`src/content/monsters/${slug}.md`, copy);
      const output = await getPath(f);
      console.log(output);
    } catch (e) {
      console.error(e);
    }
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
    strong: null as null | number,
    hp: null as null | number,
  });

  let monster = $state(baseMonster);

  let baseSpeed = $derived.by(() => {
    if (monster.size === 'tiny') return 15;
    if (monster.size === 'large') return 35;
    if (monster.size === 'huge') return 40;
    if (monster.size === 'gargantuan') return 40;
    return 30;
  });

  $effect(() => {
    for (const s of monster.speeds) {
      if (monster[s] === 0) {
        monster[s] = baseSpeed;
      }
    }
  });

  const elemList = elements.map((e) => ({
    id: e,
    title: capitalize(e),
  }));
  const resistList = $derived(
    elemList.filter(
      (a) =>
        !monster.immunity.includes(a.id) && !monster.vulnerable.includes(a.id),
    ),
  );
  const immuneList = $derived(
    elemList.filter(
      (a) =>
        !monster.resistance.includes(a.id) &&
        !monster.vulnerable.includes(a.id),
    ),
  );
  const vulnList = $derived(
    elemList.filter(
      (a) =>
        !monster.resistance.includes(a.id) && !monster.immunity.includes(a.id),
    ),
  );
  const visionList = vision.map((v) => ({
    id: v,
    title: capitalize(v),
  }));
  const speedList = speeds.map((v) => ({
    id: v,
    title: capitalize(v),
  }));

  let equipment = $derived(
    ['humanoid', 'celestial', 'fiend', 'undead', 'fey', 'construct'].includes(
      monster.type,
    )
      ? true
      : false,
  );

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
      monster.resistance = [];
      monster.vulnerable = [];
      monster.immunity = [];
      monster.spicy = '';
      monster.charms = [];
      monster.cantrips = [];
      monster.undying = false;
      monster.unrelenting = false;

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
          monster.resistance.push('radiant');
          monster.vulnerable.push('necrotic');
          break;
        case 'fiend':
          abilities.cunning.min = 0;
          abilities.power.min = -2;
          monster.cunning = 1;
          monster.power = 1;
          monster.luck = 1;
          monster.vulnerable.push('radiant');
          monster.resistance.push('fire');
          break;
        case 'undead':
          monster.power = 2;
          monster.vulnerable.push('radiant');
          monster.resistance.push('necrotic');
          monster.undying = true;
          break;
        case 'elemental':
          monster.power = 2;
          monster.spicy = 'fire';
          monster.immunity.push('fire');
          break;
        case 'ooze':
          abilities.focus.max = 0;
          abilities.cunning.max = 0;
          monster.power = 2;
          monster.spicy = 'acid';
          monster.immunity.push('acid');
          break;
        case 'aberration':
          monster.focus = 3;
          monster.power = -1;
          monster.cunning = 2;
          monster.cantrips.push('mind-spike');
          monster.cantrips.push('minor-illusion');
          monster.charms.push('control-creature');
          break;
        case 'fey':
          monster.power = -1;
          monster.cunning = 3;
          monster.luck = 1;
          monster.cantrips.push('minor-illusion');
          break;
        case 'dragon':
          monster.power = 2;
          monster.cunning = 1;
          monster.focus = 1;
          monster.luck = 1;
          monster.cantrips.push('fire-bolt');
          monster.charms.push('splash');
          monster.vulnerable.push('cold');
          monster.resistance.push('fire');
          break;
        case 'construct':
          monster.power = 2;
          monster.immunity.push('fatigue');
          monster.unrelenting = true;
          break;
        case 'monstrosity':
          monster.power = 2;
      }
      type = monster.type;
    }

    if (s || t) {
      // Reset
      monster.walking = baseSpeed;
      for (const spd of speeds) {
        if (!monster.speeds.includes(spd)) {
          monster[spd] = 0;
        }
      }
      abilities.strong = null;
      abilities.hp = null;

      switch (size) {
        case 'tiny':
          abilities.power.max += 1;
          monster.strong += 1;
          break;
        case 'large':
          abilities.power.min -= 1;
          monster.hp -= 1;
          monster.strong -= 1;
          break;
        case 'huge':
          abilities.power.min -= 2;
          monster.hp -= 2;
          monster.strong -= 3;
          break;
        case 'gargantuan':
          abilities.power.min -= 3;
          monster.hp -= 3;
          monster.strong -= 3;
          break;
      }

      switch (monster.size) {
        case 'tiny':
          abilities.power.max -= 1;
          monster.strong -= 1;
          break;
        case 'large':
          abilities.power.min += 1;
          monster.hp += 1;
          monster.strong += 1;
          abilities.strong = 0;
          abilities.hp = 0;
          break;
        case 'huge':
          abilities.power.min += 2;
          monster.hp += 2;
          monster.strong += 3;
          abilities.strong = 2;
          abilities.hp = 1;
          break;
        case 'gargantuan':
          abilities.power.min += 3;
          monster.hp += 3;
          monster.strong += 3;
          abilities.strong = 2;
          abilities.hp = 2;
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

  async function loadMonster(e: Event) {
    e.preventDefault();
    const [h] = await showOpenFilePicker({
      startIn: await getDir('src/content/monsters'),
      types: [
        {
          description: 'Markdown files',
          accept: {
            'text/*': ['.md', '.mdx'],
          },
        },
      ],
    });
    const f = (await (await h.getFile()).text()) as string;
    const {
      attributes,
      body: bdy,
    }: {
      attributes: Monster & {
        image: string;
      };
      body: string;
    } = await md.parse(f);
    if (bdy) {
      body = bdy;
    }
    const { image: img } = attributes;
    delete attributes.image;
    if (img) {
      handler = await getFileHandle(`public/${img}`);
      file = await handler.getFile();
      image = await fileToImage(file);
    }
    monster = attributes;

    // console.log(parsed);
  }
</script>

<!-- {#if !folder}
  <button onclick={chooseFolder}>Choose local folder</button>
{/if} -->

<form class="container" onsubmit={saveMonster}>
  <h1 class="type--h1">Build a Monster</h1>

  <div class="form">
    <div class="group top">
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

    <div class="group top">
      <label for="body">Description</label>
      <textarea name="body" bind:value={body}></textarea>
    </div>

    <div class="image">
      <ImagePicker bind:image bind:file bind:handler type="monster" />
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

        {#if monster.lineage}
          <Multiselect
            bind:list={monster.traits}
            items={traits}
            legend="Traits"
            button="Add Trait"
            filter={(a) => a.lineage.id === monster.lineage}
          />
        {/if}
        <Multiselect
          bind:list={monster.feats}
          items={feats}
          legend="Feats"
          button="Add Feat"
        />
      </fieldset>
    {/if}

    <fieldset class="megagroup">
      <legend>Vision & Movement</legend>
      <Multiselect
        bind:list={monster.vision}
        items={visionList}
        legend="Special Vision"
        button="Add Vision"
        filter={(a) => {
          if (
            monster.vision.includes('low-light vision') &&
            a.id === 'darkvision'
          )
            return false;

          if (
            monster.vision.includes('darkvision') &&
            a.id === 'low-light vision'
          )
            return false;
          return true;
        }}
      />

      {#each monster.vision as v}
        {#if v !== 'low-light vision' && v !== 'darkvision'}
          <div class="group">
            <label for={v}>{capitalize(v)} Distance</label>
            <input
              type="number"
              name={v}
              bind:value={monster[v]}
              min="10"
              step="10"
            />
            <p>Set {v} distance, in feet</p>
          </div>
        {/if}
      {/each}

      <Multiselect
        bind:list={monster.speeds}
        items={speedList}
        legend="Special Movement"
        button="Add Movement"
      />
      <div class="group">
        <label for="speed">Walking Speed</label>
        <input
          type="number"
          name="speed"
          bind:value={monster.walking}
          min="5"
          step="5"
        />
        <p>Set walking speed, in feet</p>
      </div>
      {#each monster.speeds as s}
        <div class="group">
          <label for="{s}-speed">{capitalize(s)} Speed</label>
          <input
            type="number"
            name="{s}-speed"
            bind:value={monster[s]}
            min="5"
            step="5"
          />
          <p>Set {s} speed, in feet</p>
        </div>
      {/each}
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
        <p>Increases or decreases natural damage die size</p>
      </div>

      <div class="group">
        <label for="vicious">Savage</label>
        <input
          type="number"
          name="vicious"
          bind:value={monster.savage}
          min="0"
        />
        <p>Adds piercing to natural and weapon damage</p>
      </div>
      <div class="group">
        <label for="vicious">Strength</label>
        <input
          type="number"
          name="vicious"
          bind:value={monster.strong}
          min={abilities.strong}
        />
        <p>Increases or decreases damage bonus</p>
      </div>

      <div class="group">
        <label for="grappler" class="switch">
          <span>Grappler</span>
          <input
            id="grappler"
            type="checkbox"
            bind:checked={monster.grappler}
          />
        </label>
        <p>Halves the fatigue needed to keep a foe restrained</p>
      </div>

      <div class="group">
        <label for="energetic">Energetic</label>
        <input
          type="number"
          name="energetic"
          bind:value={monster.energetic}
          min="0"
        />
        <p>Increases fatigue by 3</p>
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
        <p>Increases exhaustion by 2</p>
      </div>

      <div class="group">
        <label for="type">Elemental</label>
        <select name="type" bind:value={monster.elemental}>
          <option value="">-</option>
          {#each elements as e}
            {#if e !== 'physical'}
              <option value={e}>{capitalize(e)}</option>
            {/if}
          {/each}
        </select>
        <p>Natural and weapon attack damage type</p>
      </div>

      <div class="group">
        <label for="type">Spicy</label>
        <select name="type" bind:value={monster.spicy}>
          <option value="">-</option>
          {#each elements as e}
            <option value={e}>{capitalize(e)}</option>
          {/each}
        </select>
        <p>Touching this creature deals ½ natural weapon damage of this type</p>
      </div>
    </fieldset>

    <fieldset>
      <legend>{equipment ? 'Equipment & ' : ''}Training</legend>
      {#if equipment}
        <Multiselect
          bind:list={monster.weapons}
          items={weapons}
          legend="Weapons"
          button="Add Weapon"
        />
        <Multiselect
          bind:list={monster.armor}
          items={armor}
          legend="Armor"
          button="Add Armor"
          filter={(a) => {
            const shield = monster.armor
              ?.map((m) => armor.find((n) => n.id === m))
              .filter((m) => m?.type === 'shield')?.length;

            if (monster.armor?.length && !shield && a.type !== 'shield') {
              return false;
            }

            if (monster.armor.length === 2) {
              return false;
            }

            return true;
          }}
        />
      {/if}
      <Multiselect
        bind:list={monster.techniques}
        items={techniques}
        legend="Techniques"
        button="Add Technique"
      />
      <Multiselect
        bind:list={monster.cantrips}
        items={cantrips}
        legend="Cantrips"
        button="Add Cantrip"
      />
      {#if monster.cantrips.length}
        <Multiselect
          bind:list={monster.charms}
          items={charms}
          legend="Charms"
          button="Add Charm"
          filter={(a) => {
            for (const s of a.spells) {
              if (monster.cantrips.includes(s.id)) {
                return true;
              }
            }
            return false;
          }}
        />
      {/if}
    </fieldset>

    <fieldset>
      <legend>Defense</legend>
      <div class="group">
        <label for="hp">HP</label>
        <input
          type="number"
          name="hp"
          bind:value={monster.hp}
          min={abilities.hp}
        />
        <p>Increases HP by 5</p>
      </div>
      <div class="group">
        <label for="armored">Armor</label>
        <input type="number" name="armored" bind:value={monster.armored} />
        <p>Increases AC by 1</p>
      </div>

      <Multiselect
        bind:list={monster.resistance}
        items={resistList}
        legend="Resistances"
        button="Add Resistance"
      />
      <Multiselect
        bind:list={monster.immunity}
        items={immuneList}
        legend="Immunities"
        button="Add Immunity"
      />
      <Multiselect
        bind:list={monster.vulnerable}
        items={vulnList}
        legend="Vulnerabilities"
        button="Add Vulnerability"
      />
    </fieldset>

    <fieldset>
      <legend>Special</legend>
      <div class="group">
        <label for="ancient" class="switch">
          <span>Ancient</span>
          <input id="ancient" type="checkbox" bind:checked={monster.ancient} />
        </label>
        <p>Increases AP by 1</p>
      </div>

      <div class="group">
        <label for="legendary" class="switch">
          <span>Legendary</span>
          <input
            id="legendary"
            type="checkbox"
            bind:checked={monster.legendary}
          />
        </label>
        <p>Can use Legendary Actions, Reactions, and Resistances</p>
      </div>

      <div class="group">
        <label for="lair" class="switch">
          <span>Lair</span>
          <input id="lair" type="checkbox" bind:checked={monster.lair} />
        </label>
        <p>
          Has control over its surroundings, letting it take Lair Actions at the
          start of a round
        </p>
      </div>

      <div class="group">
        <label for="undying" class="switch">
          <span>Undying</span>
          <input id="undying" type="checkbox" bind:checked={monster.undying} />
        </label>
        <p>
          When fully exhausted, at the start of its next turn can spend 1 thread
          to recover all fatigue and 1 exhaustion.
        </p>
      </div>

      <div class="group">
        <label for="unrelenting" class="switch">
          <span>Unrelenting</span>
          <input
            id="unrelenting"
            type="checkbox"
            bind:checked={monster.unrelenting}
          />
        </label>
        <p>
          When damage would drop it to 0 HP but not outright kill it, can spend
          1 thread to drop to 1 HP instead
        </p>
      </div>

      <div class="group">
        <label for="bloodthirsty" class="switch">
          <span>Bloodthirsty</span>
          <input
            id="bloodthirsty"
            type="checkbox"
            bind:checked={monster.bloodthirsty}
          />
        </label>
        <p>
          When at ½ HP or less, gain bonus to ability checks and damage rolls
          equal to CR
        </p>
      </div>

      <div class="group">
        <label for="draining" class="switch">
          <span>Draining</span>
          <input
            id="draining"
            type="checkbox"
            bind:checked={monster.draining}
          />
        </label>
        <p>
          Once per turn when dealing damage with a melee attack, recover ½
          damage or fatigue dealt
        </p>
      </div>

      <div class="group">
        <label for="amphibious" class="switch">
          <span>Amphibious</span>
          <input
            id="amphibious"
            type="checkbox"
            bind:checked={monster.amphibious}
          />
        </label>
        <p>Can breathe are and water</p>
      </div>

      <div class="group">
        <label for="flyby" class="switch">
          <span>Flyby</span>
          <input id="flyby" type="checkbox" bind:checked={monster.flyby} />
        </label>
        <p>Doesn't provoke reactions when leaving an enemy's reach</p>
      </div>
    </fieldset>
  </div>

  <div class="container--sidebar">
    <div class="sidebar">
      {#each Object.entries(preview) as [k, v]}
        {#if Array.isArray(v)}
          <p>{k}: {v.join(', ')}</p>
        {:else if typeof v === 'object'}
          <p>{k}: {JSON.stringify(v)}</p>
        {:else}
          <p>{k}: {v}</p>
        {/if}
      {/each}
      <input type="submit" value="Save Monster" />
      <button onclick={loadMonster}>Load Monster</button>
    </div>
  </div>
</form>

<style lang="scss">
  .sidebar {
    position: sticky;
    top: var(--header-height);
  }
  .switch {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    // justify-content: center;
    gap: 0.5rem;
    // max-width: min-content;

    input {
      --timing: 0.2s;
      position: relative;
      height: 1rem;
      width: 2.25rem;
      cursor: pointer;
      appearance: none;
      border-radius: 1rem;
      background-image: linear-gradient(
        to right,
        var(--dark-green) 50%,
        transparent 50%
      );
      background-size: 200%;
      background-position: 100%;

      border: 1px solid var(--black);
      transition: background-position var(--timing) ease;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      flex-shrink: 0;

      &:before {
        content: '';
        display: block;
        height: 1.25rem;
        width: 1.25rem;
        cursor: pointer;
        border: 1px solid var(--black);
        border-radius: 1rem;
        background-color: var(--white);
        transition: transform var(--timing) ease;
        transform: translateX(-0.25rem);
      }

      &:checked {
        background-position: 0;
        &:before {
          transform: translateX(100%);
        }
      }
    }
  }

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

  .form {
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

    label:not(:has([type='checkbox'])) {
      font-size: 0.75rem;
      text-transform: uppercase;
      line-height: 1.25;
    }

    input:not([type='checkbox']),
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
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;

    &.abilities {
      grid-template-columns: repeat(4, 1fr);
    }

    p,
    fieldset {
      grid-column: 1 / -1;
    }

    p {
      font-size: 0.9rem;
    }
  }

  .top {
    grid-column: span 2;
  }
</style>
