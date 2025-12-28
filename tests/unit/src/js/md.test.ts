import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Comlink from 'comlink';

const mockMdWorker = {
  parse: vi.fn(),
  compile: vi.fn(),
};

vi.mock('comlink', () => ({
  wrap: vi.fn(() => mockMdWorker),
  expose: vi.fn(),
}));

// Mock Worker
const MockWorker = vi.fn();
vi.stubGlobal('Worker', MockWorker);

describe('src/js/md', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize the markdown worker', async () => {
    const module = await import('$js/md');

    expect(Comlink.wrap).toHaveBeenCalled();
    expect(module.md).toBe(mockMdWorker);
  });
});
