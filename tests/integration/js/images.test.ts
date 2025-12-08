/**
 * Tests for src/js/images.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { blobToBase64, fileToImage, stringToImage } from '$js/images';

describe('images.ts', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('blobToBase64', () => {
    it('should convert a text blob to base64 data URL', async () => {
      const blob = new Blob(['hello world'], { type: 'text/plain' });
      const result = await blobToBase64(blob);

      expect(result).toContain('data:text/plain;base64,');
    });

    it('should convert an image blob to base64 data URL', async () => {
      // Create a simple 1x1 pixel PNG blob
      const base64Png =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const binaryString = atob(base64Png);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'image/png' });

      const result = await blobToBase64(blob);

      expect(result).toContain('data:image/png;base64,');
    });

    it('should handle empty blob', async () => {
      const blob = new Blob([], { type: 'text/plain' });
      const result = await blobToBase64(blob);

      expect(result).toBe('data:text/plain;base64,');
    });

    it('should reject if FileReader result is not a string', async () => {
      // Mock FileReader to force non-string result
      const originalFileReader = global.FileReader;
      global.FileReader = class MockFileReader {
        result: any = null;
        onloadend: any = null;
        readAsDataURL() {
          this.result = new ArrayBuffer(8); // Not a string
          // Simulate async behavior to allow onloadend assignment
          setTimeout(() => {
            if (this.onloadend) this.onloadend();
          }, 0);
        }
      } as any;

      const blob = new Blob(['test']);
      await expect(blobToBase64(blob)).rejects.toEqual(
        'Unable to resolve as string',
      );

      global.FileReader = originalFileReader;
    });
  });

  describe('stringToImage', () => {
    it('should convert a data URL string to blob', async () => {
      const dataUrl =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const blob = new Blob(['test'], { type: 'image/png' });
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        blob: () => Promise.resolve(blob),
      } as Response);

      const result = await stringToImage(dataUrl);

      expect(fetchSpy).toHaveBeenCalledWith(dataUrl);
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('image/png');
    });
  });

  describe('fileToImage', () => {
    it('should convert a file to base64 data URL', async () => {
      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });

      // Mock URL.createObjectURL
      const createObjectURL = vi.fn().mockReturnValue('blob:test');
      vi.stubGlobal('URL', { createObjectURL });

      // Mock fetch
      const blob = new Blob(['test content'], { type: 'text/plain' });
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        blob: () => Promise.resolve(blob),
      } as Response);

      const result = await fileToImage(file);

      expect(createObjectURL).toHaveBeenCalledWith(file);
      expect(fetchSpy).toHaveBeenCalledWith('blob:test');
      expect(result).toContain('data:text/plain;base64,');
    });
  });
});
