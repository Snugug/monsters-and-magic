import { test, expect } from './fixtures';

/**
 * E2E tests for the database worker init logic.
 *
 * We allow the test to run by mocking the network requests that the
 * worker makes to initialize the database:
 * 1. /data/meta.json - The registry of all data collections
 * 2. /data/<collection>.json - The actual data files
 *
 * We navigate to '/build-a-monster' because that page loads the
 * BuildAMonster.svelte component, which imports src/js/db.ts,
 * triggering the worker initialization.
 */

test.describe('Database Worker Initialization', () => {
  // Clear DB state before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(async () => {
      const dbs = await window.indexedDB.databases();
      for (const db of dbs) {
        if (db.name) {
          window.indexedDB.deleteDatabase(db.name);
        }
      }
    });
  });

  test('should fetch meta.json and initialize collections', async ({
    page,
  }) => {
    // 1. Mock meta.json
    await page.route('**/data/meta.json', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'weapons', hash: 'v1', path: '/data/weapons.json' },
          { id: 'armor', hash: 'v1', path: '/data/armor.json' },
        ]),
      });
    });

    // 2. Mock individual collection fetch
    await page.route('**/data/weapons.json', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'sword', title: 'Longsword', damage: '1d8' },
        ]),
      });
    });

    await page.route('**/data/armor.json', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'plate', title: 'Plate Mail', ac: 18 }]),
      });
    });

    // 3. Trigger the worker
    await page.goto('/build-a-monster');

    // 4. Verify DB state
    // Wait reasonably for worker to finish (it's async)
    await page.waitForTimeout(3000);

    const result = await page.evaluate(async () => {
      return new Promise<any>((resolve) => {
        const req = indexedDB.open('mnm');
        req.onsuccess = () => {
          const db = req.result;
          const storeNames = Array.from(db.objectStoreNames);

          // Helper to get count
          const getCount = (storeName: string) => {
            return new Promise<number>((res) => {
              if (!db.objectStoreNames.contains(storeName)) return res(-1);
              const tx = db.transaction(storeName, 'readonly');
              const store = tx.objectStore(storeName);
              const countReq = store.count();
              countReq.onsuccess = () => res(countReq.result);
              countReq.onerror = () => res(-2);
            });
          };

          Promise.all([
            getCount('meta'),
            getCount('weapons'),
            getCount('armor'),
          ]).then(([metaCount, weaponsCount, armorCount]) => {
            db.close();
            resolve({ metaCount, weaponsCount, armorCount, storeNames });
          });
        };
        req.onerror = () => resolve({ error: true });
      });
    });

    expect(result.storeNames).toContain('meta');
    expect(result.storeNames).toContain('weapons');
    expect(result.storeNames).toContain('armor');

    expect(result.metaCount).toBe(2);
    expect(result.weaponsCount).toBe(1);
    expect(result.armorCount).toBe(1);
  });

  test('should update data when hash changes', async ({ page }) => {
    // PRE-CONDITION: Seed DB with "v1" data manually
    await page.goto('/'); // Use home to just have context for evaluate
    await page.evaluate(async () => {
      return new Promise<void>((resolve) => {
        const req = indexedDB.open('mnm', 2); // Ensure version matches code
        req.onupgradeneeded = (e: any) => {
          const db = e.target.result;
          // Create stores if missing (simple mock of schema)
          if (!db.objectStoreNames.contains('meta'))
            db.createObjectStore('meta', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('weapons'))
            db.createObjectStore('weapons', { keyPath: 'id' });
        };
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction(['meta', 'weapons'], 'readwrite');

          tx.objectStore('meta').put({
            id: 'weapons',
            hash: 'v1',
            path: '/data/weapons.json',
          });
          tx.objectStore('weapons').put({
            id: 'old_sword',
            title: 'Old Sword',
          });

          tx.oncomplete = () => {
            db.close();
            resolve();
          };
        };
      });
    });

    // TEST: Now mock "v2" coming from server
    await page.route('**/data/meta.json', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'weapons', hash: 'v2', path: '/data/weapons.json' },
        ]),
      });
    });

    await page.route('**/data/weapons.json', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'new_sword', title: 'New Sword' }, // Different data
        ]),
      });
    });

    // Trigger worker
    await page.goto('/build-a-monster');
    await page.waitForTimeout(1000);

    // Verify
    const data = await page.evaluate(async () => {
      return new Promise<any[]>((resolve) => {
        const req = indexedDB.open('mnm');
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction('weapons', 'readonly');
          const allReq = tx.objectStore('weapons').getAll();
          allReq.onsuccess = () => {
            db.close();
            resolve(allReq.result);
          };
        };
      });
    });

    // Expect mostly the new data (old data cleared)
    expect(data.length).toBe(1);
    expect(data[0].title).toBe('New Sword');
  });
});
