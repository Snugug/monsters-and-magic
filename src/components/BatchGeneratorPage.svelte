<script lang="ts">
  import {
    ImageGenerator,
    MODELS,
    getDefaultModelId,
  } from '$lib/image-generator';
  import { CREATURE_PROMPT } from '$lib/prompts';
  import { stringToImage } from '$js/images';
  import { slugify } from '$lib/helpers';
  import { untrack } from 'svelte';
  import { getMany, setMany, delMany } from 'idb-keyval';
  import { addToast } from '$lib/toast.svelte';
  import ImageDialog from '$components/ImageDialog.svelte';
  import Icon from '$components/Icon.svelte';
  import Loader from '$components/Loader.svelte';

  interface BatchJob {
    id: string; // The API resource name (jobs/...)
    apiName: string; // displayName sent to API (optional)
    userDisplayName: string; // Formatting name for UI
    status: string; // JOB_STATE_...
    resultFile?: string; // Resource name of output file
    images?: string[]; // Cached image data if downloaded
    itemCount?: number; // Number of prompts in the batch
    createdAt: number;
  }

  let apiKey = $state('') as string | null;
  let keyInput = $state('');
  let generator: ImageGenerator | null = $state(null);

  let selectedModel = $state(getDefaultModelId(true));
  let selectedPromptKey = $state('creature');
  let promptsInput = $state('');
  let batchNameInput = $state(''); // New batch name field

  // Persistent list of jobs
  let batchJobs = $state<BatchJob[]>([]);

  let error = $state('');

  // Track specific jobs that are performing actions (loading results/downloading)
  let loadingJobIds = $state(new Set<string>());

  // Dialog state
  let dialogOpen = $state(false);
  let dialogIndex = $state(0);
  let activeDialogImages = $state<string[]>([]);

  // Editing state
  let editingJobId = $state<string | null>(null);

  let loaded = $state(false);

  const prompts = {
    creature: { label: 'Creature', prompt: CREATURE_PROMPT },
    none: { label: 'None', prompt: '' },
  };

  const STATUS_ICONS: Record<string, string> = {
    JOB_STATE_SUCCEEDED: 'check',
    JOB_STATE_FAILED: 'close',
    JOB_STATE_CANCELLED: 'close',
    JOB_STATE_EXPIRED: 'close',
    JOB_STATE_PENDING: 'pending',
    JOB_STATE_QUEUING: 'refresh', // Tombstone state
  };

  const TERMINAL_STATES = new Set([
    'JOB_STATE_SUCCEEDED',
    'JOB_STATE_FAILED',
    'JOB_STATE_CANCELLED',
    'JOB_STATE_EXPIRED',
  ]);

  let hasPending = $derived(
    batchJobs.some((job) => !TERMINAL_STATES.has(job.status)),
  );

  // Filter models that support batch processing
  const batchModels = MODELS.filter((m) => m.supportsBatch);
  const showModelDropdown = batchModels.length > 1;

  // If only one model, set it as default
  $effect(() => {
    if (batchModels.length === 1 && selectedModel !== batchModels[0].id) {
      selectedModel = batchModels[0].id;
    }
  });

  // Load API Key from LocalStorage
  $effect(() => {
    apiKey = window.localStorage.getItem('apikey');
  });

  // Persistence and Initialization
  $effect(() => {
    (async () => {
      if (loaded === false) {
        const [p, k, jobs, bn, m] = await getMany([
          'batch-promptsInput',
          'batch-selectedPromptKey',
          'batch-jobs',
          'batch-batchNameInput',
          'batch-selectedModel',
        ]);

        if (p) promptsInput = p;
        if (k) selectedPromptKey = k;
        if (jobs) batchJobs = jobs;
        if (bn) batchNameInput = bn;
        if (m) selectedModel = m;

        loaded = true;

        // Check status of active jobs on load
        untrack(() => {
          if (generator && batchJobs.length > 0) {
            updateJobStatuses();
          }
        });
      } else {
        await setMany([
          ['batch-promptsInput', $state.snapshot(promptsInput)],
          ['batch-selectedPromptKey', $state.snapshot(selectedPromptKey)],
          ['batch-jobs', $state.snapshot(batchJobs)],
          ['batch-batchNameInput', $state.snapshot(batchNameInput)],
          ['batch-selectedModel', $state.snapshot(selectedModel)],
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
      // Trigger update if we just got the generator and have jobs
      untrack(() => {
        if (loaded && batchJobs.length > 0) {
          updateJobStatuses();
        }
      });
    } else {
      generator = null;
    }
  });

  function updateLoadingJob(id: string, active: boolean) {
    const next = new Set(loadingJobIds);
    if (active) next.add(id);
    else next.delete(id);
    loadingJobIds = next;
  }

  async function updateJobStatuses() {
    if (!generator) return;

    // Identify jobs to update
    const jobsToUpdate = batchJobs.filter(
      (job) =>
        !TERMINAL_STATES.has(job.status) && job.status !== 'JOB_STATE_QUEUING',
    );

    if (jobsToUpdate.length === 0) return;

    // Mark them as loading
    const nextLoading = new Set(loadingJobIds);
    for (const job of jobsToUpdate) {
      nextLoading.add(job.id);
    }
    loadingJobIds = nextLoading;

    for (const job of jobsToUpdate) {
      try {
        const updated = await generator.query(job.id);
        job.status = updated.state;
        if (updated.dest?.fileName) {
          job.resultFile = updated.dest.fileName;
        }
      } catch (e) {
        console.error(`Failed to update job ${job.id}`, e);
      } finally {
        // Clear loading for this job
        const current = new Set(loadingJobIds);
        current.delete(job.id);
        loadingJobIds = current;
      }
    }
    // Trigger persistence via reactivity
    batchJobs = [...batchJobs];
  }

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

  async function queueGeneration(e: SubmitEvent) {
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

    // Do NOT set global loading
    error = '';

    const simpleDate = new Date().toISOString().split('T')[0];
    const name =
      batchNameInput.trim() || `batch-${simpleDate}-${lines.length}-images`;
    // Create a temporary ID for the tombstone
    const tempId = `temp-${Date.now()}`;

    // Create Tombstone
    const tombstone: BatchJob = {
      id: tempId,
      apiName: name,
      userDisplayName: name,
      status: 'JOB_STATE_QUEUING',
      itemCount: lines.length,
      createdAt: Date.now(),
    };

    batchJobs = [tombstone, ...batchJobs];

    // Clear inputs immediately
    const previousPrompts = promptsInput;
    promptsInput = '';
    batchNameInput = '';

    try {
      // Enqueue
      const jobData = await generator.enqueue(lines, name);

      // Find and replace tombstone with real job
      const index = batchJobs.findIndex((j) => j.id === tempId);
      if (index !== -1) {
        const newJobs = [...batchJobs];
        newJobs[index] = {
          ...tombstone,
          id: jobData.name, // Real API resource name
          apiName: jobData.displayName || name,
          status: jobData.state,
        };
        batchJobs = newJobs;
      }
      addToast(`Batch "${name}" queued successfully`, 'success');
    } catch (e: any) {
      console.error(e);
      // Remove tombstone on failure
      batchJobs = batchJobs.filter((j) => j.id !== tempId);
      // Restore input? Maybe annoying if user cleared it.
      // User prompts were cleared. I should probably restore them if it fails so they don't lose data.
      promptsInput = previousPrompts;

      error = e.message || 'An error occurred during queuing.';
      addToast('Failed to queue batch', 'failure');
    }
  }

  async function reset(e: Event) {
    e.preventDefault();
    promptsInput = '';
    batchNameInput = '';
    selectedPromptKey = 'creature';
    selectedModel = getDefaultModelId(true);
    error = '';

    await delMany([
      'batch-promptsInput',
      'batch-selectedPromptKey',
      'batch-batchNameInput',
      'batch-selectedModel',
    ]);
  }

  function deleteJob(index: number) {
    const job = batchJobs[index];
    if (
      confirm(`Are you sure you want to delete batch "${job.userDisplayName}"?`)
    ) {
      batchJobs = batchJobs.filter((_, i) => i !== index);
      if (editingJobId === job.id) editingJobId = null; // Clear editing state if deleted job was being edited
    }
  }

  function getIsEditing(jobId: string) {
    return editingJobId === jobId;
  }

  function toggleEdit(index: number) {
    const job = batchJobs[index];
    if (getIsEditing(job.id)) {
      // If currently editing, save
      saveRename(index);
    } else {
      // Start editing
      editingJobId = job.id;
    }
  }

  function saveRename(index: number) {
    // The value is already bound to job.userDisplayName, so just clear editing state
    if (editingJobId === batchJobs[index].id) {
      editingJobId = null;
      batchJobs = [...batchJobs]; // Trigger persistence via reactivity
    }
  }

  function handleNameKeydown(e: KeyboardEvent, index: number) {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveRename(index);
    }
  }

  async function openBatchResults(job: BatchJob) {
    if (editingJobId === job.id) return; // Don't open if editing title
    if (job.status !== 'JOB_STATE_SUCCEEDED') return;
    if (loadingJobIds.has(job.id)) return; // Already loading

    // If we don't have images loaded yet, fetch them
    if (!job.images || job.images.length === 0) {
      if (!job.resultFile) {
        error = 'Job succeeded but no result file found.';
        return;
      }

      updateLoadingJob(job.id, true);

      try {
        const images = await generator!.get(job.resultFile);
        job.images = images;
        batchJobs = [...batchJobs]; // Persist the cached images
      } catch (e: any) {
        console.error(e);
        error = 'Failed to retrieve results: ' + e.message;
        addToast('Failed to retrieve results', 'failure');
        updateLoadingJob(job.id, false);
        return;
      } finally {
        updateLoadingJob(job.id, false);
      }
    }

    activeDialogImages = job.images || [];
    dialogIndex = 0;
    dialogOpen = true;
  }

  async function downloadAll(job: BatchJob) {
    if (loadingJobIds.has(job.id)) return;

    updateLoadingJob(job.id, true);

    if (!job.images || job.images.length === 0) {
      if (job.status === 'JOB_STATE_SUCCEEDED' && job.resultFile) {
        try {
          const images = await generator!.get(job.resultFile);
          job.images = images;
          batchJobs = [...batchJobs];
        } catch (e) {
          addToast('Failed to load images for download', 'failure');
          updateLoadingJob(job.id, false);
          return;
        }
      } else {
        updateLoadingJob(job.id, false);
        return;
      }
    }

    try {
      const dirHandle = await window.showDirectoryPicker();
      const baseName = slugify(job.userDisplayName);

      for (const [index, img] of job.images!.entries()) {
        const uniqueId = crypto.randomUUID().split('-')[0];
        const filename = `${baseName}-${uniqueId}-${index + 1}.png`;

        const fileHandle = await dirHandle.getFileHandle(filename, {
          create: true,
        });
        const writable = await fileHandle.createWritable();

        const blob = await stringToImage(img);
        await writable.write(blob);
        await writable.close();
      }

      addToast('All images downloaded successfully!', 'success');
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error(e);
        error = 'Failed to save images. ' + e.message;
        addToast('Failed to save images', 'failure');
      }
    } finally {
      updateLoadingJob(job.id, false);
    }
  }

  function getStatusIcon(job: BatchJob) {
    if (loadingJobIds.has(job.id) || job.status === 'JOB_STATE_QUEUING')
      return 'progress'; // Spinner icon
    if (job.status in STATUS_ICONS) return STATUS_ICONS[job.status];
    return 'pending'; // Fallback
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

    <!-- Generation Form -->
    <form
      class="generator-form"
      class:three-cols={showModelDropdown}
      onsubmit={queueGeneration}
    >
      <div class="group">
        <label for="batch-name">Batch Name (Optional)</label>
        <input
          type="text"
          id="batch-name"
          bind:value={batchNameInput}
          placeholder="e.g. Forest Creatures"
        />
      </div>

      <div class="group">
        <label for="prompt-select">System Prompt</label>
        <select id="prompt-select" bind:value={selectedPromptKey}>
          {#each Object.entries(prompts) as [key, { label }]}
            <option value={key}>{label}</option>
          {/each}
        </select>
      </div>

      {#if showModelDropdown}
        <div class="group">
          <label for="model-select">Model</label>
          <select id="model-select" bind:value={selectedModel}>
            {#each batchModels as model}
              <option value={model.id}>
                {model.label}
              </option>
            {/each}
          </select>
        </div>
      {/if}

      <div class="group prompts">
        <label for="prompts-input">Prompt Values (One per line)</label>
        <textarea
          id="prompts-input"
          bind:value={promptsInput}
          placeholder="Enter prompt values, one per line..."
          disabled={false}
        ></textarea>
        <p class="hint">
          Each line will be concatenated with the system prompt.
        </p>
      </div>

      <div class="form-actions">
        <button class="secondary reset" onclick={reset}>Reset</button>
        <button type="submit" class="ai-generate-btn" disabled={!promptsInput}>
          <Icon icon="sparkle" />
          Queue Generation
        </button>
      </div>
    </form>

    {#if error}
      <div class="error">
        <p>Error: {error}</p>
      </div>
    {/if}

    <!-- Batch History List -->
    <div class="batch-history">
      <div class="force-row">
        <h2>Batch History</h2>
        <button
          class="secondary small"
          onclick={updateJobStatuses}
          disabled={!hasPending}
          title="Refresh Status"
        >
          <Icon icon="refresh" /> Refresh
        </button>
      </div>

      {#if batchJobs.length === 0}
        <p class="empty-list">No batch jobs yet.</p>
      {:else}
        <div class="job-list">
          {#each batchJobs as job, index}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
              class="job-item"
              class:success={job.status === 'JOB_STATE_SUCCEEDED'}
              class:failed={job.status === 'JOB_STATE_FAILED'}
              role="button"
              tabindex="0"
              onclick={() => openBatchResults(job)}
            >
              <div
                class="job-icon"
                class:spinning={loadingJobIds.has(job.id) ||
                  job.status === 'JOB_STATE_QUEUING'}
              >
                <Icon icon={getStatusIcon(job)} />
              </div>
              <div class="job-info">
                <div class="job-name">
                  {#if getIsEditing(job.id)}
                    <input
                      type="text"
                      bind:value={job.userDisplayName}
                      onclick={(e) => e.stopPropagation()}
                      onblur={() => saveRename(index)}
                      onkeydown={(e) => handleNameKeydown(e, index)}
                      class="rename-input"
                      autofocus
                    />
                  {:else}
                    {job.userDisplayName}
                  {/if}
                </div>
                <div class="job-meta">
                  <span class="status"
                    >{job.status.replace('JOB_STATE_', '')}</span
                  >
                  {#if job.itemCount}
                    <span class="count">{job.itemCount} items</span>
                  {/if}
                  <span class="date"
                    >{new Date(job.createdAt).toLocaleString()}</span
                  >
                </div>
              </div>
              <div class="job-actions">
                {#if loadingJobIds.has(job.id)}
                  <span class="loading-label">Loading...</span>
                {/if}
                <button
                  type="button"
                  class="action-btn"
                  onclick={(e) => {
                    e.stopPropagation();
                    toggleEdit(index);
                  }}
                  title={getIsEditing(job.id) ? 'Save' : 'Rename'}
                >
                  <Icon icon={getIsEditing(job.id) ? 'check' : 'edit'} />
                </button>
                {#if job.status === 'JOB_STATE_SUCCEEDED'}
                  <button
                    type="button"
                    class="action-btn"
                    onclick={(e) => {
                      e.stopPropagation();
                      downloadAll(job);
                    }}
                    title="Download All"
                  >
                    <Icon icon="download" />
                  </button>
                {/if}
                <button
                  type="button"
                  class="action-btn delete"
                  onclick={(e) => {
                    e.stopPropagation();
                    deleteJob(index);
                  }}
                  title="Delete"
                >
                  <Icon icon="close" />
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Image Preview Dialog -->
<ImageDialog
  images={activeDialogImages}
  bind:open={dialogOpen}
  startIndex={dialogIndex}
/>

<style lang="scss">
  .generator-form {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;

    &.three-cols {
      grid-template-columns: 1fr 1fr 1fr;
    }
  }

  .prompts,
  .form-actions {
    grid-column: 1 / -1;
  }

  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  h1,
  h2 {
    margin-bottom: 1rem;
    font-weight: bold;
  }

  h1 {
    font-size: 2rem;
    margin-bottom: 2rem;
  }
  h2 {
    font-size: 1.5rem;
    margin-top: 2rem;
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    // margin-bottom: 1rem;

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
    min-height: 8rem;
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

  /* Batch History Styles */
  .batch-history {
    margin-top: 2rem;
    border-top: 1px solid var(--light-grey, #ccc);
  }

  .force-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .job-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .job-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid var(--light-grey, #ccc);
    border-radius: 0.5rem;
    background: white;
    cursor: pointer;
    transition: background-color 0.2s;
    border-left: 5px solid var(--light-grey);

    &:hover {
      background: #f9f9f9;
    }

    &.success {
      border-left-color: var(--dark-green, #28a745);
    }
    &.failed {
      border-left-color: var(--dark-red, #c00);
    }
  }

  .job-icon {
    color: var(--dark-grey, #666);
    display: flex; /* Ensure centering for rotation */
    :global(.icon) {
      width: 1.5rem;
      height: 1.5rem;
    }

    &.spinning {
      animation: spin 1s linear infinite;
      color: var(--blue, #007bff);
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .loading-label {
    font-size: 0.75rem;
    color: var(--dark-grey);
    align-self: center;
    margin-right: 0.5rem;
  }

  .job-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .job-name {
    font-weight: bold;
    min-height: 1.5rem; /* ensure height when empty or input */
  }

  .job-meta {
    font-size: 0.75rem;
    color: var(--dark-grey, #666);
    display: flex;
    gap: 1rem;

    .status {
      text-transform: capitalize;
    }
  }

  .job-actions {
    display: flex;
    gap: 0.5rem;
  }

  .action-btn {
    padding: 0.25rem;
    background: none;
    border: none;
    color: var(--dark-grey, #666);

    &:hover {
      color: black;
    }

    &.delete:hover {
      color: var(--dark-red, #c00);
    }
  }

  .empty-list {
    color: var(--dark-grey, #666);
    font-style: italic;
    text-align: center;
    padding: 2rem;
  }

  .rename-input {
    width: 100%;
    height: 1.5rem;
    padding: 0 0.25rem;
    font-size: 1rem;
    font-weight: bold;
    border: 1px solid var(--light-grey, #ccc);
    border-radius: 0.25rem;
    font-family: inherit;
  }

  .job-name {
    border: 1px solid transparent;
    border-radius: 0.25rem;
    padding: 0.25rem 0.5rem;
    margin-inline: -0.5rem;
    display: flex;

    &:has(input) {
      border-color: var(--light-grey, #ccc);
      background: white;
      padding: 0;
    }

    input {
      padding: 0.25rem 0.5rem;
      border: 0;
      background: none;
      height: auto;
      // height: 100%;
    }
  }
</style>
