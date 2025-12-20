<script lang="ts">
  import {
    ImageGenerator,
    type InputImage,
    MODELS,
    getDefaultModelId,
  } from '$lib/image-generator';
  import { CREATURE_PROMPT } from '$lib/prompts';
  import { stringToImage } from '$js/images';
  import { getMany, setMany, delMany } from 'idb-keyval';
  import ImageDialog from '$components/ImageDialog.svelte';
  import Icon from '$components/Icon.svelte';
  import Loader from '$components/Loader.svelte';

  interface UploadedImage {
    input: InputImage;
    preview: string;
  }

  let apiKey = $state('') as string | null;
  let keyInput = $state('');
  let generator: ImageGenerator | null = $state(null);

  let selectedModel = $state(getDefaultModelId());
  let selectedPromptKey = $state('creature');
  let userPrompt = $state('');
  let generatedImages = $state<string[]>([]);
  let imageCount = $state(4);
  let loading = $state(false);
  let error = $state('');

  // Multi-image state
  let uploadedImages = $state<UploadedImage[]>([]);
  let draggedIndex = $state<number | null>(null);

  // Dialog state
  let dialogOpen = $state(false);
  let dialogIndex = $state(0);
  let dialogMode = $state<'uploaded' | 'generated'>('uploaded');
  let loaded = $state(false);

  const MAX_IMAGES = 4;

  const prompts = {
    creature: { label: 'Creature', prompt: CREATURE_PROMPT },
    none: { label: 'None', prompt: '' },
  };

  // Load API Key from LocalStorage
  $effect(() => {
    apiKey = window.localStorage.getItem('apikey');
  });

  // Persistence
  $effect(() => {
    (async () => {
      if (loaded === false) {
        const [p, k, c, u, g, m] = await getMany([
          'gen-userPrompt',
          'gen-selectedPromptKey',
          'gen-imageCount',
          'gen-uploadedImages',
          'gen-generatedImages',
          'gen-selectedModel',
        ]);

        if (p) userPrompt = p;
        if (k) selectedPromptKey = k;
        if (c) imageCount = c;
        if (u) uploadedImages = u;
        if (g) generatedImages = g;
        if (m) selectedModel = m;

        loaded = true;
      } else {
        await setMany([
          ['gen-userPrompt', $state.snapshot(userPrompt)],
          ['gen-selectedPromptKey', $state.snapshot(selectedPromptKey)],
          ['gen-imageCount', $state.snapshot(imageCount)],
          ['gen-uploadedImages', $state.snapshot(uploadedImages)],
          ['gen-generatedImages', $state.snapshot(generatedImages)],
          ['gen-selectedModel', $state.snapshot(selectedModel)],
        ]);
      }
    })();
  });

  // Initialize ImageGenerator when apiKey or selectedPromptKey changes
  $effect(() => {
    if (apiKey) {
      const systemPrompt =
        prompts[selectedPromptKey as keyof typeof prompts].prompt;
      generator = new ImageGenerator(apiKey, systemPrompt, selectedModel);
    } else {
      generator = null;
    }
  });

  function saveAPIKey(e: SubmitEvent) {
    e.preventDefault();
    window.localStorage.setItem('apikey', keyInput);
    apiKey = keyInput;
  }

  async function generateImage(e: SubmitEvent) {
    e.preventDefault();
    if (!generator) return;

    loading = true;
    error = '';
    generatedImages = [];

    try {
      // Get images in current order
      const images =
        uploadedImages.length > 0
          ? uploadedImages.map((img) => img.input)
          : undefined;

      const promises = Array(imageCount)
        .fill(null)
        .map(() => generator!.generate(userPrompt, images));
      const results = await Promise.all(promises);

      const validResults = results.filter((r): r is string => r !== null);

      if (validResults.length > 0) {
        // Results are already Data URIs
        generatedImages = validResults;
      } else {
        error = 'No images generated.';
      }
    } catch (e: any) {
      console.error(e);
      error = e.message || 'An error occurred during generation.';
    } finally {
      loading = false;
    }
  }

  function clearAPIKey() {
    window.localStorage.removeItem('apikey');
    apiKey = null;
    keyInput = '';
  }

  async function reset(e: Event) {
    e.preventDefault();
    userPrompt = '';
    selectedPromptKey = 'creature';
    selectedModel = getDefaultModelId();
    imageCount = 4;
    uploadedImages = [];
    generatedImages = [];
    error = '';

    await delMany([
      'gen-userPrompt',
      'gen-selectedPromptKey',
      'gen-imageCount',
      'gen-uploadedImages',
      'gen-generatedImages',
      'gen-selectedModel',
    ]);
  }

  // File System Access API for picking images
  async function pickImages() {
    try {
      const remainingSlots = MAX_IMAGES - uploadedImages.length;
      if (remainingSlots <= 0) {
        error = `Maximum of ${MAX_IMAGES} images allowed.`;
        return;
      }

      const handles = await window.showOpenFilePicker({
        multiple: true,
        types: [
          {
            description: 'Images',
            accept: {
              'image/jpeg': ['.jpg', '.jpeg'],
              'image/png': ['.png'],
              'image/webp': ['.webp'],
            },
          },
        ],
      });

      // Limit to remaining slots
      const filesToProcess = handles.slice(0, remainingSlots);

      for (const handle of filesToProcess) {
        const file = await handle.getFile();

        // Validate file type
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          continue;
        }

        const reader = new FileReader();
        const result = await new Promise<string>((resolve) => {
          reader.onload = (event) => {
            resolve(event.target?.result as string);
          };
          reader.readAsDataURL(file);
        });

        const base64 = result.split(',')[1];
        uploadedImages = [
          ...uploadedImages,
          {
            input: {
              base64,
              mimeType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
            },
            preview: result,
          },
        ];
      }
    } catch (e: any) {
      // User cancelled the picker
      if (e.name !== 'AbortError') {
        console.error(e);
        error = 'Failed to open file picker.';
      }
    }
  }

  function removeImage(index: number) {
    uploadedImages = uploadedImages.filter((_, i) => i !== index);
  }

  // Drag and drop handlers
  function handleDragStart(index: number) {
    draggedIndex = index;
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: DragEvent, dropIndex: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      draggedIndex = null;
      return;
    }

    const newImages = [...uploadedImages];
    const [draggedItem] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedItem);
    uploadedImages = newImages;
    draggedIndex = null;
  }

  function handleDragEnd() {
    draggedIndex = null;
  }

  // Dialog handlers
  function openDialog(index: number, mode: 'uploaded' | 'generated') {
    dialogIndex = index;
    dialogMode = mode;
    dialogOpen = true;
  }

  function getDialogImages(): string[] {
    if (dialogMode === 'uploaded') {
      return uploadedImages.map((img) => img.preview);
    }
    return generatedImages;
  }
