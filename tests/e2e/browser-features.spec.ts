import { test, expect } from '@playwright/test';

/**
 * E2E tests for browser-based features in src/js
 * These tests verify that IndexedDB, Web Workers, and other browser APIs
 * work correctly in a real browser environment.
 */

test.describe('IndexedDB Integration', () => {
  test('should have IndexedDB available', async ({ page }) => {
    await page.goto('/');

    // Verify IndexedDB is available in the browser
    const hasIndexedDB = await page.evaluate(() => {
      return 'indexedDB' in window;
    });

    expect(hasIndexedDB).toBe(true);
  });

  test('should be able to open IndexedDB database', async ({ page }) => {
    await page.goto('/');

    const dbOpened = await page.evaluate(() => {
      return new Promise((resolve) => {
        const request = indexedDB.open('test-db', 1);
        request.onsuccess = () => {
          request.result.close();
          indexedDB.deleteDatabase('test-db');
          resolve(true);
        };
        request.onerror = () => resolve(false);
      });
    });

    expect(dbOpened).toBe(true);
  });

  test('should be able to list IndexedDB databases', async ({ page }) => {
    await page.goto('/');

    const canListDatabases = await page.evaluate(async () => {
      // indexedDB.databases() is a modern API, check if available
      if (typeof indexedDB.databases === 'function') {
        try {
          await indexedDB.databases();
          return true;
        } catch {
          return false;
        }
      }
      // If not available, still passes (older browsers)
      return true;
    });

    expect(canListDatabases).toBe(true);
  });
});

test.describe('Web Workers', () => {
  test('should have Web Worker support', async ({ page }) => {
    await page.goto('/');

    const hasWorkers = await page.evaluate(() => {
      return typeof Worker !== 'undefined';
    });

    expect(hasWorkers).toBe(true);
  });

  test('should be able to create and communicate with a worker', async ({
    page,
  }) => {
    await page.goto('/');

    const workerResult = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Create a simple inline worker for testing
        const blob = new Blob(
          [
            `
          self.onmessage = function(e) {
            self.postMessage({ received: e.data, response: 'hello from worker' });
          };
        `,
          ],
          { type: 'application/javascript' },
        );
        const workerUrl = URL.createObjectURL(blob);
        const worker = new Worker(workerUrl);

        worker.onmessage = (e) => {
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          resolve(e.data);
        };

        worker.onerror = () => {
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          resolve(null);
        };

        worker.postMessage('test message');
      });
    });

    expect(workerResult).not.toBeNull();
    expect((workerResult as any).received).toBe('test message');
    expect((workerResult as any).response).toBe('hello from worker');
  });

  test('should support module workers', async ({ page, browserName }) => {
    // Module workers may not be supported in all browsers
    await page.goto('/');

    const supportsModuleWorkers = await page.evaluate(() => {
      try {
        // Check if the browser supports module workers
        const blob = new Blob(['export default 1;'], {
          type: 'application/javascript',
        });
        const url = URL.createObjectURL(blob);
        const worker = new Worker(url, { type: 'module' });
        worker.terminate();
        URL.revokeObjectURL(url);
        return true;
      } catch {
        return false;
      }
    });

    // Module workers are supported in modern browsers
    if (browserName === 'chromium' || browserName === 'firefox') {
      expect(supportsModuleWorkers).toBe(true);
    }
  });
});

