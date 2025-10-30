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
  }: {
    type: string;
    image: string | null;
    file: File | null;
    handler: FileSystemFileHandle | null;
    editable: boolean;
  } = $props();

  let preview = $state('');
  let apiKey = $state('') as string | null;
  let ai: GoogleGenAI;
  let keyInput = $state('');
  let prompt = $state('');
  const model = 'gemini-2.5-flash-image';
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

  const core = `As the world's greatest artist and using the following prompt, generate an image in the style of hand painted and illustrated high fantasy art, like the kind you would find in a Dungeons & Dragons role playing book or an 80s movie poster. Do not include a border, an artist signature, or any text.
  
Draw an image of the following:\n`;

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
    });

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
</script>

<div class="image" style={`anchor-name: --${instance}`}>
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
</style>
