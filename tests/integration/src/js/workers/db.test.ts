import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Comlink from 'comlink';

// Mock DB Instance
const mockTable = {
  get: vi.fn(),
  put: vi.fn(),
  bulkPut: vi.fn(),
  clear: vi.fn(),
};

const mockDbInstance = {
  version: vi.fn().mockReturnThis(),
  stores: vi.fn().mockReturnThis(),
  meta: mockTable,
  traits: mockTable,
};

// Mock Dexie Constructor
vi.mock('dexie', () => {
  return {
    Dexie: class {
      constructor() {
        return mockDbInstance;
      }
    },
  };
});

vi.mock('comlink', () => ({
  expose: vi.fn(),
}));

describe('src/js/workers/db integration', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('should initialize database and populate data', async () => {
    // Mock fetch
    const mockMeta = [
      { id: 'traits', hash: 'new-hash', path: '/data/traits.json' },
    ];
    const mockData = [{ id: 'trait1', name: 'Trait 1' }];

    global.fetch = vi
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          json: () => Promise.resolve(mockMeta),
        } as any),
      ) // meta.json
      .mockImplementationOnce(() =>
        Promise.resolve({
          json: () => Promise.resolve(mockData),
        } as any),
      ); // traits.json

    // Default mock for meta.get to return null (force update)
    mockTable.get.mockResolvedValue(null);

    // Import module to trigger execution
    await import('$js/workers/db');

    // Extract exposed init
    expect(Comlink.expose).toHaveBeenCalled();
    const exposedHelper = (Comlink.expose as any).mock.calls[0][0];

    // We need to check if init exists on it
    expect(exposedHelper.init).toBeDefined();

    await exposedHelper.init();

    expect(global.fetch).toHaveBeenCalledWith('/data/meta.json');
    expect(global.fetch).toHaveBeenCalledWith('/data/traits.json');

    expect(mockDbInstance.traits.clear).toHaveBeenCalled();
    expect(mockDbInstance.traits.bulkPut).toHaveBeenCalledWith(mockData);
    expect(mockDbInstance.meta.put).toHaveBeenCalledWith(mockMeta[0]);
  });

  it('should not update if hash matches', async () => {
    const mockMeta = [
      { id: 'traits', hash: 'existing-hash', path: '/data/traits.json' },
    ];

    global.fetch = vi.fn().mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockMeta),
      } as any),
    );

    mockTable.get.mockResolvedValue({ id: 'traits', hash: 'existing-hash' });

    await import('$js/workers/db');
    const exposedHelper = (Comlink.expose as any).mock.calls[0][0];
    await exposedHelper.init();

    expect(global.fetch).toHaveBeenCalledTimes(1); // Only meta.json
    expect(mockDbInstance.traits.clear).not.toHaveBeenCalled();
  });

  it('should ignore collections not in database schema', async () => {
    const mockMeta = [
      { id: 'unknown-collection', hash: 'hash', path: '/data/unknown.json' },
    ];

    global.fetch = vi
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          json: () => Promise.resolve(mockMeta),
        } as any),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          json: () => Promise.resolve({}),
        } as any),
      );

    // existing meta check returns null to force update logic
    mockTable.get.mockResolvedValue(null);

    await import('$js/workers/db');
    const exposedHelper = (Comlink.expose as any).mock.calls[0][0];

    // Ensure unknown table is undefined in mock DB
    (mockDbInstance as any)['unknown-collection'] = undefined;

    await exposedHelper.init();

    // Should fetch meta AND data (since hash mismatch/null), but not crash on saving
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
