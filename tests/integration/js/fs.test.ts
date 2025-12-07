/**
 * Tests for src/js/fs.svelte.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock idb-keyval
vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
}));

// Mock global types and functions
const mockFileHandle = {
  kind: 'file',
  createWritable: vi.fn(),
  getFile: vi.fn(),
};

const mockDirectoryHandle = {
  kind: 'directory',
  getDirectoryHandle: vi.fn(),
  getFileHandle: vi.fn(),
  resolve: vi.fn(),
};

const showDirectoryPicker = vi.fn();
vi.stubGlobal('showDirectoryPicker', showDirectoryPicker);

describe('fs.svelte.ts', () => {
  let fsModule: any;
  let idb: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Reset mocks default behavior
    idb = await import('idb-keyval');
    (idb.get as any).mockResolvedValue(mockDirectoryHandle);
    
    // Mock showDirectoryPicker to return a handle
    showDirectoryPicker.mockResolvedValue(mockDirectoryHandle);

    // Mock directory handle methods
    mockDirectoryHandle.getDirectoryHandle.mockResolvedValue(mockDirectoryHandle);
    mockDirectoryHandle.getFileHandle.mockResolvedValue(mockFileHandle);
    mockDirectoryHandle.resolve.mockResolvedValue(['path', 'to', 'file']);

    // Mock file handle methods
    const mockWritable = {
      write: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    };
    mockFileHandle.createWritable.mockResolvedValue(mockWritable);

    // Re-import module to trigger top-level await with mocked values
    vi.resetModules();
    fsModule = await import('$js/fs.svelte');
  });

  it('should initialize folder from idb', async () => {
    expect(idb.get).toHaveBeenCalledWith('project');
    expect(fsModule.folder).toBe(mockDirectoryHandle);
  });

  describe('chooseFolder', () => {
    it('should call showDirectoryPicker and update idb', async () => {
      await fsModule.chooseFolder();
      
      expect(showDirectoryPicker).toHaveBeenCalled();
      expect(idb.set).toHaveBeenCalledWith('project', mockDirectoryHandle);
      expect(fsModule.folder).toBe(mockDirectoryHandle);
    });
  });

  describe('getDir', () => {
    it('should return undefined if no folder selected', async () => {
      // Simulate no folder
      vi.resetModules();
      (idb.get as any).mockResolvedValue(undefined);
      const mod = await import('$js/fs.svelte');
      
      const dir = await mod.getDir('test');
      expect(dir).toBeUndefined();
    });

    it('should traverse directories', async () => {
      const path = 'one/two';
      await fsModule.getDir(path);
      
      expect(mockDirectoryHandle.getDirectoryHandle).toHaveBeenCalledTimes(2);
      expect(mockDirectoryHandle.getDirectoryHandle).toHaveBeenNthCalledWith(1, 'one', { create: true });
      expect(mockDirectoryHandle.getDirectoryHandle).toHaveBeenNthCalledWith(2, 'two', { create: true });
    });
  });

  describe('getFileHandle', () => {
    it('should get file handle from directory', async () => {
      const path = 'folder/file.txt';
      const handle = await fsModule.getFileHandle(path, true);
      
      expect(mockDirectoryHandle.getDirectoryHandle).toHaveBeenCalledWith('folder', { create: true });
      expect(mockDirectoryHandle.getFileHandle).toHaveBeenCalledWith('file.txt', { create: true });
      expect(handle).toBe(mockFileHandle);
    });
  });

  describe('getPath', () => {
    it('should resolve path using folder handle', async () => {
      const path = await fsModule.getPath(mockFileHandle);
      
      expect(mockDirectoryHandle.resolve).toHaveBeenCalledWith(mockFileHandle);
      expect(path).toEqual(['path', 'to', 'file']);
    });
  });

  describe('writeFile', () => {
    it('should write content to file', async () => {
      const path = 'test.txt';
      const content = new Blob(['test']);
      
      await fsModule.writeFile(path, content);
      
      const writable = await mockFileHandle.createWritable();
      expect(writable.write).toHaveBeenCalledWith(content);
      expect(writable.close).toHaveBeenCalled();
    });
  });

  describe('writeImage', () => {
    it('should fetch image and write blob', async () => {
      const blob = new Blob(['image']);
      global.fetch = vi.fn().mockResolvedValue({
        blob: vi.fn().mockResolvedValue(blob),
      });

      await fsModule.writeImage('images/img.png', 'http://example.com/img.png');
      
      expect(global.fetch).toHaveBeenCalledWith('http://example.com/img.png');
      const writable = await mockFileHandle.createWritable();
      expect(writable.write).toHaveBeenCalledWith(blob);
    });
  });
});
