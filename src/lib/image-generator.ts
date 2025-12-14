import { GoogleGenAI, type Part } from '@google/genai';

export interface InputImage {
  base64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
}

export class ImageGenerator {
  private ai: GoogleGenAI;
  private apiKey: string;
  private systemPrompt: string;
  private model = 'nano-banana-pro-preview';

  constructor(apiKey: string, systemPrompt: string) {
    this.ai = new GoogleGenAI({ apiKey });
    this.apiKey = apiKey;
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
    } catch (error: any) {
      throw new Error(`Error generating image: ${error.message}`);
    }

    return null;
  }

  /**
   * Enqueues a batch generation job.
   * @param prompts List of text prompts.
   * @param name Optional display name for the batch job.
   * @returns The created batch job object.
   */
  async enqueue(prompts: string[], name?: string): Promise<any> {
    const lines = prompts.map((prompt) => {
      return JSON.stringify({
        request: {
          contents: [
            {
              role: 'user',
              parts: [{ text: this.systemPrompt + prompt }],
            },
          ],
          generationConfig: {
            responseModalities: ['IMAGE'],
          },
        },
      });
    });

    const jsonlContent = lines.join('\n');
    const file = new File([jsonlContent], 'batch.jsonl', {
      type: 'application/json',
    });

    const uploadResult = await this.ai.files.upload({
      file,
      config: { mimeType: 'application/json' },
    });

    if (!uploadResult.name) {
      throw new Error('Failed to upload batch file');
    }

    return await this.ai.batches.create({
      model: this.model,
      src: uploadResult.name,
      config: name ? { displayName: name } : undefined,
    });
  }

  /**
   * Queries the status of a batch job.
   * @param name The resource name of the batch job (e.g. "jobs/...").
   * @returns The latest batch job object.
   */
  async query(name: string): Promise<any> {
    return await this.ai.batches.get({ name });
  }

  /**
   * Retrieves and parses the results of a completed batch job.
   * @param outputFileName The resource name of the output file (e.g. "files/...").
   * @returns Array of base64 image strings.
   */
  async get(outputFileName: string): Promise<string[]> {
    // Download using fetch because ai.files.download is not supported in browser
    const response = await fetch(
      `https://generativelanguage.googleapis.com/download/v1beta/${outputFileName}:download?key=${this.apiKey}&alt=media`,
    );

    if (!response.ok) {
      throw new Error(`Failed to download results: ${response.statusText}`);
    }

    const fileContent = await response.text();
    const results: string[] = [];

    for (const line of fileContent.split('\n')) {
      if (line) {
        try {
          const parsedResponse = JSON.parse(line);
          if (parsedResponse.response) {
            for (const part of parsedResponse.response.candidates[0].content
              .parts) {
              if (part.inlineData && part.inlineData.data) {
                results.push(`data:image/png;base64, ${part.inlineData.data}`);
              }
            }
          } else if (parsedResponse.error) {
            // Log or handle individual item error
            console.error(
              `Batch item error: ${JSON.stringify(parsedResponse.error)}`,
            );
          }
        } catch (e) {
          console.error('Failed to parse result line', e);
        }
      }
    }

    return results;
  }
}
