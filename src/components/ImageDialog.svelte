<script lang="ts">
  import Icon from '$components/Icon.svelte';

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

  // function openImageInNewTab() {
  //   const imageUrl = images[currentIndex];
  //   if (imageUrl) {
  //     window.open(imageUrl, '_blank');
  //   }
  // }
</script>

<dialog
  bind:this={dialogElement}
  class="image-dialog"
  onkeydown={handleKeydown}
  onclick={handleClick}
>
  {#if open && images.length > 0}
    <div class="inner">
      <a class="dialog-image-btn" target="_blank" href={images[currentIndex]}>
        <img src={images[currentIndex]} alt="Full size preview" />
      </a>

      <button
        type="button"
        class="close-btn"
        onclick={closeDialog}
        aria-label="Close dialog"
      >
        <Icon icon="close" />
      </button>

      {#if images.length > 1}
        <button
          type="button"
          class="nav-btn prev"
          onclick={() => navigateDialog('prev')}
          aria-label="Previous image"
        >
          <Icon icon="forward" />
        </button>
        <button
          type="button"
          class="nav-btn next"
          onclick={() => navigateDialog('next')}
          aria-label="Next image"
        >
          <Icon icon="forward" />
        </button>
        <div class="dialog-counter">
          {currentIndex + 1} / {images.length}
        </div>
      {/if}
    </div>
  {/if}
</dialog>

<style lang="scss">
  .image-dialog {
    max-height: 80vh;
    max-width: 80vw;
    margin-inline: auto;
    margin-block: auto;
    position: fixed;
    border: none;
    background: transparent;
    padding: 1rem;
    overflow: visible;

    &::backdrop {
      background: rgba(0, 0, 0, 0.8);
    }
  }

  .inner {
    // background-color: white;
    padding: 1rem;

    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    max-width: 100%;
    max-height: 100%;
  }

  .dialog-image-btn {
    display: block;
    padding: 0;
    border: none;
    background: none;
    cursor: zoom-in;
    border: 1px solid black;
    box-shadow: 0px 0px 5px 2.5px rgba(0, 0, 0, 0.5);

    img {
      max-width: 100%;
      height: auto;
      max-height: calc(80vh - 4rem);
      object-fit: contain;
    }
  }

  .close-btn,
  .nav-btn {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    width: 1.5rem;
    height: 1.5rem;
    padding: 0.25rem;
    border-radius: 100%;
    background: var(--light-grey);
    border: 1px solid black;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;

    :global(.icon) {
      height: 1.5rem;
      width: 1.5rem;
      fill: currentColor;
    }
  }

  .nav-btn {
    top: 50%;
    height: 2rem;
    width: 2rem;

    &.prev {
      left: 0;
      left: -0.25rem;
      :global(.icon) {
        transform: rotate(180deg);
      }
    }

    &.next {
      right: -0.25rem;
    }
  }

  .dialog-counter {
    position: absolute;
    bottom: -0.25rem;
    left: 50%;
    transform: translateX(-50%);
    color: white;
    font-size: 0.75rem;
    background: rgba(0, 0, 0);
    padding: 0.5rem 0.75rem;
    border-radius: 0.75rem;
    font-variant: tabular-nums;
  }
</style>
