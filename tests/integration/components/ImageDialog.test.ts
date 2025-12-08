import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import ImageDialog from '$components/ImageDialog.svelte';
import * as imagesModule from '$js/images';

// Mock the window.open function
vi.stubGlobal('open', vi.fn());

// Mock URL methods
const createObjectURL = vi.fn(() => 'blob:test');
const revokeObjectURL = vi.fn();
vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });

// Mock stringToImage
vi.mock('$js/images', () => ({
  stringToImage: vi
    .fn()
    .mockResolvedValue(new Blob(['test'], { type: 'image/png' })),
}));

// Mock dialog methods that may not be fully supported
beforeEach(() => {
  // Polyfill dialog methods for happy-dom
  HTMLDialogElement.prototype.showModal =
    HTMLDialogElement.prototype.showModal ||
    function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
  HTMLDialogElement.prototype.close =
    HTMLDialogElement.prototype.close ||
    function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    };
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('ImageDialog', () => {
  const testImages = [
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAAASUVORK5CYII=',
    'https://example.com/image.png',
  ];

  it('should render a dialog element', () => {
    const { container } = render(ImageDialog, {
      props: {
        images: testImages,
        open: false,
      },
    });

    const dialog = container.querySelector('dialog');
    expect(dialog).toBeTruthy();
    expect(dialog?.classList.contains('image-dialog')).toBe(true);
  });

  it('should show content when open is true and images are provided', async () => {
    const { container } = render(ImageDialog, {
      props: {
        images: testImages,
        open: true,
        startIndex: 0,
      },
    });

    // Wait for Svelte effects to run
    await vi.waitFor(() => {
      const img = container.querySelector('img');
      expect(img).toBeTruthy();
    });
  });

  it('should show navigation buttons when multiple images are provided', async () => {
    const { container } = render(ImageDialog, {
      props: {
        images: testImages,
        open: true,
        startIndex: 0,
      },
    });

    await vi.waitFor(() => {
      const prevBtn = container.querySelector('.nav-btn.prev');
      const nextBtn = container.querySelector('.nav-btn.next');
      expect(prevBtn).toBeTruthy();
      expect(nextBtn).toBeTruthy();
    });
  });

  it('should not show navigation buttons with single image', async () => {
    const { container } = render(ImageDialog, {
      props: {
        images: [testImages[0]],
        open: true,
        startIndex: 0,
      },
    });

    await vi.waitFor(() => {
      const img = container.querySelector('img');
      expect(img).toBeTruthy();
    });

    const prevBtn = container.querySelector('.nav-btn.prev');
    const nextBtn = container.querySelector('.nav-btn.next');
    expect(prevBtn).toBeFalsy();
    expect(nextBtn).toBeFalsy();
  });

  it('should have a close button when dialog is open', async () => {
    const onClose = vi.fn();
    const { container, component } = render(ImageDialog, {
      props: {
        images: testImages,
        open: true,
        startIndex: 0,
        onClose,
      },
    });

    await vi.waitFor(() => {
      const closeBtn = container.querySelector('.close-btn');
      expect(closeBtn).toBeTruthy();
    });

    const closeBtn = container.querySelector('.close-btn') as HTMLButtonElement;
    await fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
    // Since 'open' is bindable, we check component prop update if possible,
    // or just rely on onClose being called.
  });

  it('should display image counter when multiple images', async () => {
    const { container } = render(ImageDialog, {
      props: {
        images: testImages,
        open: true,
        startIndex: 0,
      },
    });

    await vi.waitFor(() => {
      const counter = container.querySelector('.dialog-counter');
      expect(counter).toBeTruthy();
      expect(counter?.textContent).toContain('1 / 3');
    });
  });

  it('should navigate to next image on next button click', async () => {
    const { container } = render(ImageDialog, {
      props: {
        images: testImages,
        open: true,
        startIndex: 0,
      },
    });

    await vi.waitFor(() => {
      const nextBtn = container.querySelector(
        '.nav-btn.next',
      ) as HTMLButtonElement;
      expect(nextBtn).toBeTruthy();
    });

    const nextBtn = container.querySelector(
      '.nav-btn.next',
    ) as HTMLButtonElement;
    await fireEvent.click(nextBtn);

    await vi.waitFor(() => {
      const counter = container.querySelector('.dialog-counter');
      expect(counter?.textContent).toContain('2 / 3');
    });
  });

  it('should navigate to previous image on prev button click', async () => {
    const { container } = render(ImageDialog, {
      props: {
        images: testImages,
        open: true,
        startIndex: 1, // Start at 2nd image
      },
    });

    await vi.waitFor(() => {
      const prevBtn = container.querySelector(
        '.nav-btn.prev',
      ) as HTMLButtonElement;
      expect(prevBtn).toBeTruthy();
    });

    const prevBtn = container.querySelector(
      '.nav-btn.prev',
    ) as HTMLButtonElement;
    await fireEvent.click(prevBtn);

    await vi.waitFor(() => {
      const counter = container.querySelector('.dialog-counter');
      expect(counter?.textContent).toContain('1 / 3');
    });
  });

  it('should loop navigation (next on last goes to first)', async () => {
    const { container } = render(ImageDialog, {
      props: {
        images: testImages,
        open: true,
        startIndex: 2, // Last image
      },
    });

    await vi.waitFor(() => {
      const counter = container.querySelector('.dialog-counter');
      expect(counter?.textContent).toContain('3 / 3');
    });

    const nextBtn = container.querySelector(
      '.nav-btn.next',
    ) as HTMLButtonElement;
    await fireEvent.click(nextBtn);

    await vi.waitFor(() => {
      const counter = container.querySelector('.dialog-counter');
      expect(counter?.textContent).toContain('1 / 3');
    });
  });

  it('should loop navigation (prev on first goes to last)', async () => {
    const { container } = render(ImageDialog, {
      props: {
        images: testImages,
        open: true,
        startIndex: 0, // First image
      },
    });

    await vi.waitFor(() => {
      const counter = container.querySelector('.dialog-counter');
      expect(counter?.textContent).toContain('1 / 3');
    });

    const prevBtn = container.querySelector(
      '.nav-btn.prev',
    ) as HTMLButtonElement;
    await fireEvent.click(prevBtn);

    await vi.waitFor(() => {
      const counter = container.querySelector('.dialog-counter');
      expect(counter?.textContent).toContain('3 / 3');
    });
  });

  it('should navigate with arrow keys', async () => {
    const { container } = render(ImageDialog, {
      props: {
        images: testImages,
        open: true,
        startIndex: 1,
      },
    });

    const dialog = container.querySelector('dialog') as HTMLDialogElement;

    // Right Arrow -> Next
    await fireEvent.keyDown(dialog, { key: 'ArrowRight' });
    await vi.waitFor(() => {
      const counter = container.querySelector('.dialog-counter');
      expect(counter?.textContent).toContain('3 / 3');
    });

    // Left Arrow -> Prev
    await fireEvent.keyDown(dialog, { key: 'ArrowLeft' });
    await vi.waitFor(() => {
      const counter = container.querySelector('.dialog-counter');
      expect(counter?.textContent).toContain('2 / 3');
    });
  });

  it('should close on Escape key', async () => {
    const onClose = vi.fn();
    const { container } = render(ImageDialog, {
      props: {
        images: testImages,
        open: true,
        startIndex: 0,
        onClose,
      },
    });

    const dialog = container.querySelector('dialog') as HTMLDialogElement;
    await fireEvent.keyDown(dialog, { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });

  it('should close on backdrop click', async () => {
    const onClose = vi.fn();
    const { container } = render(ImageDialog, {
      props: {
        images: testImages,
        open: true,
        startIndex: 0,
        onClose,
      },
    });

    const dialog = container.querySelector('dialog') as HTMLDialogElement;
    // Click directly on dialog (backdrop in CSS acts as part of dialog element for click events usually if targeted correctly or emulated)
    // The implementation checks if e.target === dialogElement
    await fireEvent.click(dialog);

    expect(onClose).toHaveBeenCalled();
  });

  it('should NOT close on click inside content', async () => {
    const onClose = vi.fn();
    const { container } = render(ImageDialog, {
      props: {
        images: testImages,
        open: true,
        startIndex: 0,
        onClose,
      },
    });

    await vi.waitFor(() => {
      const inner = container.querySelector('.inner');
      expect(inner).toBeTruthy();
    });

    const inner = container.querySelector('.inner') as HTMLElement;
    await fireEvent.click(inner);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should handle URL strings correctly (not base64)', async () => {
    const { container } = render(ImageDialog, {
      props: {
        images: ['https://example.com/foo.png'],
        open: true,
        startIndex: 0,
      },
    });

    await vi.waitFor(() => {
      // Should not call stringToImage for non-data URLs
      // And downloadUrl should be the string itself
      const link = container.querySelector('a.dialog-image-btn');
      expect(link?.getAttribute('href')).toBe('https://example.com/foo.png');
    });
  });

  it('should handle data URLs correctly using createObjectURL', async () => {
    const { container } = render(ImageDialog, {
      props: {
        images: [testImages[0]],
        open: true,
        startIndex: 0,
      },
    });

    await vi.waitFor(() => {
      // Should call stringToImage
      const link = container.querySelector('a.dialog-image-btn');
      expect(link?.getAttribute('href')).toBe('blob:test');
    });
  });
});
