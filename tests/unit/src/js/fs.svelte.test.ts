// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Stub global constants that might be used
vi.stubGlobal('DEV', false);

// Mock browser APIs
const mockShowDirectoryPicker = vi.fn();
global.showDirectoryPicker = mockShowDirectoryPicker;

const mockFileHandle = {
  kind: 'file',
  createWritable: vi.fn(),
};
const mockDirHandle = {
  kind: 'directory',
  getDirectoryHandle: vi.fn(),
  getFileHandle: vi.fn(),
  resolve: vi.fn(),
};

// Mock dependencies
vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn(),
}));

import * as idb from 'idb-keyval';

describe('src/js/fs.svelte', () => {
  let fsModule: any;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  async function loadModule() {
    fsModule = await import('$js/fs.svelte');
    return fsModule;
  }

  describe('initialization', () => {
    it('should load innerFolder from idb', async () => {
      vi.mocked(idb.get).mockResolvedValue(mockDirHandle);
      const mod = await loadModule();
      expect(idb.get).toHaveBeenCalledWith('project');
      expect(mod.folder.current).toStrictEqual(mockDirHandle);
    });

    it('should be undefined if idb is empty', async () => {
      vi.mocked(idb.get).mockResolvedValue(undefined);
      const mod = await loadModule();
      expect(mod.folder.current).toBeUndefined();
    });
  });

  describe('chooseFolder', () => {
    it('should set innerFolder and save to idb', async () => {
      vi.mocked(idb.get).mockResolvedValue(undefined);
      const mod = await loadModule();

      mockShowDirectoryPicker.mockResolvedValue(mockDirHandle);

      await mod.chooseFolder();

      expect(mockShowDirectoryPicker).toHaveBeenCalled();
      expect(idb.set).toHaveBeenCalledWith('project', mockDirHandle);
      expect(mod.folder.current).toStrictEqual(mockDirHandle);
    });
  });

  describe('getDir', () => {
    it('should return undefined if no innerFolder', async () => {
      vi.mocked(idb.get).mockResolvedValue(undefined);
      const mod = await loadModule();

      const result = await mod.getDir('foo');
      expect(result).toBeUndefined();
    });

    it('should get nested directory handles', async () => {
      vi.mocked(idb.get).mockResolvedValue(mockDirHandle);
      const mod = await loadModule();

      // Setup mocks
      const subDir = { ...mockDirHandle, name: 'bar' };
      mockDirHandle.getDirectoryHandle.mockResolvedValue(subDir);

      const result = await mod.getDir('foo/bar');

      // First call on innerFolder (foo), second on handler (bar)
      expect(mockDirHandle.getDirectoryHandle).toHaveBeenCalledTimes(2);
      expect(result).toBe(subDir);
    });
  });

  describe('getPath', () => {
    it('should return empty array if no innerFolder', async () => {
      vi.mocked(idb.get).mockResolvedValue(undefined);
      const mod = await loadModule();
      const res = await mod.getPath(mockFileHandle);
      expect(res).toEqual([]);
    });

    it('should resolve path', async () => {
      vi.mocked(idb.get).mockResolvedValue(mockDirHandle);
      const mod = await loadModule();

      mockDirHandle.resolve.mockResolvedValue(['foo', 'bar']);
      const res = await mod.getPath(mockFileHandle);
      expect(res).toEqual(['foo', 'bar']);
    });

    it('should return empty array if resolve returns nothing', async () => {
      vi.mocked(idb.get).mockResolvedValue(mockDirHandle);
      const mod = await loadModule();

      mockDirHandle.resolve.mockResolvedValue(null);
      const res = await mod.getPath(mockFileHandle);
      expect(res).toEqual([]);
    });
  });

  describe('writeFile', () => {
    it('should write content to file', async () => {
      vi.mocked(idb.get).mockResolvedValue(mockDirHandle);
      const mod = await loadModule();

      // "foo/test.txt"
      mockDirHandle.getDirectoryHandle.mockResolvedValue(mockDirHandle);
      mockDirHandle.getFileHandle.mockResolvedValue(mockFileHandle);

      const mockWritable = { write: vi.fn(), close: vi.fn() };
      mockFileHandle.createWritable.mockResolvedValue(mockWritable);

      await mod.writeFile('foo/test.txt', new Blob(['test']));

      expect(mockWritable.write).toHaveBeenCalled();
      expect(mockWritable.close).toHaveBeenCalled();
    });
  });

  describe('writeImage', () => {
    it('should convert and write', async () => {
      vi.mocked(idb.get).mockResolvedValue(mockDirHandle);
      const mod = await loadModule();

      global.fetch = vi.fn().mockResolvedValue({
        blob: () => Promise.resolve(new Blob(['img'])),
      } as any);

      mockDirHandle.getDirectoryHandle.mockResolvedValue(mockDirHandle);
      mockDirHandle.getFileHandle.mockResolvedValue(mockFileHandle);
      const mockWritable = { write: vi.fn(), close: vi.fn() };
      mockFileHandle.createWritable.mockResolvedValue(mockWritable);

      await mod.writeImage('foo/img.png', 'http://img.com');
      expect(global.fetch).toHaveBeenCalled();
      expect(mockWritable.write).toHaveBeenCalled();
    });
  });

  describe('fileExists', () => {
    it('should return true', async () => {
      vi.mocked(idb.get).mockResolvedValue(mockDirHandle);
      const mod = await loadModule();

      mockDirHandle.getFileHandle.mockResolvedValue(mockFileHandle);
      const exists = await mod.fileExists('foo/exists.txt');
      expect(exists).toBe(true);
    });
    it('should return false', async () => {
      vi.mocked(idb.get).mockResolvedValue(mockDirHandle);
      const mod = await loadModule();

      mockDirHandle.getFileHandle.mockRejectedValue(new Error('fail'));
      const exists = await mod.fileExists('foo/missing.txt');
      expect(exists).toBe(false);
    });
  });

  describe('getFileHandle', () => {
    it('should use default create=false', async () => {
      vi.mocked(idb.get).mockResolvedValue(mockDirHandle);
      const mod = await loadModule();

      mockDirHandle.getDirectoryHandle.mockResolvedValue(mockDirHandle);
      mockDirHandle.getFileHandle.mockResolvedValue(mockFileHandle);

      await mod.getFileHandle('foo/bar.txt');

      expect(mockDirHandle.getFileHandle).toHaveBeenCalledWith('bar.txt', {
        create: false,
      });
    });
  });
});
