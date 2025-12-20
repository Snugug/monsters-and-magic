<script lang="ts">
  import ImagePicker from '$components/ImagePicker.svelte';
  import { db } from '$js/db';
  import {
    sizes,
    elements,
    vision,
    speeds,
    dieSizes,
    baseMonster,
    newWeaponBase,
    newAttackBase,
    tags,
    swarmImmunities,
    type allTags,
  } from '$lib/shared';
  import { calculatePoints, types as monsterTypes } from '$js/monsters';
  import { md } from '$js/md';
  import { fileToImage } from '$js/images';
  import { slugify, capitalize } from '$lib/helpers';
  import {
    getPath,
    writeFile,
    writeImage,
    getFileHandle,
    getDir,
    folder,
    chooseFolder,
  } from '$js/fs.svelte';
  import Multiselect from '$components/Multiselect.svelte';
  import Repeater from '$components/Repeater.svelte';
  import type { RepeaterActions } from '$components/Repeater.svelte';
  import Icon from '$components/Icon.svelte';
  import { tick } from 'svelte';
  import { delMany, getMany, setMany } from 'idb-keyval';
  import { addToast } from '$lib/toast.svelte';

  const [
    lineages,
    armor,
    techniques,
    traits,
    weapons,
    feats,
    cantrips,
    charms,
    conditionsRaw,
  ] = await Promise.all([
    db.lineage.toArray(),
    db.armor.toArray(),
    db.techniques.toArray(),
    db.traits.toArray(),
    db.weapons.toArray(),
    db.feats.toArray(),
    db.cantrips.toArray(),
    db.charms.toArray(),
    db.conditions.toArray(),
  ]);

  const conditions = conditionsRaw.sort((a, b) => {
    if (a.status && !b.status) return 1;
    if (!a.status && b.status) return -1;
    return 0;
  });

  let image = $state('');
  let file = $state() as File;
  let handler = $state() as FileSystemFileHandle;
  let prompt = $state('');
  let imagePicker: ImagePicker;

  let lineage = $state('') as string | undefined;
  let type = $state('') as (typeof monsterTypes)[number];
  let size = $state('') as (typeof sizes)[number];
  let swarm = $state(false) as false | (typeof sizes)[number];

  let body = $state('');
  let hp = $state(5);
  let loaded = $state(false);

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

  let monster = $state(structuredClone(baseMonster));

  let baseSpeed = $derived.by(() =>
    calculateBaseSpeed(monster.size, monster.swarm),
  );

  function calculateBaseSpeed(
    size: typeof monster.size,
    swarm: typeof monster.swarm,
  ) {
    if (swarm) {
      if (swarm === 'tiny') return 20;
      if (swarm === 'large') return 40;
      if (swarm === 'huge') return 40;
      if (swarm === 'gargantuan') return 40;
    } else {
      if (size === 'tiny') return 20;
      if (size === 'large') return 40;
      if (size === 'huge') return 40;
      if (size === 'gargantuan') return 40;
    }

    return 30;
  }

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
    elemList.filter((a) => {
      const filter =
        !monster.immunity.includes(a.id) &&
        !monster.vulnerable.includes(a.id) &&
        !monster.absorbent.includes(a.id);

      if (monster.swarm && a.id === 'physical') return false;

      return filter;
    }),
  );
  const immuneList = $derived(
    elemList.filter(
      (a) =>
        !monster.resistance.includes(a.id) &&
        !monster.vulnerable.includes(a.id) &&
        !monster.absorbent.includes(a.id),
    ),
  );
  const vulnList = $derived(
    elemList.filter((a) => {
      const filter =
        !monster.resistance.includes(a.id) &&
        !monster.immunity.includes(a.id) &&
        !monster.absorbent.includes(a.id);

      if (monster.swarm && a.id === 'physical') return false;

      return filter;
    }),
  );

  const absList = $derived(
    elemList.filter(
      (a) =>
        !monster.resistance.includes(a.id) &&
        !monster.immunity.includes(a.id) &&
        !monster.vulnerable.includes(a.id),
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

  const nwBase = structuredClone(newWeaponBase);
  const nwAtkBase = structuredClone(newAttackBase);

  // Set defaults based on monster type;
  $effect(() => {
    const t = type !== monster.type;
    const s = size !== monster.size;
    const sw = swarm !== monster.swarm;

    if (t) {
      abilities.focus.max = 5;
      abilities.focus.min = -5;
      abilities.power.max = 5;
      abilities.power.min = -5;
      abilities.cunning.max = 5;
      abilities.cunning.min = -5;
      abilities.luck.max = 5;
      abilities.luck.min = -2;

      let nwSwitch = false;
      let n = monster.naturalWeapons[0].name;
      switch (monster.type) {
        case 'beast':
        case 'dragon':
        case 'monstrosity':
          nwBase.name = 'Claw';
          if (n === 'Tendril' || n === 'Fist') nwSwitch = true;
          break;
        case 'ooze':
        case 'aberration':
          nwBase.name = 'Tendril';
          if (n === 'Claw' || n === 'Fist') nwSwitch = true;
          break;
        default:
          nwBase.name = 'Fist';
          if (n === 'Tendril' || n === 'Claw') nwSwitch = true;
          break;
      }

      if (monster.naturalWeapons.length === 1 && nwSwitch) {
        monster.naturalWeapons[0].name = nwBase.name;
      }

      type = monster.type;
    }

    if (s || t || sw) {
      // Reset Speed
      if (s || sw) {
        const oldSpeed = calculateBaseSpeed(size, swarm);
        for (const spd of monster.speeds) {
          if (monster[spd] === oldSpeed) monster[spd] = baseSpeed;
        }
        if (monster.walking === oldSpeed) monster.walking = baseSpeed;
      }

      abilities.strong = null;
      abilities.hp = null;

      switch (monster.size) {
        case 'tiny':
          // abilities.power.max -= 1;
          // abilities.cunning.max += 1;
          hp = 3;
          break;
        case 'small':
          hp = 4;
          break;
        case 'medium':
          hp = 5;
          break;
        case 'large':
          // abilities.power.min += 1;
          abilities.strong = 0;
          abilities.hp = 0;
          hp = 6;
          break;
        case 'huge':
          // abilities.power.min += 2;
          // abilities.power.max += 1;
          // abilities.cunning.max -= 1;
          abilities.strong = 2;
          abilities.hp = 1;
          hp = 7;
          break;
        case 'gargantuan':
          // abilities.power.min += 3;
          // abilities.power.max += 2;
          // abilities.cunning.max -= 2;
          abilities.strong = 2;
          abilities.hp = 2;
          hp = 10;
          break;
      }

      // if (monster.power > abilities.power.max) {
      //   monster.power = abilities.power.max;
      // }
      // if (monster.power < abilities.power.min) {
      //   monster.power = abilities.power.min;
      // }

      size = monster.size;
      swarm = monster.swarm;
    }
  });
  // Reset lineage, traits, and feats if humanoid
  $effect(() => {
    if (monster.type !== 'humanoid') {
      monster.lineage = '';
      monster.traits = [];
    }
  });

  // Reset monster traits if lineage changes
  $effect(() => {
    if (monster.lineage !== lineage) {
      monster.traits = [];
      lineage = monster.lineage;
    }
  });

  // Swarm and Incorporeal
  $effect(() => {
    // if (monster.swarm) {
    //   if (!monster.resistance.includes('physical')) {
    //     monster.resistance.push('physical');
    //   }
    //   if (!monster.occupier) {
    //     monster.occupier = true;
    //   }
    //   // if (!monster.amorphous) {
    //   //   monster.amorphous = true;
    //   // }
    // }

    if (monster.incorporeal && !monster.immunity.includes('physical')) {
      monster.immunity.push('physical');
    }
  });

  // Tunnler
  $effect(() => {
    if (monster.tunnler && !monster.speeds.includes('burrowing')) {
      monster.speeds.push('burrowing');
    }
  });

  function space(size: false | (typeof sizes)[number]) {
    switch (size) {
      case 'tiny':
        return 2.5;
      case 'large':
        return 10;
      case 'huge':
        return 15;
      case 'gargantuan':
        return 20;
      default:
        return 5;
    }
  }

  function pluralMonsterType(type: typeof monster.type) {
    switch (type) {
      case 'fey':
      case 'undead':
        return type;
      case 'monstrosity':
        return 'monstrosities';
      default:
        return type + 's';
    }
  }

  // Prompt
  $effect(() => {
    if (!image && monster.title) {
      let size = space(monster.size);
      let swarm = space(monster.swarm);
      let plural = pluralMonsterType(monster.type);
      const canSwarm = monster.swarm && monster.size !== 'tiny';

      prompt = `A ${monster.title}.\n\nA ${monster.size} (fits inside a ${size} foot by ${size} foot square)${canSwarm ? ` swarm of ${monster.swarm} (fits inside a ${swarm} foot by ${swarm} foot square) ` : ' '}${canSwarm ? plural : monster.type}.\n\n${body}`;
    }
  });

  // State
  $effect(async () => {
    if (loaded === false) {
      const [m, b, p] = await getMany(['monster', 'body', 'monster-prompt']);

      if (m) monster = m;
      if (b) body = b;
      if (p) prompt = p;

      loaded = true;
    } else {
      const m = $state.snapshot(monster);
      const b = $state.snapshot(body);
      const p = $state.snapshot(prompt);
      await setMany([
        ['monster', m],
        ['body', b],
        ['monster-prompt', p],
      ]);
    }
  });

  const preview = $derived.by(() => calculatePoints(monster));

  // $inspect(monster);
  // $inspect(preview);

  async function saveMonster(e: SubmitEvent) {
    e.preventDefault();
    // Track if this is a new monster (no existing file handler)
    const isNewMonster = !handler;
    try {
      let imagePath = '';
      const slug = slugify(monster.title);
      const uid = Math.floor(Date.now()).toString(36);

      let pth;
      if (handler) {
        pth = await getPath(handler);
      } else if (image) {
        const f = await writeImage(
          `src/images/monsters/${slug}-${uid}.png`,
          image,
        );
        pth = await getPath(f);
        addToast(
          `Image for ${monster.title} saved to ${pth.join('/')}`,
          'success',
        );
      }

      if (pth) {
        if (pth[0] === 'src') {
          pth.shift();
        }
        imagePath = pth.join('/');
      }

      const m = structuredClone($state.snapshot(monster));
      m.image = imagePath;

      const copy = await md.compile(body, m);
      const f = await writeFile(`src/content/monsters/${slug}.md`, copy);
      const output = await getPath(f);
      addToast(`${monster.title} saved to ${output.join('/')}`, 'success');
    } catch (e) {
      addToast(
        `There was a problem saving ${monster.title}: ${e.message}`,
        'failure',
      );
      console.error(e);
    }
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
    } else {
      body = '';
    }
    const { image: img } = attributes;
    delete attributes.image;
    if (img) {
      handler = await getFileHandle(`src/${img}`);
      file = await handler.getFile();
      image = await fileToImage(file);
    } else {
      handler = null;
      file = null;
      image = null;
    }

    monster = structuredClone(baseMonster);
    await tick();
    await tick();

    const combined = Object.assign(structuredClone(baseMonster), attributes);

    monster = combined;
  }

  async function resetMonster(e: Event) {
    e.preventDefault();
    monster = structuredClone(baseMonster);
    body = '';
    handler = null;
    file = null;
    image = null;
    prompt = '';
    imagePicker.reset();
    await delMany(['monster', 'body', 'handler', 'image', 'file']);
  }

  let swarmBase = $derived(sizes.slice(0, sizes.indexOf(monster.size)));
</script>

{#if !folder.current}
  <div class="folder-picker">
    <div class="message">
      <h1 class="type--h1">Project Folder Required</h1>
      <p>
        Please select the folder where the BuildAMonster tool should save its
        data.
      </p>
    </div>
    <button class="folder-btn" onclick={chooseFolder}>
      <Icon icon="folder" /> Choose Folder
    </button>
  </div>
{:else}
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
        <label for="size">Swarm Of</label>
        <select
          name="size"
          bind:value={monster.swarm}
          disabled={monster.size === 'tiny' ? true : null}
        >
          <option value={false}>-</option>
          {#each swarmBase as s}
            <option value={s}>{capitalize(s)}</option>
          {/each}
        </select>
      </div>

      <div class="group top">
        <label for="type">Type</label>
        <select name="type" bind:value={monster.type} required>
          {#each monsterTypes as type}
            <option value={type}
              >{capitalize(
                monster.swarm ? pluralMonsterType(type) : type,
              )}</option
            >
          {/each}
        </select>
      </div>

      <div class="group full">
        <label for="body">Description</label>
        <textarea name="body" bind:value={body}></textarea>
      </div>

      <div class="image">
        <ImagePicker
          bind:image
          bind:file
          bind:handler
          bind:prompt
          bind:this={imagePicker}
          type="monster"
        />
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
          All monsters start with a 0/1/1/0 spread. Different creature types
          have different minimums and maximums.
        </p>
      </fieldset>

      {#if monster.type === 'humanoid'}
        <fieldset>
          <legend>Lineage</legend>
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
            required
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
          <label for="type">Spicy</label>
          <select name="type" bind:value={monster.spicy}>
            <option value="">-</option>
            {#each elements as e}
              <option value={e}>{capitalize(e)}</option>
            {/each}
          </select>
          <p>
            The first time a creature touches this monster in a turn, it takes{monster.spicy ===
            'fatigue'
              ? ' ¼ of '
              : ''}
            {preview.baseDamage}
            damage of this type.
          </p>
        </div>
        <div class="group">
          <label for="type">Radiates</label>
          <select name="type" bind:value={monster.radiates}>
            <option value="">-</option>
            {#each elements as e}
              <option value={e}>{capitalize(e)}</option>
            {/each}
          </select>
          <p>
            The first time a creature comes within {preview.space * 2}' of this
            monster in a turn, it takes{monster.radiates === 'fatigue'
              ? ' ¼ of '
              : ''}
            {preview.baseDamage} damage of this type.
          </p>
        </div>
      </fieldset>

      <fieldset>
        <legend>{equipment ? 'Equipment & ' : 'Weapons & '}Training</legend>
        <fieldset>
          <legend>Natural Weapons</legend>
          <div class="weapon-group">
            <Repeater bind:list={monster.naturalWeapons} base={nwBase} min="1">
              {#snippet item(
                l: typeof nwBase,
                i: number,
                actions: RepeaterActions,
              )}
                <div class="group">
                  <label for="base-nw-damage-{i}">Name</label>
                  <input
                    type="text"
                    id="base-nw-name-{i}"
                    bind:value={l.name}
                    required
                  />
                </div>
                <div class="group">
                  <label for="base-nw-damage-{i}">Damage</label>
                  <!-- dieSizes -->
                  <select
                    name="type"
                    id="base-nw-damage-{i}"
                    bind:value={l.damage}
                    required
                  >
                    {#each dieSizes as e}
                      <option value={e}>{e}</option>
                    {/each}
                  </select>
                </div>
                <div class="group">
                  <label for="base-nw-type-{i}">Damage Type</label>
                  <select
                    name="type"
                    id="base-nw-type-{i}"
                    bind:value={l.element}
                    required
                  >
                    {#each elements as e}
                      <option value={e}>{capitalize(e)}</option>
                    {/each}
                  </select>
                </div>
                {@render actions.all(i)}
              {/snippet}
            </Repeater>
          </div>
        </fieldset>

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
          bind:list={monster.feats}
          items={feats}
          legend="Feats"
          button="Add Feat"
        />
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
          <p>Increases HP by {hp}</p>
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
          bind:list={monster.vulnerable}
          items={vulnList}
          legend="Vulnerabilities"
          button="Add Vulnerability"
        />
        <Multiselect
          bind:list={monster.immunity}
          items={immuneList}
          legend="Damage Immunities"
          button="Add Immunity"
        />
        <Multiselect
          bind:list={monster.conditions}
          items={conditions}
          legend="Condition Immunities"
          button="Add Immunity"
          filter={(c) => {
            let include = true;
            if (c.status === true) {
              include = false;
            }

            if (include === true && monster.swarm) {
              if (swarmImmunities.includes(c.id)) {
                include = false;
              }
            }
            return include;
          }}
        />
        <Multiselect
          bind:list={monster.absorbent}
          items={absList}
          legend="Absorbs"
          button="Add Absorption"
        />
      </fieldset>

      <fieldset>
        <legend>Actions</legend>
        <div class="weapon-group">
          <Repeater
            bind:list={monster.attacks}
            base={nwAtkBase}
            empty="Add Action"
            min={0}
          >
            {#snippet item(
              l: typeof newAttackBase,
              i: number,
              actions: RepeaterActions,
            )}
              <div class="group full">
                <label for="nwa-name-{i}">Name</label>
                <input
                  type="text"
                  name="nwa-name-{i}"
                  id="nwa-name-{i}"
                  bind:value={l.name}
                  required
                />
              </div>
              <div class="group">
                <label for="nwa-type-{i}">Type</label>
                <select
                  name="nwa-type-{i}"
                  id="nwa-type-{i}"
                  bind:value={l.type}
                  required
                >
                  <option value="attack">Attack</option>
                  <option value="focus">Focus Save</option>
                  <option value="power">Power Save</option>
                  <option value="cunning">Cunning Save</option>
                  <option value="reaction">Reaction</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div class="group">
                <label for="nwa-damage-{i}">Damage</label>
                <!-- dieSizes -->
                <select
                  name="nwa-damage-{i}"
                  id="nwa-damage-{i}"
                  bind:value={l.damage}
                  disabled={l.type === 'other'}
                >
                  <option value="">-</option>
                  {#each dieSizes as e}
                    <option value={e}>{e}</option>
                  {/each}
                </select>
              </div>
              <div class="group">
                <label for="nwa-element-{i}">Damage Type</label>
                <select
                  name="nwa-element-{i}"
                  id="nwa-element-{i}"
                  bind:value={l.element}
                  disabled={l.type === 'other'}
                  required={l.damage !== ''}
                >
                  <option value="">-</option>
                  {#each elements as e}
                    <option value={e}>{capitalize(e)}</option>
                  {/each}
                </select>
              </div>
              <div class="group">
                <label for="nwa-condition-{i}">Condition or Status</label>
                <select
                  name="nwa-condition-{i}"
                  id="nwa-condition-{i}"
                  bind:value={l.condition}
                >
                  <option value="">-</option>
                  {#each conditions as e}
                    <option value={e.title}>{capitalize(e.title)}</option>
                  {/each}
                </select>
              </div>

              <div class="group">
                <label for="nwa-ap-{i}">Action Points</label>
                <input
                  type="number"
                  name="nwa-ap-{i}"
                  id="nwa-ap-{i}"
                  bind:value={l.ap}
                  min="1"
                  required
                  disabled={l.type === 'reaction'}
                />
              </div>

              <div class="group">
                <label for="nwa-fatigue-{i}">Fatigue</label>
                <input
                  type="number"
                  name="nwa-fatigue-{i}"
                  id="nwa-fatigue-{i}"
                  bind:value={l.fatigue}
                  required
                  min="0"
                />
              </div>

              <div class="group">
                <label for="nwa-recharge-{i}">Recharge</label>
                <select
                  name="nwa-recharge-{i}"
                  id="nwa-recharge-{i}"
                  bind:value={l.recharge}
                >
                  <option value="">-</option>
                  {#each ['1d4', '1d6', '1d8', '1d10'] as e}
                    <option value={e}>{e}</option>
                  {/each}
                </select>
              </div>
              <div class="group">
                <label for="nwa-thread-{i}" class="switch">
                  <span>Thread of Fate</span>
                  <input
                    id="nwa-thread-{i}"
                    name="nwa-thread-{i}"
                    type="checkbox"
                    bind:checked={l.thread}
                  />
                </label>
                <!-- <p>Requires a Thread of Fate to use</p> -->
              </div>
              {#if l.type === 'reaction'}
                <div class="group full">
                  <label for="nwa-trigger-{i}">Trigger</label>
                  <input
                    type="text"
                    name="nwa-trigger-{i}"
                    id="nwa-trigger-{i}"
                    bind:value={l.trigger}
                    required
                  />
                </div>
              {/if}
              <div class="group full">
                <label for="nwa-desc-{i}">Description</label>
                <textarea
                  name="nwa-desc-{i}"
                  id="nwa-desc-{i}"
                  bind:value={l.description}
                  required
                ></textarea>
              </div>
              <div class="attack-actions">
                {@render actions.all(i)}
              </div>
            {/snippet}
          </Repeater>
        </div>
      </fieldset>

      <fieldset>
        <legend>Traits</legend>
        {#each Object.entries(tags).sort( (a, b) => a[0].localeCompare(b[0]), ) as [t, d]}
          <div class="group">
            <label for={t} class="switch">
              <span>{d.tag || capitalize(t)}</span>
              <input id={t} type="checkbox" bind:checked={monster[t]} />
            </label>
            <p>{d.short || d.full}</p>
          </div>
        {/each}
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
        <div class="buttons">
          <button type="submit" class="action-btn">
            <Icon icon="download" /> Save Monster
          </button>
          <button onclick={loadMonster} class="action-btn">
            <Icon icon="upload" /> Load Monster
          </button>
          <button onclick={resetMonster} class="reset-btn">Reset</button>
        </div>
      </div>
    </div>
  </form>
{/if}

<style lang="scss">
  .folder-picker {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 50vh;
    gap: 1rem;
    text-align: center;

    .message {
      max-width: 40ch;
    }
  }

  .folder-btn {
    background: var(--dark-red);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    :global(.icon) {
      width: 1.25em;
      height: 1.25em;
      fill: currentColor;
    }
  }

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

    span {
      line-height: 1;
      padding-block: 0.25rem;
    }

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
      field-sizing: content;
      min-height: 5rem;
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

  .buttons {
    display: grid;
    gap: 0.5rem;
  }

  .weapon-group {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }

  .full {
    grid-column: 1 / -1;
  }

  .half {
    grid-column: span 2;
  }

  .attack-actions {
    grid-column: -2;
  }

  .group:has([required]) label {
    &:after {
      content: '*';
      color: var(--dark-red);
    }
  }

  textarea[name^='nwa-desc'] {
    field-sizing: content;
    min-height: 5rem;
  }

  .action-btn {
    background: var(--dark-red);
    color: white;
    border: 1px solid var(--dark-red);
    padding: 0.5rem 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-weight: normal;
    cursor: pointer;
    font-size: 1rem;
    border-radius: 5px;

    :global(.icon) {
      width: 1.25em;
      height: 1.25em;
      fill: currentColor;
    }
  }

  .reset-btn {
    background: none;
    border: none;
    padding: 0;
    color: var(--black);
    text-decoration: underline;
    cursor: pointer;
    justify-self: center;
  }
</style>
