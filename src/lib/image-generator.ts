import { GoogleGenAI, type Part } from '@google/genai';

export interface InputImage {
  base64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
}

export class ImageGenerator {
  private ai: GoogleGenAI;
  private systemPrompt: string;
  private model = 'nano-banana-pro-preview';

  constructor(apiKey: string, systemPrompt: string) {
    this.ai = new GoogleGenAI({ apiKey });
    this.systemPrompt = systemPrompt;
  }

  async generate(
    userPrompt: string,
    images?: InputImage[],
  ): Promise<string | null> {
    try {
      // Build content parts
      const parts: Part[] = [];

      // Add the text prompt
      parts.push({ text: this.systemPrompt + userPrompt });

      // Add all images if provided
      if (images && images.length > 0) {
        for (const image of images) {
          parts.push({
            inlineData: {
              data: image.base64,
              mimeType: image.mimeType,
            },
          });
        }
      }

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: parts,
        config: {
          responseModalities: ['IMAGE'],
          imageConfig: {
            aspectRatio: '1:1',
            personGeneration: 'allow_all',
          } as any,
        },
      });

      const reason = response.candidates?.[0]?.finishReason;

      if (reason !== 'STOP') {
        throw new Error(reason);
      }

      if (!response.candidates?.[0]?.content?.parts) {
        throw new Error('No response');
      }

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64, ${part.inlineData.data}`;
        }
      }
    } catch (error) {
      throw new Error(`Error generating image: ${error.message}`);
    }

    return null;
  }
}
