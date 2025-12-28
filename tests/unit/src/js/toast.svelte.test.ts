// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stub global constants that might be used
vi.stubGlobal('DEV', false);

// Mock crypto.randomUUID
global.crypto.randomUUID = vi.fn(() => 'mock-uuid');

import { addToast, removeToast, getToasts } from '$js/toast.svelte';

describe('src/js/toast.svelte', () => {
  beforeEach(() => {
    const toasts = getToasts();
    // Since toasts is a reference to the array in module scope, we can clear it.
    toasts.length = 0;
  });

  it('should add a toast', () => {
    addToast('Hello World', 'success');
    expect(getToasts()).toEqual([
      { id: 'mock-uuid', message: 'Hello World', type: 'success' },
    ]);
  });

  it('should use default type info', () => {
    addToast('Info Message');
    expect(getToasts()).toEqual([
      { id: 'mock-uuid', message: 'Info Message', type: 'info' },
    ]);
  });

  it('should remove a toast', () => {
    (global.crypto.randomUUID as any)
      .mockReturnValueOnce('id-1')
      .mockReturnValueOnce('id-2');

    addToast('Toast 1');
    addToast('Toast 2');

    expect(getToasts()).toHaveLength(2);

    removeToast('id-1');
    expect(getToasts()).toEqual([
      { id: 'id-2', message: 'Toast 2', type: 'info' },
    ]);
  });

  it('should do nothing if removing non-existent toast', () => {
    addToast('Toast 1');
    removeToast('non-existent');
    expect(getToasts()).toHaveLength(1);
  });
});
