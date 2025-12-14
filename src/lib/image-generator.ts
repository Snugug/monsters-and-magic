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

  async batch(prompts: string[]): Promise<string[]> {
    // 1. Create and upload file
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

    // 2. Create batch job
    let batchJob = await this.ai.batches.create({
      model: this.model,
      src: uploadResult.name,
    });

    // 3. Monitor job status
    const completedStates = new Set([
      'JOB_STATE_SUCCEEDED',
      'JOB_STATE_FAILED',
      'JOB_STATE_CANCELLED',
      'JOB_STATE_EXPIRED',
    ]);

    while (!batchJob.state || !completedStates.has(batchJob.state)) {
      // Wait for 10 seconds before polling again
      await new Promise((resolve) => setTimeout(resolve, 10000));
      if (batchJob.name) {
        batchJob = await this.ai.batches.get({ name: batchJob.name });
      } else {
        throw new Error('Batch job name is missing');
      }
    }

    if (batchJob.state !== 'JOB_STATE_SUCCEEDED') {
      throw new Error(`Batch job failed with state: ${batchJob.state}`);
    }

    // 4. Retrieve results
    const results: string[] = [];
    if (batchJob.dest?.fileName) {
      // The SDK's download method might require a downloadPath or return a response.
      // Based on docs, it should return content if no path provided, but lint says otherwise.
      // We will cast to any to bypass the strict check and assume it returns the buffer/string
      // as hinted by the documentation example I read earlier.
      // If it fails at runtime, we will know.
      // Download using fetch because ai.files.download is not supported in browser
      // Use the correct download endpoint structure found in documentation
      const response = await fetch(
        `https://generativelanguage.googleapis.com/download/v1beta/${batchJob.dest.fileName}:download?key=${this.apiKey}&alt=media`,
      );

      if (!response.ok) {
        throw new Error(`Failed to download results: ${response.statusText}`);
      }

      const fileContent = await response.text();

      for (const line of fileContent.split('\n')) {
        if (line) {
          const parsedResponse = JSON.parse(line);
          if (parsedResponse.response) {
            for (const part of parsedResponse.response.candidates[0].content
              .parts) {
              if (part.inlineData && part.inlineData.data) {
                results.push(`data:image/png;base64, ${part.inlineData.data}`);
              }
            }
          } else if (parsedResponse.error) {
            throw new Error(`Batch item error: ${parsedResponse.error}`);
          }
        }
      }
    }

    return results;
  }
}
