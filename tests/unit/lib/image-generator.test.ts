import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ImageGenerator } from '$lib/image-generator';

// Mock the @google/genai library
const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = {
      generateContent: mockGenerateContent,
    };
  },
}));

describe('ImageGenerator', () => {
  const apiKey = 'test-api-key';
  const systemPrompt = 'test-system-prompt';
  let imageGenerator: ImageGenerator;

  beforeEach(() => {
    vi.clearAllMocks();
    imageGenerator = new ImageGenerator(apiKey, systemPrompt);
  });

  it('should be instantiated correctly', () => {
    expect(imageGenerator).toBeInstanceOf(ImageGenerator);
  });

  it('should generate an image and return a data URL on success', async () => {
    const userPrompt = 'a picture of a cat';
    const mockResponse = {
      candidates: [
        {
          finishReason: 'STOP',
          content: {
            parts: [
              {
                inlineData: {
                  data: 'base64-encoded-image-data',
                },
              },
            ],
          },
        },
      ],
    };
    mockGenerateContent.mockResolvedValue(mockResponse);

    const result = await imageGenerator.generate(userPrompt);

    expect(result).toBe('data:image/png;base64, base64-encoded-image-data');
    expect(mockGenerateContent).toHaveBeenCalledWith({
      model: 'nano-banana-pro-preview',
      contents: [{ text: systemPrompt + userPrompt }],
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio: '1:1',
          personGeneration: 'allow_all',
        },
      },
    });
  });

  it('should throw an error if finishReason is not STOP', async () => {
    const userPrompt = 'a picture of a dog';
    const mockResponse = {
      candidates: [
        {
          finishReason: 'ERROR',
          content: { parts: [] },
        },
      ],
    };
    mockGenerateContent.mockResolvedValue(mockResponse);

    await expect(imageGenerator.generate(userPrompt)).rejects.toThrow(
      'Error generating image: ERROR',
    );
  });

  it('should throw an error if no parts are returned', async () => {
    const userPrompt = 'a picture of a bird';
    const mockResponse = {
      candidates: [
        {
          finishReason: 'STOP',
          content: {},
        },
      ],
    };
    mockGenerateContent.mockResolvedValue(mockResponse);

    await expect(imageGenerator.generate(userPrompt)).rejects.toThrow(
      'Error generating image: No response',
    );
  });

  it('should return null if no inlineData is present', async () => {
    const userPrompt = 'a picture of a fish';
    const mockResponse = {
      candidates: [
        {
          finishReason: 'STOP',
          content: {
            parts: [
              {
                text: 'some text',
              },
            ],
          },
        },
      ],
    };
    mockGenerateContent.mockResolvedValue(mockResponse);

    const result = await imageGenerator.generate(userPrompt);
    expect(result).toBeNull();
  });

  it('should throw an error if the API call fails', async () => {
    const userPrompt = 'a picture of a horse';
    const errorMessage = 'API is down';
    mockGenerateContent.mockRejectedValue(new Error(errorMessage));

    await expect(imageGenerator.generate(userPrompt)).rejects.toThrow(
      `Error generating image: ${errorMessage}`,
    );
  });

  describe('with image inputs', () => {
    it('should include single image in request', async () => {
      const userPrompt = 'describe this image';
      const images = [
        {
          base64: 'image-data-1',
          mimeType: 'image/jpeg' as const,
        },
      ];
      const mockResponse = {
        candidates: [
          {
            finishReason: 'STOP',
            content: {
              parts: [{ inlineData: { data: 'result-data' } }],
            },
          },
        ],
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      await imageGenerator.generate(userPrompt, images);

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: [
            { text: systemPrompt + userPrompt },
            { inlineData: { data: 'image-data-1', mimeType: 'image/jpeg' } },
          ],
        }),
      );
    });

    it('should include multiple images in request', async () => {
      const userPrompt = 'compare these images';
      const images = [
        { base64: 'image-data-1', mimeType: 'image/jpeg' as const },
        { base64: 'image-data-2', mimeType: 'image/png' as const },
        { base64: 'image-data-3', mimeType: 'image/webp' as const },
      ];
      const mockResponse = {
        candidates: [
          {
            finishReason: 'STOP',
            content: {
              parts: [{ inlineData: { data: 'result-data' } }],
            },
          },
        ],
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      await imageGenerator.generate(userPrompt, images);

      const callArg = mockGenerateContent.mock.calls[0][0];
      expect(callArg.contents).toHaveLength(4); // 1 text + 3 images
    });

    it('should handle empty images array', async () => {
      const userPrompt = 'just text';
      const images: never[] = [];
      const mockResponse = {
        candidates: [
          {
            finishReason: 'STOP',
            content: {
              parts: [{ inlineData: { data: 'result-data' } }],
            },
          },
        ],
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      await imageGenerator.generate(userPrompt, images);

      const callArg = mockGenerateContent.mock.calls[0][0];
      expect(callArg.contents).toHaveLength(1); // just text
    });

    it('should handle undefined images parameter', async () => {
      const userPrompt = 'just text no images';
      const mockResponse = {
        candidates: [
          {
            finishReason: 'STOP',
            content: {
              parts: [{ inlineData: { data: 'result-data' } }],
            },
          },
        ],
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      await imageGenerator.generate(userPrompt);

      const callArg = mockGenerateContent.mock.calls[0][0];
      expect(callArg.contents).toHaveLength(1);
    });
  });

  describe('error handling edge cases', () => {
    it('should handle SAFETY finish reason', async () => {
      const mockResponse = {
        candidates: [
          {
            finishReason: 'SAFETY',
            content: { parts: [] },
          },
        ],
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      await expect(imageGenerator.generate('bad prompt')).rejects.toThrow(
        'Error generating image: SAFETY',
      );
    });

    it('should handle MAX_TOKENS finish reason', async () => {
      const mockResponse = {
        candidates: [
          {
            finishReason: 'MAX_TOKENS',
            content: { parts: [] },
          },
        ],
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      await expect(imageGenerator.generate('long prompt')).rejects.toThrow(
        'Error generating image: MAX_TOKENS',
      );
    });

    it('should handle empty candidates array', async () => {
      const mockResponse = {
        candidates: [],
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      await expect(imageGenerator.generate('test')).rejects.toThrow();
    });

    it('should handle null candidates', async () => {
      const mockResponse = {
        candidates: null,
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      await expect(imageGenerator.generate('test')).rejects.toThrow();
    });

    it('should handle network timeout error', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Network timeout'));

      await expect(imageGenerator.generate('test')).rejects.toThrow(
        'Error generating image: Network timeout',
      );
    });

    it('should concatenate system and user prompts correctly', async () => {
      const userPrompt = 'draw a dragon';
      const mockResponse = {
        candidates: [
          {
            finishReason: 'STOP',
            content: {
              parts: [{ inlineData: { data: 'dragon-image' } }],
            },
          },
        ],
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      await imageGenerator.generate(userPrompt);

      const callArg = mockGenerateContent.mock.calls[0][0];
      expect(callArg.contents[0].text).toBe('test-system-promptdraw a dragon');
    });
  });

  describe('batch', () => {
    const mockUpload = vi.fn();
    const mockCreateBatch = vi.fn();
    const mockGetBatch = vi.fn();

    beforeEach(() => {
      // Setup mocks for file upload, batch creation, batch retrieval, and file download
      (imageGenerator as any).ai.files = { upload: mockUpload };
      (imageGenerator as any).ai.batches = {
        create: mockCreateBatch,
        get: mockGetBatch,
      };

      // Mock global fetch
      global.fetch = vi.fn();
    });

    it('should create a batch job, poll for completion, and return results', async () => {
      vi.useFakeTimers();
      const prompts = ['prompt 1', 'prompt 2'];

      mockUpload.mockResolvedValue({ name: 'files/batch-file-id' });
      mockCreateBatch.mockResolvedValue({
        name: 'jobs/batch-job-id',
        state: 'ACTIVE',
      });

      // Mock polling: First call returns ACTIVE, second returns SUCCEEDED
      mockGetBatch
        .mockResolvedValueOnce({ name: 'jobs/batch-job-id', state: 'ACTIVE' })
        .mockResolvedValueOnce({
          name: 'jobs/batch-job-id',
          state: 'JOB_STATE_SUCCEEDED',
          dest: { fileName: 'results.jsonl' },
        });

      // Mock download result via fetch
      const mockResultContent = [
        JSON.stringify({
          response: {
            candidates: [
              { content: { parts: [{ inlineData: { data: 'image-1' } }] } },
            ],
          },
        }),
        JSON.stringify({
          response: {
            candidates: [
              { content: { parts: [{ inlineData: { data: 'image-2' } }] } },
            ],
          },
        }),
      ].join('\n');

      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockResultContent),
      });

      const batchPromise = imageGenerator.batch(prompts);

      // Fast-forward time for polling
      // We need to advance timers to trigger the loop iterations
      // Since polling uses `await new Promise(...)`, just advancing timers might not be enough if we don't await the promise chain.
      // However, `batch` is async. We can use `vi.runAllTimersAsync()` if available or loop advancement.

      // Let's rely on standard promise resolution with fake timers.
      // We might need to step through the loop.
      // But standard way is loop running in background.

      await vi.advanceTimersByTimeAsync(11000); // Wait first 10s
      await vi.advanceTimersByTimeAsync(11000); // Wait second 10s (if needed)

      const results = await batchPromise;

      expect(results).toHaveLength(2);
      expect(results[0]).toBe('data:image/png;base64, image-1');
      expect(results[1]).toBe('data:image/png;base64, image-2');

      expect(mockUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          config: { mimeType: 'application/json' },
        }),
      );

      // Verify file content construction
      const uploadCall = mockUpload.mock.calls[0][0];
      const fileContent = await uploadCall.file.text();
      const lines = fileContent.split('\n');

      const req1 = JSON.parse(lines[0]);
      expect(req1.request.contents[0].parts[0].text).toBe(
        'test-system-promptprompt 1',
      );
      expect(req1.request.contents[0].role).toBe('user');
      expect(req1.request.generationConfig.responseModalities).toEqual([
        'IMAGE',
      ]);
      expect(req1.request.generationConfig.imageConfig).toBeUndefined();

      const req2 = JSON.parse(lines[1]);
      expect(req2.request.contents[0].parts[0].text).toBe(
        'test-system-promptprompt 2',
      );

      expect(mockCreateBatch).toHaveBeenCalledWith({
        model: 'nano-banana-pro-preview',
        src: 'files/batch-file-id',
      });

      expect(mockGetBatch).toHaveBeenCalledTimes(2);

      // Verify fetch was called for download
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          'https://generativelanguage.googleapis.com/download/v1beta/results.jsonl:download',
        ),
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('key=test-api-key'),
      );

      vi.useRealTimers();
    });

    it('should throw error if batch job fails', async () => {
      vi.useFakeTimers();
      const prompts = ['prompt 1'];

      mockUpload.mockResolvedValue({ name: 'files/batch-file-id' });
      mockCreateBatch.mockResolvedValue({
        name: 'jobs/batch-job-id',
        state: 'ACTIVE',
      });
      mockGetBatch.mockResolvedValue({
        name: 'jobs/batch-job-id',
        state: 'JOB_STATE_FAILED',
      });

      const batchPromise = imageGenerator.batch(prompts);
      // Attach the expectation immediately so the rejection is caught
      const validationPromise = expect(batchPromise).rejects.toThrow(
        'Batch job failed with state: JOB_STATE_FAILED',
      );

      await vi.advanceTimersByTimeAsync(11000);

      await validationPromise;

      vi.useRealTimers();
    });
  });
});
