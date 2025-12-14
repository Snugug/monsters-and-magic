<script lang="ts">
  import { ImageGenerator } from '$lib/image-generator';
  import { CREATURE_PROMPT } from '$lib/prompts';
  import { stringToImage } from '$js/images';
  import { slugify } from '$lib/helpers';
  import { untrack } from 'svelte';
  import { getMany, setMany, delMany } from 'idb-keyval';
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
    createdAt: number;
  }

  let apiKey = $state('') as string | null;
  let keyInput = $state('');
  let generator: ImageGenerator | null = $state(null);

  let selectedPromptKey = $state('creature');
  let promptsInput = $state('');

  // Persistent list of jobs
  let batchJobs = $state<BatchJob[]>([]);

  let loading = $state(false); // Global loading for actions (enqueue, delete, etc)
  let error = $state('');

  // Dialog state
  let dialogOpen = $state(false);
  let dialogIndex = $state(0);
  let activeDialogImages = $state<string[]>([]);

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
    JOB_STATE_PENDING: 'time', // Assuming 'time' or 'clock' icon exists? using 'sparkle' or 'refresh' if not. Assuming 'time' doesn't exist based on Icon.svelte usually having minimal set. I'll check Icon.svelte later or stick to generic. I'll use 'sparkle' for active for now or just text.
    // If status is unknown/active, show loader or generic.
  };

  // Load API Key from LocalStorage
  $effect(() => {
    apiKey = window.localStorage.getItem('apikey');
  });

  // Persistence and Initialization
  $effect(() => {
    (async () => {
      if (loaded === false) {
        const [p, k, jobs] = await getMany([
          'batch-promptsInput',
          'batch-selectedPromptKey',
          'batch-jobs',
        ]);

        if (p) promptsInput = p;
        if (k) selectedPromptKey = k;
        if (jobs) batchJobs = jobs;

        loaded = true;

        // Check status of active jobs on load
        if (generator && batchJobs.length > 0) {
          updateJobStatuses();
        }
      } else {
        await setMany([
          ['batch-promptsInput', $state.snapshot(promptsInput)],
          ['batch-selectedPromptKey', $state.snapshot(selectedPromptKey)],
          ['batch-jobs', $state.snapshot(batchJobs)],
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

  async function updateJobStatuses() {
    if (!generator) return;

    // Only query jobs that are not in a terminal state
    const terminalStates = new Set([
      'JOB_STATE_SUCCEEDED',
      'JOB_STATE_FAILED',
      'JOB_STATE_CANCELLED',
      'JOB_STATE_EXPIRED',
    ]);

    for (const job of batchJobs) {
      if (!terminalStates.has(job.status)) {
        try {
          const updated = await generator.query(job.id);
          job.status = updated.state;
          if (updated.dest?.fileName) {
            job.resultFile = updated.dest.fileName;
          }
        } catch (e) {
          console.error(`Failed to update job ${job.id}`, e);
        }
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

    loading = true;
    error = '';

    try {
      const simpleDate = new Date().toISOString().split('T')[0];
      const name = `batch-${simpleDate}-${lines.length}-images`;

      // Enqueue
      const jobData = await generator.enqueue(lines, name);

      const newJob: BatchJob = {
        id: jobData.name, // resource name
        apiName: jobData.displayName || name,
        userDisplayName: name,
        status: jobData.state,
        createdAt: Date.now(),
      };

      batchJobs = [newJob, ...batchJobs];
      promptsInput = ''; // Clear input on success
    } catch (e: any) {
      console.error(e);
      error = e.message || 'An error occurred during queuing.';
    } finally {
      loading = false;
    }
  }

  async function reset(e: Event) {
    e.preventDefault();
    promptsInput = '';
    selectedPromptKey = 'creature';
    error = '';

    await delMany(['batch-promptsInput', 'batch-selectedPromptKey']);
  }

  function deleteJob(index: number) {
    const job = batchJobs[index];
    if (
      confirm(`Are you sure you want to delete batch "${job.userDisplayName}"?`)
    ) {
      batchJobs = batchJobs.filter((_, i) => i !== index);
    }
  }

  function renameJob(index: number) {
    const job = batchJobs[index];
    const newName = prompt('Enter new name for batch:', job.userDisplayName);
    if (newName) {
      job.userDisplayName = newName;
      batchJobs = [...batchJobs];
    }
  }

  async function openBatchResults(job: BatchJob) {
    if (job.status !== 'JOB_STATE_SUCCEEDED') return;

    // If we don't have images loaded yet, fetch them
    if (!job.images || job.images.length === 0) {
      if (!job.resultFile) {
        error = 'Job succeeded but no result file found.';
        return;
      }
      loading = true;
      try {
        const images = await generator!.get(job.resultFile);
        job.images = images;
        batchJobs = [...batchJobs]; // Persist the cached images
      } catch (e: any) {
        console.error(e);
        error = 'Failed to retrieve results: ' + e.message;
        loading = false;
        return;
      } finally {
        loading = false;
      }
    }

    activeDialogImages = job.images || [];
    dialogIndex = 0;
    dialogOpen = true;
  }

  async function downloadAll(job: BatchJob) {
    if (!job.images || job.images.length === 0) {
      // Should generally open results first or ensure loaded, assuming button inside details view or valid state
      // If called directly from list (if implemented), check loaded.
      // For now, only assume images are loaded if this is called.
      // If not, try load.
      if (job.status === 'JOB_STATE_SUCCEEDED' && job.resultFile) {
        try {
          loading = true;
          const images = await generator!.get(job.resultFile);
          job.images = images;
          batchJobs = [...batchJobs];
        } catch (e) {
          alert('Failed to load images for download');
          loading = false;
          return;
        } finally {
          loading = false;
        }
      } else {
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

      alert('All images downloaded successfully!');
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error(e);
        error = 'Failed to save images. ' + e.message;
      }
    }
  }

  function getStatusIcon(status: string) {
    if (status === 'JOB_STATE_SUCCEEDED') return 'check';
    if (status === 'JOB_STATE_FAILED') return 'close';
    return 'sparkle'; // Active/Pending
  }
</script>

```
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
    <form class="generator-form" onsubmit={queueGeneration}>
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
          Queue Generation
        </button>
      </div>
    </form>

    {#if loading}
      <div class="loader-container">
        <Loader />
        <p>Processing...</p>
      </div>
    {/if}

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
          disabled={loading}
          title="Refresh Status"
        >
          <Icon icon="sparkle" /> Refresh
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
              <div class="job-icon">
                <Icon icon={getStatusIcon(job.status)} />
              </div>
              <div class="job-info">
                <div class="job-name">
                  {job.userDisplayName}
                </div>
                <div class="job-meta">
                  <span class="status"
                    >{job.status.replace('JOB_STATE_', '')}</span
                  >
                  <span class="date"
                    >{new Date(job.createdAt).toLocaleString()}</span
                  >
                </div>
              </div>
              <div class="job-actions">
                <button
                  type="button"
                  class="action-btn"
                  onclick={(e) => {
                    e.stopPropagation();
                    renameJob(index);
                  }}
                  title="Rename"
                >
                  <Icon icon="sparkle" />
                  <!-- Use edit icon if available, otherwise generic -->
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

    &:hover {
      background: #f9f9f9;
    }

    &.success {
      border-left: 5px solid var(--green, #28a745);
    }
    &.failed {
      border-left: 5px solid var(--dark-red, #c00);
    }
  }

  .job-icon {
    color: var(--dark-grey, #666);
    :global(.icon) {
      width: 1.5rem;
      height: 1.5rem;
    }
  }

  .job-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .job-name {
    font-weight: bold;
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
</style>
