<script lang="ts">
  import type { GoogleGenAI } from '@google/genai';
  import { fileToImage, stringToImage } from '$js/images';
  import { getDir } from '$js/fs.svelte';
  import { getMany, setMany } from 'idb-keyval';
  import Icon from '$components/Icon.svelte';

  let {
    type,
    image = $bindable(''),
    file = $bindable(),
    handler = $bindable(),
    editable = $bindable(true),
    prompt = $bindable(''),
  }: {
    type: string;
    image: string | null;
    file: File | null;
    handler: FileSystemFileHandle | null;
    editable: boolean;
    prompt: string;
  } = $props();

  let preview = $state('');
  let apiKey = $state('') as string | null;
  let ai: GoogleGenAI;
  let keyInput = $state('');
  const model = 'nano-banana-pro-preview';
  let loading = $state(false);
  let select = $state(!image);
  let popover: HTMLFormElement;
  let imagepreview: HTMLElement;
  let loaded = $state(false);

  $effect(() => {
    if (image) {
      select = !image;
    } else if (image === null) {
      select = true;
    }
  });

  $effect(async () => {
    if (loaded === false) {
      const [h, i, f, p] = await getMany([
        'handler',
        'image',
        'file',
        'prompt',
      ]);
      if (h) handler = h;
      if (i) image = i;
      if (f) file = f;
      if (p) prompt = p;
      loaded = true;
    } else {
      await setMany([
        ['handler', handler],
        ['image', image],
        ['file', file],
        ['prompt', $state.snapshot(prompt)],
      ]);
    }
  });

  const instance = `i-${crypto.randomUUID()}`;

  const core = `
<system_instruction>
  <context>
    <role>
      You are a Master Fantasy Illustrator specializing in "Old School Renaissance" (OSR) aesthetics who has deep experience creating key artwork for fantasy novels, role playing games like Dungeons & Dragons and Pathfinder, and movie posters like the iconic Labyrinth, Gremlins, Star Wars, and Indiana Jones. You are creative and detail oriented. You have been commissioned to create assets for a new fantasy role playing game.
    </role>
    <core_directive>
      You must decouple the **Subject Style** from the **Background Style**.
      1.  **Subject:** The subject must be rendered in the following style
        * **Medium:** Traditional oil painting on canvas.
        * **Influences:** Jeff Easley, Larry Elmore, Clyde Caldwell.
        * **Texture:** Visible brushstrokes, canvas grain, matte finish.
        * **Anti-patterns:** NO digital gloss, NO 3D render smoothness, NO modern photorealism.
      2.  **Background:** The background must be rendered based strictly on the Logic Controller below (either complex scenery OR digital void).
    </core_directive>
  </context>

  <logic_controller>
    <trigger_analysis>
      Scan the user input for the exact tags: \`[scene]\` AND \`[/scene]\`.
    </trigger_analysis>

    <branching_paths>
      <!-- PATH A: CUSTOM SCENE (Full Bleed Illustration) -->
      <path id="custom_scene">
        <condition>Tags \`[scene]...[/scene]\` are DETECTED.</condition>
        <instruction>
          Generate a full-canvas oil painting. Ignore white background constraints. Paint the environment exactly as described inside the tags.
        </instruction>
      </path>

      <!-- PATH B: CHARACTER VIGNETTE (Strict Isolation) -->
      <path id="default_vignette">
        <condition>Tags \`[scene]...[/scene]\` are NOT DETECTED.</condition>
        <instruction>
          You must generate a "Spot Illustration" (Die-cut/Sticker style).

          **Mandatory Composition Rules:**
          1. **Isolation:** The subject must be strictly isolated on a **PURE WHITE HEX #FFFFFF** background.
          2. **No Canvas Texture in Background:** The oil painting texture applies *only* to the creature, NOT the empty space. The white space must be digital and flat.
          
          **Grounding Rules:**
          * Do NOT float the creature in void (unless it flies).
          * **Ground Walkers:** Paint a *minimal* patch of ground (stone/grass/sand) *only immediately beneath the feet*. This ground patch must fade/feather rapidly into the white background.
          * **Swimmers:** Paint minimal water/bubbles immediately surrounding the body, fading into white.
          * **Flyers:** No ground features. Pure white surrounding the creature.
        </instruction>
        <negative_constraints>
          border, frame, paper texture, book binding, table, 3d render, sketch pad, margin, text, beige background, canvas grain on background.
        </negative_constraints>
      </path>
    </branching_paths>
  </logic_controller>

  <constraints>
    <technical>
      * Aspect Ratio: Square (1:1).
      * Borders: NONE.
      * Signature: NONE.
      * Style: Vintage, Analog, Matte.
    </technical>

    <anatomical>
      * **Symmetry & Logic:** Ensure limbs match in size/length unless asymmetric by design.
      * **Articulation:** Joints must bend in natural directions.
      * **Integration:** Appendages must connect seamlessly to the torso (musculature, not pasted on).
      * **Digits:** Count fingers/toes carefully. Avoid "AI polydactyly" (extra fingers).
      * **Physics:** Solid matter cannot clip through solid matter.
    </anatomical>

    <anti_meta_artifacts>
      * **CRITICAL:** Do not draw the *medium*. Do not draw a picture of a book, a page or paper, or similar, containing a drawing of the creature. Do not draw pencils or brushes.
    </anti_meta_artifacts>
  </constraints>

  <generation_protocol>
    <step_1>
      Analyze User Input. Determine Path (Scene vs. Vignette).
    </step_1>
    <step_2>
      Construct the internal image prompt.
      * IF Vignette: Append keywords: "isolated on white background, die-cut, sticker art, no background, studio lighting."
      * IF Vignette: Enforce Negative Prompt: "paper, stationery, border, frame, book, messy background."
    </step_2>
    <step_3>
      Generate Image using the specific logic defined in \`logic_controller\`.
    </step_3>
  </generation_protocol>

  <verification_protocol>
    <instruction>
      Before finalizing the image generation, you must perform a "Pre-Flight Check" based on the constraints. 
    </instruction>
    
    <checklist>
      1.  **Tag Check:** Did I detect \`[scene]\`? (Yes = Full background / No = #ffffff White).
      2.  **Conflict Check:** If Default Mode, did I ensure the "tufts of grass" do not become a full forest? They must be a tiny island in a white sea.
      3.  **Anatomy Check:** Does the prompt explicitly describe the limb count to prevent errors?
    </checklist>

    <failure_handling>
      If the generated result violates constraints (e.g., background is not #ffffff when it should be, or creature has 6 fingers), you are mandated to discard it and retry up to 3 times with higher "guidance_scale" or stricter negative prompting.
    </failure_handling>
  </verification_protocol>

  <user_input_processing>
    Receive user description. Apply Logic Controller. Execute.
  </user_input_processing>
</system_instruction>

Please draw the following creature:\n`;

  // Load API Key fron LocalStorage
  $effect(() => {
    apiKey = window.localStorage.getItem('apikey');
  });

  // Import Google GenAI Module
  $effect(async () => {
    if (apiKey) {
      const { GoogleGenAI } = await import('@google/genai');
      ai = new GoogleGenAI({
        apiKey,
      });

      // console.log(await ai.models.list());
    }
  });

  // Save API Key
  function saveAPIKey(e: SubmitEvent) {
    e.preventDefault();
    window.localStorage.setItem('apikey', keyInput);
    apiKey = keyInput;
  }

  async function generateImage(e: SubmitEvent) {
    e.preventDefault();
    loading = true;
    const response = await ai.models.generateContent({
      model,
      contents: core + prompt,
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio: '1:1',
          resolution: '2k',
          personGeneration: 'allow_all',
        },
      },
    });

    const reason = response.candidates[0].finishReason;

    if (reason !== 'STOP') {
      loading = false;
      select = false;

      console.error(reason);

      return;
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        if (part.inlineData.data) {
          preview = `data:image/png;base64, ${part.inlineData.data}`;
        }
        // const buffer = Buffer.from(part.inlineData.data, 'base64');
      }
    }
    loading = false;
    select = false;
  }

  async function saveImage(e: SubmitEvent) {
    e.preventDefault();
    handler = await window.showSaveFilePicker({
      startIn: await getDir('public/images/monsters'),
      types: [
        {
          description: 'PNG File',
          accept: { 'image/png': ['.png'] },
        },
      ],
    });
    if (handler) {
      const writableStream = await handler.createWritable();
      const imageBlob = await stringToImage(preview);
      await writableStream.write(imageBlob);
      await writableStream.close();
      file = (await handler.getFile()) as File;
      image = preview;
      preview = '';
      popover.hidePopover();
    }
  }

  function useImage(e: Event) {
    e.preventDefault();
    image = preview;
    preview = '';
    handler = null;
    file = null;
    popover.hidePopover();
  }

  $effect(() => {
    if (popover) {
      popover.addEventListener('beforetoggle', (e) => {
        if (e.newState === 'closed') {
          useImage(e);
        }
      });
    }
  });

  async function chooseImage(e: Event) {
    e.preventDefault();
    [handler] = await window.showOpenFilePicker({
      startIn: await getDir('public/images/monsters'),
      types: [
        {
          description: 'PNG File',
          accept: { 'image/png': ['.png'] },
        },
        {
          description: 'JPEG File',
          accept: { 'image/jpeg': ['.jpg', '.jpeg'] },
        },
      ],
    });
    file = (await handler.getFile()) as File;
    image = await fileToImage(file);
    select = false;
  }

  function clearPreview(e: Event) {
    e.preventDefault();
    preview = '';
    if (!image) {
      select = true;
    }
  }

  export function reset() {
    preview = '';
    select = true;
    loading = false;
    image = null;
    file = null;
    handler = null;
  }