test.describe('Blob and File APIs', () => {
  test('should support Blob creation', async ({ page }) => {
    await page.goto('/');

    const blobCreated = await page.evaluate(() => {
      const blob = new Blob(['test content'], { type: 'text/plain' });
      return blob.size > 0 && blob.type === 'text/plain';
    });

    expect(blobCreated).toBe(true);
  });

  test('should support URL.createObjectURL', async ({ page }) => {
    await page.goto('/');

    const urlCreated = await page.evaluate(() => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const isValid = url.startsWith('blob:');
      URL.revokeObjectURL(url);
      return isValid;
    });

    expect(urlCreated).toBe(true);
  });

  test('should support FileReader', async ({ page }) => {
    await page.goto('/');

    const fileReaderResult = await page.evaluate(() => {
      return new Promise((resolve) => {
        const blob = new Blob(['hello world'], { type: 'text/plain' });
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.onerror = () => resolve(null);
        reader.readAsText(blob);
      });
    });

    expect(fileReaderResult).toBe('hello world');
  });

  test('should support FileReader readAsDataURL', async ({ page }) => {
    await page.goto('/');

    const dataUrl = await page.evaluate(() => {
      return new Promise((resolve) => {
        const blob = new Blob(['test'], { type: 'text/plain' });
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    });

    expect(dataUrl).toContain('data:text/plain;base64,');
  });
});

test.describe('Fetch with Blob URLs', () => {
  test('should be able to fetch blob URLs', async ({ page }) => {
    await page.goto('/');

    const fetchResult = await page.evaluate(async () => {
      const blob = new Blob(['test content'], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      try {
        const response = await fetch(url);
        const text = await response.text();
        URL.revokeObjectURL(url);
        return text;
      } catch {
        URL.revokeObjectURL(url);
        return null;
      }
    });

    expect(fetchResult).toBe('test content');
  });
});

test.describe('Comlink Integration', () => {
  test('should be able to load Comlink-based workers on the app', async ({
    page,
  }) => {
    await page.goto('/');

    // Wait for app to initialize (workers are loaded on app start)
    await page.waitForTimeout(3000);

    // Check that no errors occurred during worker initialization
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to ensure workers are loaded
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Filter out expected errors (like network requests that might fail)
    const criticalErrors = consoleErrors.filter(
      (err) =>
        err.includes('Worker') ||
        err.includes('Comlink') ||
        err.includes('IndexedDB'),
    );

    expect(criticalErrors.length).toBe(0);
  });
});

test.describe('File System Access API (Chrome only)', () => {
  test('should have showDirectoryPicker in Chrome', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'File System Access is Chrome-only');

    await page.goto('/');

    const hasFileSystemAccess = await page.evaluate(() => {
      return typeof (window as any).showDirectoryPicker === 'function';
    });

    expect(hasFileSystemAccess).toBe(true);
  });

  test('should have showOpenFilePicker in Chrome', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'File System Access is Chrome-only');

    await page.goto('/');

    const hasFilePicker = await page.evaluate(() => {
      return typeof (window as any).showOpenFilePicker === 'function';
    });

    expect(hasFilePicker).toBe(true);
  });

  test('should have showSaveFilePicker in Chrome', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'File System Access is Chrome-only');

    await page.goto('/');

    const hasSavePicker = await page.evaluate(() => {
      return typeof (window as any).showSaveFilePicker === 'function';
    });

    expect(hasSavePicker).toBe(true);
  });
});

test.describe('IDB-Keyval Storage', () => {
  test('should be able to store and retrieve values', async ({ page }) => {
    await page.goto('/');

    const storeResult = await page.evaluate(async () => {
      // Create a simple test using raw IndexedDB (similar to idb-keyval)
      return new Promise((resolve) => {
        const request = indexedDB.open('test-keyval', 1);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          db.createObjectStore('keyval');
        };

        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('keyval', 'readwrite');
          const store = tx.objectStore('keyval');

          // Store a value
          store.put('test-value', 'test-key');

          tx.oncomplete = () => {
            // Read it back
            const readTx = db.transaction('keyval', 'readonly');
            const readStore = readTx.objectStore('keyval');
            const getRequest = readStore.get('test-key');

            getRequest.onsuccess = () => {
              const value = getRequest.result;
              db.close();
              indexedDB.deleteDatabase('test-keyval');
              resolve(value);
            };
          };
        };

        request.onerror = () => resolve(null);
      });
    });

    expect(storeResult).toBe('test-value');
  });
});
