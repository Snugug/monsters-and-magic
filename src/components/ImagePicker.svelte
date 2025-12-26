<script lang="ts">
  import { ImageGenerator } from '$lib/image-generator';
  import { CREATURE_PROMPT } from '$lib/prompts';
  import { fileToImage, stringToImage } from '$js/images';
  import { getDir } from '$js/fs.svelte';
  import { getMany, setMany } from 'idb-keyval';
  import ImageDialog from '$components/ImageDialog.svelte';
  import Icon from '$components/Icon.svelte';
  import Loader from '$components/Loader.svelte';

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
  let generator: ImageGenerator;
  let keyInput = $state('');
  let loading = $state(false);
  let select = $state(!image);
  let popover: HTMLFormElement;
  let loaded = $state(false);
  let dialogOpen = $state(false);

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

  // Load API Key fron LocalStorage
  $effect(() => {
    apiKey = window.localStorage.getItem('apikey');
  });

  // Initialize ImageGenerator
  $effect(() => {
    if (apiKey) {
      generator = new ImageGenerator(apiKey, CREATURE_PROMPT);
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
    if (!generator) return;

    loading = true;
    try {
      const start = performance.now();
      const result = await generator.generate(prompt);
      const end = performance.now();
      console.log(`Image generation took ${end - start}ms`);
      if (result) {
        preview = result;
      }
    } catch (e) {
      console.error(e);
    }

    loading = false;
    select = false;
  }

  async function saveImage(e: SubmitEvent) {
    e.preventDefault();

    let startIn;
    try {
      startIn = await getDir('src/assets/images');
    } catch (e) {
      console.log('No starting directory, ignoring startIn');
      // console.error(e);
    }

    handler = await window.showSaveFilePicker({
      startIn,
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
    if (!preview) return;

    image = preview;
    preview = '';
    handler = null;
    file = null;
    popover.hidePopover();
  }

  $effect(() => {
    if (popover) {
      popover.addEventListener('beforetoggle', (e) => {
        // When the popover closes, implicitly use the generated image if one exists
        // This handles dismissing the popover by clicking outside or pressing Escape
        if (e.newState === 'closed' && preview) {
          image = preview;
          preview = '';
          handler = null;
          file = null;
        }
      });
    }
  });

  async function chooseImage(e: Event) {
    e.preventDefault();
    [handler] = await window.showOpenFilePicker({
      startIn: await getDir('src/assets/images'),
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
    <div class="loader-container">
      <Loader size="50%" />
    </div>
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
          <Icon label="Generate an Image" icon="imagegen" />
        </button>
      </div>
    {/if}

    {#if !select}
      {#if preview}
        <button
          class="big-preview"
          onclick={(e) => {
            e.preventDefault();
            dialogOpen = true;
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
            dialogOpen = true;
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

<ImageDialog
  images={preview ? [preview] : image ? [image] : []}
  bind:open={dialogOpen}
/>

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
      <input type="submit" class="action-btn" value="Add API Key" />
    {:else}
      <div class="generate--group">
        <label for="prompt">Describe your {type}</label>
        <textarea disabled={loading} name="prompt" bind:value={prompt}
        ></textarea>
      </div>
      <button
        disabled={loading || prompt === ''}
        type="submit"
        class="ai-generate-btn"
      >
        <Icon icon="sparkle" />
        Generate
      </button>

      {#if preview}
        <div class="action-buttons">
          <button disabled={loading} onclick={useImage} class="action-btn">
            <Icon icon="add" /> Use
          </button>
          <button disabled={loading} onclick={saveImage} class="action-btn">
            <Icon icon="download" /> Save
          </button>
        </div>
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

  .img {
    object-fit: cover;
    height: 100%;
    width: 100%;
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
      gap: 0.5rem;
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
      // margin-block-start: -0.5rem;
    }

    button,
    [type='submit'] {
      font-size: 0.75rem;
      // background: var(--light-purple);
      padding: 0.25rem 0.5rem;
      border: none;
      text-align: center;
      font-weight: normal;
    }
  }

  .ai-generate-btn {
    // background: var(--dark-red);
    // color: white;
    // border: none;
    // padding: 0.25rem 0.5rem;
    // border-radius: 0.25rem;
    cursor: pointer;
    font-size: 1rem !important;
    // font-weight: bold;
    border: 1px solid var(--dark-red);
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;
    grid-column: 1 / -1;

    :global(.icon) {
      width: 1.25em;
      height: 1.25em;
      fill: currentColor;
    }

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }

  .action-buttons {
    grid-column: 1 / -1;
    display: flex;
    gap: 0.5rem;

    button {
      flex: 1;
    }
  }

  .action-btn {
    background: var(--dark-red);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    font-weight: bold;
    border-radius: 5px;

    :global(.icon) {
      width: 1em;
      height: 1em;
      fill: currentColor;
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

  .loader-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
