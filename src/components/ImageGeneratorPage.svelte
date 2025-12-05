<script lang="ts">
  import { ImageGenerator, type InputImage } from '$lib/image-generator';
  import { CREATURE_PROMPT } from '$lib/prompts';
  import { stringToImage } from '$js/images';

  interface UploadedImage {
    input: InputImage;
    preview: string;
  }

  let apiKey = $state('') as string | null;
  let keyInput = $state('');
  let generator: ImageGenerator | null = $state(null);

  let selectedPromptKey = $state('creature');
  let userPrompt = $state('');
  let generatedImages = $state<string[]>([]);
  let imageCount = $state(1);
  let loading = $state(false);
  let error = $state('');

  // Multi-image state
  let uploadedImages = $state<UploadedImage[]>([]);
  let draggedIndex = $state<number | null>(null);

  // Dialog state
  let dialogOpen = $state(false);
  let dialogIndex = $state(0);
  let dialogMode = $state<'uploaded' | 'generated'>('uploaded');
  let dialogElement: HTMLDialogElement;

  const MAX_IMAGES = 4;

  const prompts = {
    creature: { label: 'Creature', prompt: CREATURE_PROMPT },
    none: { label: 'None', prompt: '' },
  };

  // Load API Key from LocalStorage
  $effect(() => {
    apiKey = window.localStorage.getItem('apikey');
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
        // Convert base64 strings to Object URLs
        const urlPromises = validResults.map(async (base64) => {
          const blob = await stringToImage(base64);
          return URL.createObjectURL(blob);
        });
        generatedImages = await Promise.all(urlPromises);
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
    dialogElement?.showModal();
  }

  function closeDialog() {
    dialogOpen = false;
    dialogElement?.close();
  }

  function getDialogImages(): string[] {
    if (dialogMode === 'uploaded') {
      return uploadedImages.map((img) => img.preview);
    }
    return generatedImages;
  }

  function navigateDialog(direction: 'prev' | 'next') {
    const images = getDialogImages();
    if (direction === 'prev') {
      dialogIndex = dialogIndex > 0 ? dialogIndex - 1 : images.length - 1;
    } else {
      dialogIndex = dialogIndex < images.length - 1 ? dialogIndex + 1 : 0;
    }
  }

  function handleDialogKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') {
      navigateDialog('prev');
    } else if (e.key === 'ArrowRight') {
      navigateDialog('next');
    } else if (e.key === 'Escape') {
      closeDialog();
    }
  }

  function handleDialogClick(e: MouseEvent) {
    // Close when clicking on the backdrop (the dialog element itself)
    if (e.target === dialogElement) {
      closeDialog();
    }
  }

  function openImageInNewTab() {
    const images = getDialogImages();
    const imageUrl = images[dialogIndex];
    if (imageUrl) {
      window.open(imageUrl, '_blank');
    }
  }
</script>

<div class="container">
  <h1>AI Image Generator</h1>

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
                    ×
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

      <button type="submit" disabled={loading || !userPrompt}>
        {#if loading}
          Generating...
        {:else}
          Generate
        {/if}
      </button>
    </form>

    {#if loading}
      <div class="loader-container">
        <div class="loader"></div>
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
<dialog
  bind:this={dialogElement}
  class="image-dialog"
  onkeydown={handleDialogKeydown}
  onclick={handleDialogClick}
>
  {#if dialogOpen}
    {@const images = getDialogImages()}
    {#if images.length > 0}
      <div class="dialog-content">
        <button
          type="button"
          class="dialog-image-btn"
          onclick={openImageInNewTab}
          aria-label="Open image in new tab"
        >
          <img src={images[dialogIndex]} alt="Full size preview" />
        </button>
      </div>

      {#if images.length > 1}
        <button
          type="button"
          class="nav-btn prev"
          onclick={() => navigateDialog('prev')}
          aria-label="Previous image"
        >
          ‹
        </button>
        <button
          type="button"
          class="nav-btn next"
          onclick={() => navigateDialog('next')}
          aria-label="Next image"
        >
          ›
        </button>
        <div class="dialog-counter">
          {dialogIndex + 1} / {images.length}
        </div>
      {/if}

      <button
        type="button"
        class="close-btn"
        onclick={closeDialog}
        aria-label="Close dialog"
      >
        ×
      </button>
    {/if}
  {/if}
</dialog>

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
    grid-template-columns: 1fr 1fr;
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
    background: var(--light-purple, #6a0dad);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: bold;
    transition: opacity 0.2s;

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    &.secondary {
      background: var(--light-grey, #ccc);
      color: black;
    }

    &.small {
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
    }
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
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        display: block;
        transition: transform 0.2s;
      }

      &:hover img {
        transform: scale(1.02);
      }
    }
  }

  .dialog-image-btn {
    display: block;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;

    &:hover {
      cursor: zoom-in;
    }

    img {
      max-width: 100%;
      max-height: calc(80vh - 2rem);
      object-fit: contain;
      border-radius: 8px;
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
    border-radius: 8px;
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
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    background: none;

    &:hover {
      border-color: var(--light-purple, #6a0dad);
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .remove-btn {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 24px;
    height: 24px;
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
    transition: opacity 0.2s;
    z-index: 1;

    &:hover {
      background: #a00;
    }
  }

  .order-badge {
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--black, #000);
    color: var(--white, #fff);
    font-size: 0.75rem;
    font-weight: bold;
    padding: 2px 8px;
    border-radius: 10px;
  }

  .add-images-btn {
    align-self: flex-start;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  // Dialog styles
  .image-dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 0;
    border: none;
    border-radius: 0;
    background: transparent;
    width: 80vw;
    height: 80vh;
    max-width: none;
    max-height: none;
    overflow: hidden;

    &::backdrop {
      background: rgba(0, 0, 0, 0.8);
    }

    &[open] {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .dialog-content {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    border-radius: 8px;
    padding: 1rem;
    max-width: calc(80vw - 120px);
    max-height: 80vh;
    overflow: hidden;
  }

  .nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 48px;
    height: 48px;
    padding: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    font-size: 2rem;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    &.prev {
      left: 10px;
    }

    &.next {
      right: 10px;
    }
  }

  .close-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 32px;
    height: 32px;
    padding: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    font-size: 1.5rem;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }

  .dialog-counter {
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    color: white;
    font-size: 0.875rem;
    background: rgba(0, 0, 0, 0.6);
    padding: 4px 12px;
    border-radius: 12px;
  }

  .error {
    margin-top: 1rem;
    padding: 1rem;
    background: #fee;
    color: #c00;
    border-radius: 4px;
  }

  .loader-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 2rem 0;
    gap: 1rem;
  }

  /* HTML: <div class="loader"></div> */
  .loader {
    width: 60px;
    height: 60px;
    aspect-ratio: 1 / 1;
    display: grid;
    color: transparent;
    font-size: 1px;
    overflow: hidden;
  }
  .loader::before,
  .loader::after {
    content: '';
    grid-area: 1/1;
    --c: no-repeat linear-gradient(var(--dark-yellow, #ffd700) 0 0);
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
