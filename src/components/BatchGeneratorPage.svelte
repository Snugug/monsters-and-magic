<script lang="ts">
  import { ImageGenerator } from '$lib/image-generator';
  import { CREATURE_PROMPT } from '$lib/prompts';
  import { stringToImage } from '$js/images';
  import { getMany, setMany, delMany } from 'idb-keyval';
  import ImageDialog from '$components/ImageDialog.svelte';
  import Icon from '$components/Icon.svelte';
  import Loader from '$components/Loader.svelte';

  let apiKey = $state('') as string | null;
  let keyInput = $state('');
  let generator: ImageGenerator | null = $state(null);

  let selectedPromptKey = $state('creature');
  let promptsInput = $state('');
  let generatedImages = $state<string[]>([]);
  let loading = $state(false);
  let error = $state('');

  // Dialog state
  let dialogOpen = $state(false);
  let dialogIndex = $state(0);
  let loaded = $state(false);

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
        const [p, k, g] = await getMany([
          'batch-promptsInput',
          'batch-selectedPromptKey',
          'batch-generatedImages',
        ]);

        if (p) promptsInput = p;
        if (k) selectedPromptKey = k;
        if (g) generatedImages = g;

        loaded = true;
      } else {
        await setMany([
          ['batch-promptsInput', $state.snapshot(promptsInput)],
          ['batch-selectedPromptKey', $state.snapshot(selectedPromptKey)],
          ['batch-generatedImages', $state.snapshot(generatedImages)],
        ]);
      }
    })();
  });

  // Initialize ImageGenerator when apiKey or selectedPromptKey changes
  $effect(() => {
    if (apiKey) {
      const systemPrompt =
        prompts[selectedPromptKey as keyof typeof prompts].prompt;
      generator = new ImageGenerator(apiKey, systemPrompt);
    } else {
      generator = null;
    }
  });

  function saveAPIKey(e: SubmitEvent) {
    e.preventDefault();
    window.localStorage.setItem('apikey', keyInput);
    apiKey = keyInput;
  }

  function clearAPIKey() {
    window.localStorage.removeItem('apikey');
    apiKey = null;
    keyInput = '';
  }

  async function generateBatch(e: SubmitEvent) {
    e.preventDefault();
    if (!generator) return;

    const lines = promptsInput
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      error = 'Please enter at least one prompt.';
      return;
    }

    loading = true;
    error = '';
    generatedImages = [];

    try {
      // generator.batch returns string[] of base64 images
      const results = await generator.batch(lines);

      if (results.length > 0) {
        generatedImages = results;
      } else {
        error = 'No images generated.';
      }
    } catch (e: any) {
      console.error(e);
      error = e.message || 'An error occurred during batch generation.';
    } finally {
      loading = false;
    }
  }

  async function reset(e: Event) {
    e.preventDefault();
    promptsInput = '';
    selectedPromptKey = 'creature';
    generatedImages = [];
    error = '';

    await delMany([
      'batch-promptsInput',
      'batch-selectedPromptKey',
      'batch-generatedImages',
    ]);
  }

  async function downloadAll() {
    try {
      const dirHandle = await window.showDirectoryPicker();

      for (const [index, img] of generatedImages.entries()) {
        const uniqueId = crypto.randomUUID();
        const filename = `image-${index + 1}-${uniqueId}.png`;

        const fileHandle = await dirHandle.getFileHandle(filename, {
          create: true,
        });
        const writable = await fileHandle.createWritable();

        const blob = await stringToImage(img);
        await writable.write(blob);
        await writable.close();
      }

      alert('All images downloaded successfully!');
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error(e);
        error = 'Failed to save images. ' + e.message;
      }
    }
  }

  function openDialog(index: number) {
    dialogIndex = index;
    dialogOpen = true;
  }
</script>

<div class="container">
  <h1>Batch Image Generator</h1>

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

    <form class="generator-form" onsubmit={generateBatch}>
      <div class="group">
        <label for="prompt-select">System Prompt</label>
        <select id="prompt-select" bind:value={selectedPromptKey}>
          {#each Object.entries(prompts) as [key, { label }]}
            <option value={key}>{label}</option>
          {/each}
        </select>
      </div>

      <div class="group">
        <label for="prompts-input">Prompt Values (One per line)</label>
        <textarea
          id="prompts-input"
          bind:value={promptsInput}
          placeholder="Enter prompt values, one per line..."
          disabled={loading}
        ></textarea>
        <p class="hint">
          Each line will be concatenated with the system prompt.
        </p>
      </div>

      <div class="form-actions">
        <button class="secondary reset" onclick={reset}>Reset</button>
        <button
          type="submit"
          class="ai-generate-btn"
          disabled={loading || !promptsInput}
        >
          <Icon icon="sparkle" />
          Generate Batch
        </button>
      </div>
    </form>

    {#if loading}
      <div class="loader-container">
        <Loader />
        <p>Processing batch request... This may take a few minutes.</p>
      </div>
    {/if}

    {#if error}
      <div class="error">
        <p>Error: {error}</p>
      </div>
    {/if}

    {#if generatedImages.length > 0}
      <div class="result">
        <div class="result-header">
          <h2>Results ({generatedImages.length})</h2>
          <button class="primary" onclick={downloadAll}>
            <Icon icon="download" /> Download All
          </button>
        </div>

        <div class="image-grid">
          {#each generatedImages as img, index}
            <div class="image-wrapper">
              <button
                type="button"
                class="image-btn"
                onclick={() => openDialog(index)}
              >
                <img src={img} alt="Generated result {index + 1}" />
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
  images={generatedImages}
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
  select {
    width: 100%;
    height: 2rem;
    padding: 0.25rem;
  }

  textarea {
    resize: vertical;
    field-sizing: content;
    min-height: 10rem;
    width: 100%;
    padding: 0.5rem;
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

    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;

      h2 {
        margin-bottom: 0;
      }
    }
  }

  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
