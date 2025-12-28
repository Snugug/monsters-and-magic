import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Comlink from 'comlink';

const mockInit = vi.fn();
const mockDb = {
  version: vi.fn(),
  stores: vi.fn(),
};

vi.mock('comlink', () => ({
  wrap: vi.fn(() => ({
    init: mockInit,
    db: mockDb,
  })),
  expose: vi.fn(),
}));

// Mock Worker
const MockWorker = vi.fn();
vi.stubGlobal('Worker', MockWorker);

describe('src/js/db', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize the database and export db', async () => {
    // We need to import the module dynamically to trigger the top-level await and code execution
    const module = await import('$js/db');

    expect(Comlink.wrap).toHaveBeenCalled();
    expect(mockInit).toHaveBeenCalled();
    expect(module.db).toBe(mockDb);
  });
});
