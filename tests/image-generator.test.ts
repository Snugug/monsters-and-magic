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
});
