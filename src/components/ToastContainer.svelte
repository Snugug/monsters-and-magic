<script lang="ts">
  import { getToasts, removeToast } from '$lib/toast.svelte';
  import Icon from '$components/Icon.svelte';
  import { flip } from 'svelte/animate';
  import { fade, fly } from 'svelte/transition';

  const toasts = $derived(getToasts());
</script>

<div class="toast-container">
  {#each toasts as toast (toast.id)}
    <div
      class="toast {toast.type}"
      animate:flip={{ duration: 300 }}
      in:fly={{ y: 20, duration: 300 }}
      out:fade={{ duration: 200 }}
    >
      <div class="toast-message">{toast.message}</div>
      <button
        class="close-btn"
        onclick={() => removeToast(toast.id)}
        title="Dismiss"
      >
        <Icon icon="close" />
      </button>
    </div>
  {/each}
</div>

<style lang="scss">
  .toast-container {
    position: fixed;
    bottom: 2rem;
    left: 2rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    z-index: 10000;
    pointer-events: none; /* Allow clicking through container */
  }

  .toast {
    pointer-events: auto;
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    min-width: 300px;
    max-width: 400px;
    padding: 1rem;
    border-radius: 0.5rem;
    background: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(0, 0, 0, 0.1);
    color: var(--black, #222);

    /* Type-specific styling */
    &.info {
      border-left: 4px solid var(--dark-blue, #007bff);
    }

    &.success {
      border-left: 4px solid var(--dark-green, #28a745);
    }

    &.failure {
      border-left: 4px solid var(--dark-red, #dc3545);
    }
  }

  .toast-message {
    flex: 1;
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .close-btn {
    background: none;
    border: none;
    padding: 0;
    margin: -0.25rem -0.25rem 0 0;
    color: var(--grey, #666);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    :global(.icon) {
      width: 1rem;
      height: 1rem;
    }

    &:hover {
      color: var(--black, #000);
    }
  }
</style>
