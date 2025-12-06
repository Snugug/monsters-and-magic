import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';
import ImageDialog from '$components/ImageDialog.svelte';

// Mock the window.open function
vi.stubGlobal('open', vi.fn());

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

describe('ImageDialog', () => {
  const testImages = [
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAAASUVORK5CYII=',
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
    const { container } = render(ImageDialog, {
      props: {
        images: testImages,
        open: true,
        startIndex: 0,
      },
    });

    await vi.waitFor(() => {
      const closeBtn = container.querySelector('.close-btn');
      expect(closeBtn).toBeTruthy();
    });
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
      expect(counter?.textContent).toContain('1 / 2');
    });
  });
});
