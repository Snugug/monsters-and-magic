<script lang="ts">
  import type { GoogleGenAI } from '@google/genai';
  import Icon from '$components/Icon.svelte';

  let {
    type,
    image = $bindable(''),
    file = $bindable(),
    editable = $bindable(true),
  }: {
    type: string;
    image: string;
    file: File | null;
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

  const instance = `i-${crypto.randomUUID()}`;

  const core = `As the world's greatest artist and using the following prompt, generate an image in the style of hand painted and illustrated high fantasy art, like the kind you would find in a Dungeons & Dragons role playing book or an 80s movie poster. Do not include a border or an artist signature.
  
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
    const handler = await window.showSaveFilePicker({
      types: [
        {
          description: 'PNG File',
          accept: { 'image/png': ['.png'] },
        },
      ],
    });
    if (handler) {
      const writableStream = await handler.createWritable();
      const imageBlob = await (await fetch(preview)).blob();
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
    popover.hidePopover();
  }

  async function blobToBase64(blob: Blob): Promise<string> {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    return new Promise((resolve, reject) => {
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject('Unable to resolve as string');
        }
      };
    });
  }

  async function chooseImage(e: Event) {
    e.preventDefault();
    const [handler] = await window.showOpenFilePicker({
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
    const imageBlob = await (await fetch(URL.createObjectURL(file))).blob();
    image = await blobToBase64(imageBlob);
    select = false;
  }

  function clearPreview(e: Event) {
    e.preventDefault();
    preview = '';
  }
</script>

<div class="image" style={`anchor-name: --${instance}`}>
  {#if select}
    <div class="switch">
      <button class="switch--picker" onclick={chooseImage}>
        <Icon label="Select an Image" icon="imagesearch" />
      </button>
      <button class="switch--picker" popovertarget={instance}>
        <Icon label="Generate an Imag" icon="imagegen" />
      </button>
    </div>
  {/if}

  {#if !select}
    {#if image}
      <img src={image} alt="" class="img" />
      {#if editable}
        <button class="change" onclick={() => (select = true)}
          >Change Image</button
        >
      {/if}
    {:else if preview}
      <img src={preview} alt="" class="img" />
      <button class="change" onclick={clearPreview}>Clear Preview</button>
    {/if}
  {/if}
</div>

<form
  class="generate"
  onsubmit={!apiKey ? saveAPIKey : generateImage}
  style={`position-anchor: --${instance}`}
  id={instance}
  popover
  bind:this={popover}
>
  {#if !apiKey}
    <div class="generate--group">
      <label for="apikey">API Key</label>
      <input type="text" name="apikey" bind:value={keyInput} />
    </div>
    <input type="submit" value="Add API Key" />
  {:else}
    <div class="generate--group">
      <label for="prompt">Describe your {type}</label>
      <textarea disabled={loading} name="prompt" bind:value={prompt}></textarea>
    </div>
    <input disabled={loading} type="submit" value="Generate image" />

    {#if preview}
      <button disabled={loading} onclick={useImage}>Use</button>
      <button disabled={loading} onclick={saveImage}>Save</button>
    {/if}
  {/if}
</form>

<style lang="scss">
  .image {
    height: 100%;
    width: 100%;
    // border: 1px solid black;
    display: flex;
    position: relative;
  }

  .img {
    object-fit: cover;
  }

  .generate {
    &:popover-open {
      background-color: var(--white);
      position: absolute;
      padding: 1rem;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      box-shadow: 1px 1px 5px rgba(0, 0, 0, 0.5);
      border: 0;
      border-radius: 5px;
      width: 25ch;
      margin-inline-start: 1rem;
      position-area: center right;
      position-try-fallbacks: flip-inline, flip-block;
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