</script>

<div class="container">
  <h1>Image Generator</h1>

  {#if !apiKey}
    <form class="api-key-form" onsubmit={saveAPIKey}>
      <p>Please enter your Google Gemini API Key to continue.</p>
      <div class="group">
        <label for="apikey">API Key</label>
        <input
          type="text"
          id="apikey"
          bind:value={keyInput}
          placeholder="Enter API Key"
          required
        />
      </div>
      <button type="submit">Save API Key</button>
    </form>
  {:else}
    <div class="controls">
      <button class="secondary small" onclick={clearAPIKey}
        >Clear API Key</button
      >
    </div>

    <form class="generator-form" onsubmit={generateImage}>
      <div class="row">
        <div class="group">
          <label for="prompt-select">System Prompt</label>
          <select id="prompt-select" bind:value={selectedPromptKey}>
            {#each Object.entries(prompts) as [key, { label }]}
              <option value={key}>{label}</option>
            {/each}
          </select>
        </div>

        <div class="group">
          <label for="model-select">Model</label>
          <select id="model-select" bind:value={selectedModel}>
            {#each MODELS as model}
              <option value={model.id}>
                {model.label}
              </option>
            {/each}
          </select>
        </div>

        <div class="group">
          <label for="image-count">Number of Images</label>
          <input
            type="number"
            id="image-count"
            bind:value={imageCount}
            min="1"
            max="4"
            required
          />
        </div>
      </div>

      <div class="group">
        <label for="user-prompt">Your Prompt</label>
        <textarea
          id="user-prompt"
          bind:value={userPrompt}
          placeholder="Describe what you want to generate..."
          disabled={loading}
        ></textarea>
      </div>

      <div class="group image-upload-group">
        <label>Include Images (optional, up to {MAX_IMAGES})</label>

        <div class="image-picker">
          {#if uploadedImages.length > 0}
            <div class="image-thumbnails">
              {#each uploadedImages as image, index}
                <div
                  class="thumbnail-wrapper"
                  class:dragging={draggedIndex === index}
                  draggable="true"
                  ondragstart={() => handleDragStart(index)}
                  ondragover={handleDragOver}
                  ondrop={(e) => handleDrop(e, index)}
                  ondragend={handleDragEnd}
                  role="listitem"
                >
                  <button
                    type="button"
                    class="thumbnail-btn"
                    onclick={() => openDialog(index, 'uploaded')}
                  >
                    <img src={image.preview} alt="Uploaded image {index + 1}" />
                  </button>
                  <button
                    type="button"
                    class="remove-btn"
                    onclick={() => removeImage(index)}
                    aria-label="Remove image"
                  >
                    <Icon icon="close" />
                  </button>
                  <span class="order-badge">{index + 1}</span>
                </div>
              {/each}
            </div>
          {/if}

          {#if uploadedImages.length < MAX_IMAGES}
            <button
              type="button"
              class="add-images-btn"
              onclick={pickImages}
              disabled={loading}
            >
              {uploadedImages.length === 0 ? 'Add Images' : 'Add More'}
            </button>
          {/if}

          <p class="hint">Only JPEG, PNG, and WebP files. Drag to reorder.</p>
        </div>
      </div>

      <div class="form-actions">
        <button class="secondary reset" onclick={reset}>Reset</button>
        <button
          type="submit"
          class="ai-generate-btn"
          disabled={loading || !userPrompt}
        >
          <Icon icon="sparkle" />
          Generate
        </button>
      </div>
    </form>

    {#if loading}
      <div class="loader-container">
        <Loader />
        <p>Generating your images...</p>
      </div>
    {/if}

    {#if error}
      <div class="error">
        <p>Error: {error}</p>
      </div>
    {/if}

    {#if generatedImages.length > 0}
      <div class="result">
        <h2>Results</h2>
        <div class="image-grid">
          {#each generatedImages as img, index}
            <div class="image-wrapper">
              <button
                type="button"
                class="image-btn"
                onclick={() => openDialog(index, 'generated')}
              >
                <img src={img} alt="Generated result" />
              </button>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- Image Preview Dialog -->
<ImageDialog
  images={getDialogImages()}
  bind:open={dialogOpen}
  startIndex={dialogIndex}
/>

<style lang="scss">
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  h1 {
    margin-bottom: 2rem;
    font-size: 2rem;
    font-weight: bold;
  }

  .row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1rem;
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 1rem;

    label {
      font-size: 0.75rem;
      text-transform: uppercase;
      line-height: 1.25;
    }
  }

  input[type='text'],
  input[type='number'],
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

  .group:has([required]) label {
    &:after {
      content: '*';
      color: var(--dark-red);
    }
  }

  button {
    background: var(--dark-red);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 1rem;
    font-weight: normal;
    border: 1px solid var(--dark-red);
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;
    // transition: opacity 0.2s;

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

  .secondary {
    background: var(--light-grey, #ccc);
    border: 1px solid black;
    color: black;
  }

  .small {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
  }

  .controls {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 1rem;
  }

  .result {
    margin-top: 3rem;
    border-top: 1px solid var(--light-grey, #ccc);
    padding-top: 2rem;

    h2 {
      margin-bottom: 1rem;
    }
  }

  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
  }

  .image-wrapper {
    .image-btn {
      display: block;
      width: 100%;
      padding: 0;
      border: none;
      background: none;
      cursor: zoom-in;

      img {
        width: 100%;
        height: auto;
        border-radius: 0.5rem;
        box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.1);
        display: block;
        transition: transform 0.2s;
      }

      &:hover img {
        transform: scale(1.02);
      }
    }
  }

  .hint {
    font-size: 0.75rem;
    color: var(--dark-grey, #666);
    margin-top: 0.5rem;
  }

  // Image picker styles
  .image-picker {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .image-thumbnails {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .thumbnail-wrapper {
    position: relative;
    width: 300px;
    height: 300px;
    border-radius: 0.5rem;
    overflow: visible;
    cursor: grab;
    transition:
      opacity 0.2s,
      transform 0.2s;

    &.dragging {
      opacity: 0.5;
      transform: scale(0.95);
    }

    &:hover .remove-btn {
      opacity: 1;
    }
  }

  .thumbnail-btn {
    width: 100%;
    height: 100%;
    padding: 0;
    border: 2px solid transparent;
    border-radius: 0.5rem;
    overflow: hidden;
    cursor: zoom-in;
    background: none;
    border-color: var(--grey);

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  .remove-btn {
    position: absolute;
    top: -0.5rem;
    right: -0.5rem;
    width: 1.5rem;
    height: 1.5rem;
    padding: 0;
    border-radius: 50%;
    background: var(--dark-red, #c00);
    color: white;
    font-size: 1.25rem;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    // transition: opacity 0.2s;
    z-index: 1;

    :global(.icon) {
      height: 1.25rem;
      width: 1.25rem;
      fill: currentColor;
    }

    &:hover {
      background: #a00;
    }
  }

  .order-badge {
    position: absolute;
    bottom: -0.75em;
    left: 50%;
    transform: translateX(-50%);
    background: var(--black, #000);
    color: var(--white, #fff);
    font-size: 0.75rem;
    font-weight: bold;
    border-radius: 50%;
    line-height: 1;
    height: 2em;
    width: 2em;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .add-images-btn {
    align-self: flex-start;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  .error {
    margin-top: 1rem;
    padding: 1rem;
    background: #fee;
    color: #c00;
    border-radius: 0.25rem;
  }

  .loader-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 2rem 0;
    gap: 1rem;
  }

  .form-actions {
    display: flex;
    gap: 3rem;
    justify-content: flex-end;
  }

  .reset {
    border: 0px;
    background: none;
    padding: 0;
    text-decoration: underline;

    &:disabled {
      opacity: 0.5;
    }
  }
</style>
