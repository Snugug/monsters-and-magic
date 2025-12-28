import { describe, it, expect, vi, beforeEach } from 'vitest';
import { blobToBase64, fileToImage, stringToImage } from '$js/images';

describe('src/js/images', () => {
  const mockBlob = new Blob(['test content'], { type: 'text/plain' });
  const mockFile = new File(['test content'], 'test.txt', {
    type: 'text/plain',
  });
  const mockBase64 = 'data:text/plain;base64,dGVzdCBjb250ZW50'; // "test content" in base64

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('blobToBase64', () => {
    it('should convert a blob to a base64 string', async () => {
      // Mock FileReader as a class
      const mockReader = {
        readAsDataURL: vi.fn(),
        result: mockBase64,
        onloadend: null as any,
      };

      class MockFileReader {
        readAsDataURL = mockReader.readAsDataURL;
        result = mockReader.result;
        set onloadend(cb: any) {
          mockReader.onloadend = cb;
        }
        get onloadend() {
          return mockReader.onloadend;
        }
      }

      vi.stubGlobal('FileReader', MockFileReader);

      const promise = blobToBase64(mockBlob);

      // Manually trigger onloadend
      if (mockReader.onloadend) {
        mockReader.onloadend();
      }

      await expect(promise).resolves.toBe(mockBase64);
      expect(mockReader.readAsDataURL).toHaveBeenCalledWith(mockBlob);
    });

    it('should reject if FileReader result is not a string', async () => {
      const mockReader = {
        readAsDataURL: vi.fn(),
        result: null, // Not a string
        onloadend: null as any,
      };

      class MockFileReader {
        readAsDataURL = mockReader.readAsDataURL;
        result = mockReader.result;
        set onloadend(cb: any) {
          mockReader.onloadend = cb;
        }
        get onloadend() {
          return mockReader.onloadend;
        }
      }

      vi.stubGlobal('FileReader', MockFileReader);

      const promise = blobToBase64(mockBlob);

      if (mockReader.onloadend) {
        mockReader.onloadend();
      }

      await expect(promise).rejects.toBe('Unable to resolve as string');
    });
  });

  describe('fileToImage', () => {
    it('should convert a file to a base64 string', async () => {
      // Mock URL.createObjectURL (browser API)
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');

      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        blob: () => Promise.resolve(mockBlob),
      } as any);

      // We need to mock blobToBase64 implicitly by mocking FileReader again
      const mockReader = {
        readAsDataURL: vi.fn(),
        result: mockBase64,
        onloadend: null as any,
      };

      class MockFileReader {
        readAsDataURL = mockReader.readAsDataURL;
        result = mockReader.result;
        set onloadend(cb: any) {
          mockReader.onloadend = cb;
        }
        get onloadend() {
          return mockReader.onloadend;
        }
      }

      vi.stubGlobal('FileReader', MockFileReader);

      const promise = fileToImage(mockFile);

      // Allow the fetch await to proceed then trigger reader
      await new Promise(process.nextTick);
      if (mockReader.onloadend) {
        mockReader.onloadend();
      }

      await expect(promise).resolves.toBe(mockBase64);
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockFile);
      expect(global.fetch).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('stringToImage', () => {
    it('should convert a URL string to a blob', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        blob: () => Promise.resolve(mockBlob),
      } as any);

      const result = await stringToImage('http://example.com/image.png');

      expect(global.fetch).toHaveBeenCalledWith('http://example.com/image.png');
      expect(result).toBe(mockBlob);
    });
  });
});