</script>

<div class="image" style={`anchor-name: --${instance}`}>
  {#if loading}
    <div class="loader"></div>
  {:else}
    {#if select}
      <div class="switch">
        <button class="switch--picker" onclick={chooseImage}>
          <Icon label="Select an Image" icon="imagesearch" />
        </button>
        <button
          class="switch--picker"
          onclick={(e) => {
            e.preventDefault();
            popover.togglePopover();
          }}
        >
          <Icon label="Generate an Imag" icon="imagegen" />
        </button>
      </div>
    {/if}

    {#if !select}
      {#if preview}
        <button
          class="big-preview"
          onclick={(e) => {
            e.preventDefault();
            imagepreview.togglePopover();
          }}
        >
          <img src={preview} alt="" class="img" />
        </button>
        <button class="change" onclick={clearPreview}>Clear Preview</button>
      {:else if image}
        <button
          class="big-preview"
          onclick={(e) => {
            e.preventDefault();
            imagepreview.togglePopover();
          }}
        >
          <img src={image} alt="" class="img" />
        </button>
        {#if editable}
          <button class="change" onclick={() => (select = true)}
            >Change Image</button
          >
        {/if}
      {/if}
    {/if}
  {/if}
</div>

<div class="image-preview" id="image-preview" popover bind:this={imagepreview}>
  <div class="inner">
    {#if image}
      <img src={image} alt="" />
    {:else if preview}
      <img src={preview} alt="" />
    {/if}
    <button
      class="close"
      onclick={(e) => {
        e.preventDefault();
        imagepreview.togglePopover();
      }}><Icon label="close" icon="close" /></button
    >
  </div>
</div>

<form
  class="generate"
  onsubmit={!apiKey ? saveAPIKey : generateImage}
  style={`position-anchor: --${instance}`}
  id={instance}
  popover
  bind:this={popover}
>
  <div class="generate--inner">
    {#if !apiKey}
      <div class="generate--group">
        <label for="apikey">API Key</label>
        <input type="text" name="apikey" bind:value={keyInput} />
      </div>
      <input type="submit" value="Add API Key" />
    {:else}
      <div class="generate--group">
        <label for="prompt">Describe your {type}</label>
        <textarea disabled={loading} name="prompt" bind:value={prompt}
        ></textarea>
      </div>
      <input disabled={loading} type="submit" value="Generate image" />

      {#if preview}
        <button disabled={loading} onclick={useImage}>Use</button>
        <button disabled={loading} onclick={saveImage}>Save</button>
      {/if}
    {/if}
  </div>
</form>

<style lang="scss">
  .image {
    height: 100%;
    width: 100%;
    // border: 1px solid black;
    display: flex;
    position: relative;
  }

  .big-preview {
    border: 0;
    padding: 0;
    margin: 0;
    background: none;
    height: 100%;
    width: 100%;
    object-fit: cover;
  }

  .close {
    position: absolute;
    background: none;
    border: none;
    padding: 0.25rem;
    border-radius: 100%;
    top: 0.25rem;
    right: 0.25rem;
    height: 1.5rem;
    width: 1.5rem;
    background: var(--light-grey);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid black;

    :global(.icon) {
      height: 1.5rem;
      width: 1.5rem;
    }
  }

  .img {
    object-fit: cover;
    height: 100%;
    width: 100%;
  }

  .image-preview:popover-open {
    max-height: 80vh;
    max-width: 80vw;
    margin-inline: auto;
    margin-block: auto;
    position: relative;
    border: none;
    background: transparent;
    padding: 1rem;

    .inner {
      background-color: white;
      padding: 1rem;
      border: 1px solid black;
      box-shadow: 0px 0px 5px 2.5px rgba(0, 0, 0, 0.5);
    }

    img {
      max-width: 100%;
      height: auto;
    }
  }

  .generate {
    position-area: center right;
    &:popover-open {
      position: absolute;
      background: transparent;
      border: 0;
      height: min-content;
      filter: drop-shadow(0px 0px 5px rgba(0, 0, 0, 0.75));
    }

    &--inner {
      background-color: var(--white);
      position: relative;
      padding: 1rem;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      border-radius: 5px;
      width: 25ch;
      margin-inline-start: 10px;

      &:before {
        position: absolute;
        left: -10px;
        top: calc(50% - 5px);
        content: '';
        display: block;
        width: 0;
        height: 0;
        border-top: 10px solid transparent;
        border-bottom: 10px solid transparent;

        border-right: 10px solid var(--white);
      }
    }

    label {
      text-transform: uppercase;
      font-size: 0.75rem;
      line-height: 1.25;
    }

    input,
    textarea {
      width: 100%;
    }

    textarea {
      resize: none;
      field-sizing: content;
      min-height: 5rem;
      max-height: 10rem;
    }

    &--group {
      display: grid;
      grid-column: 1 / -1;
    }

    [type='submit'] {
      grid-column: 1 / -1;
      margin-block-start: -0.5rem;
    }

    button,
    [type='submit'] {
      font-size: 0.75rem;
      background: var(--light-purple);
      padding: 0.25rem 0.5rem;
      border: none;
      text-align: center;
    }
  }

  .change {
    position: absolute;
    width: 100%;
    left: 0;
    bottom: 0;
    font-size: 0.75rem;
    text-align: right;
    background-color: rgba(0, 0, 0, 0.5);
    border: 0;
    color: white;
    text-shadow:
      1px 0 black,
      0 1px black,
      2px 0 black,
      0 2px black;
  }

  .switch {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    justify-content: center;
    flex-grow: 0;
    overflow: hidden;
    padding: 0.5rem;

    &--picker {
      background: none;
      border: 0;
      flex-grow: 0;
      flex-shrink: 1;
      height: 100%;
      padding: 0;
      cursor: pointer;

      :global(.icon) {
        height: 100%;
      }
    }
  }

  /* HTML: <div class="loader"></div> */
  .loader {
    width: 50%;
    height: 50%;
    aspect-ratio: 1 / 1;
    display: grid;
    align-self: center;
    margin-inline: auto;
    color: transparent;
    font-size: 1px;
    overflow: hidden;
  }
  .loader::before,
  .loader::after {
    content: '';
    grid-area: 1/1;
    --c: no-repeat linear-gradient(var(--dark-yellow) 0 0);
    background:
      var(--c) 0 0,
      var(--c) 100% 0,
      var(--c) 100% 100%,
      var(--c) 0 100%;
    animation:
      l10-1 2s infinite linear,
      l10-2 2s infinite linear;
  }
  .loader::after {
    margin: 25%;
    transform: scale(-1);
  }
  @keyframes l10-1 {
    0% {
      background-size:
        0 4px,
        4px 0,
        0 4px,
        4px 0;
    }
    12.5% {
      background-size:
        100% 4px,
        4px 0,
        0 4px,
        4px 0;
    }
    25% {
      background-size:
        100% 4px,
        4px 100%,
        0 4px,
        4px 0;
    }
    37.5% {
      background-size:
        100% 4px,
        4px 100%,
        100% 4px,
        4px 0;
    }
    45%,
    55% {
      background-size:
        100% 4px,
        4px 100%,
        100% 4px,
        4px 100%;
    }
    62.5% {
      background-size:
        0 4px,
        4px 100%,
        100% 4px,
        4px 100%;
    }
    75% {
      background-size:
        0 4px,
        4px 0,
        100% 4px,
        4px 100%;
    }
    87.5% {
      background-size:
        0 4px,
        4px 0,
        0 4px,
        4px 100%;
    }
    100% {
      background-size:
        0 4px,
        4px 0,
        0 4px,
        4px 0;
    }
  }

  @keyframes l10-2 {
    0%,
    49.9% {
      background-position:
        0 0,
        100% 0,
        100% 100%,
        0 100%;
    }
    50%,
    100% {
      background-position:
        100% 0,
        100% 100%,
        0 100%,
        0 0;
    }
  }
</style>
