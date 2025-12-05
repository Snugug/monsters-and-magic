<script lang="ts">
  interface Props {
    images: string[];
    open?: boolean;
    startIndex?: number;
    onClose?: () => void;
  }

  let {
    images,
    open = $bindable(false),
    startIndex = 0,
    onClose,
  }: Props = $props();

  let dialogElement: HTMLDialogElement;
  let currentIndex = $state(0);

  // Sync currentIndex with startIndex when dialog opens
  $effect(() => {
    if (open) {
      currentIndex = startIndex;
      dialogElement?.showModal();
    } else {
      dialogElement?.close();
    }
  });

  function closeDialog() {
    open = false;
    onClose?.();
  }

  function navigateDialog(direction: 'prev' | 'next') {
    if (direction === 'prev') {
      currentIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    } else {
      currentIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') {
      navigateDialog('prev');
    } else if (e.key === 'ArrowRight') {
      navigateDialog('next');
    } else if (e.key === 'Escape') {
      closeDialog();
    }
  }

  function handleClick(e: MouseEvent) {
    // Close when clicking on the backdrop (the dialog element itself)
    if (e.target === dialogElement) {
      closeDialog();
    }
  }

  function openImageInNewTab() {
    const imageUrl = images[currentIndex];
    if (imageUrl) {
      window.open(imageUrl, '_blank');
    }
  }
</script>

<dialog
  bind:this={dialogElement}
  class="image-dialog"
  onkeydown={handleKeydown}
  onclick={handleClick}
>
  {#if open && images.length > 0}
    <div class="dialog-content">
      <button
        type="button"
        class="dialog-image-btn"
        onclick={openImageInNewTab}
        aria-label="Open image in new tab"
      >
        <img src={images[currentIndex]} alt="Full size preview" />
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
        {currentIndex + 1} / {images.length}
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
</dialog>

<style lang="scss">
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
</style>
