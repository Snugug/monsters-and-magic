import { describe, it, expect } from 'vitest';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { markdown } from '$$lib/markdown';

describe('Integration: Markdown with Astro Processor', () => {
  it('should process custom directives', async () => {
    const processor = await createMarkdownProcessor({
      remarkPlugins: markdown.remarkPlugins,
      rehypePlugins: [],
    });

    const content = ':::message{.warning}\nHello\n:::';
    const result = await processor.render(content);

    // Expect exact full HTML structure
    expect(result.code.trim()).toBe(
      '<div class="warning message type" data-type="warning"><p>Hello</p></div>',
    );
  });

  it('should process figure directive', async () => {
    const processor = await createMarkdownProcessor({
      remarkPlugins: markdown.remarkPlugins,
      rehypePlugins: [],
    });

    const content =
      ':::figure[Caption text]{#fig1}\n![Alt text](image.png)\n:::';
    const result = await processor.render(content);

    // Expect exact full HTML structure
    expect(result.code.trim()).toBe(
      '<figure id="figure-fig1"><p><img src="image.png" alt="Alt text"></p><figcaption>Caption text</figcaption></figure>',
    );
  });

  it('should process default message directive', async () => {
    const processor = await createMarkdownProcessor({
      remarkPlugins: markdown.remarkPlugins,
      rehypePlugins: [],
    });
    const content = ':::message\nDefault\n:::';
    const result = await processor.render(content);
    expect(result.code.trim()).toBe(
      '<div class="message type"><p>Default</p></div>',
    );
  });

  it('should process titled message', async () => {
    const processor = await createMarkdownProcessor({
      remarkPlugins: markdown.remarkPlugins,
      rehypePlugins: [],
    });
    const content = ':::message[Title]\nContent\n:::';
    const result = await processor.render(content);
    // Note: The title implementation in markdown.ts adds a p.message--title, then the rest of content
    expect(result.code.trim()).toBe(
      '<div class="message type"><p class="message--title">Title</p><p>Content</p></div>',
    );
  });

  it('should handle multi-line content in directives', async () => {
    const processor = await createMarkdownProcessor({
      remarkPlugins: markdown.remarkPlugins,
      rehypePlugins: [],
    });
    const content = `:::message
Line 1

Line 2
:::`;
    const result = await processor.render(content);
    expect(result.code.trim()).toBe(
      '<div class="message type"><p>Line 1</p><p>Line 2</p></div>',
    );
  });

  it('should handle markdown formatting inside directives', async () => {
    const processor = await createMarkdownProcessor({
      remarkPlugins: markdown.remarkPlugins,
      rehypePlugins: [],
    });
    const content = `:::message
**Bold** and *Italic* and [Link](https://example.com)
:::`;
    const result = await processor.render(content);
    expect(result.code.trim()).toBe(
      '<div class="message type"><p><strong>Bold</strong> and <em>Italic</em> and <a href="https://example.com">Link</a></p></div>',
    );
    expect(result.code.trim()).toBe(
      '<div class="message type"><p><strong>Bold</strong> and <em>Italic</em> and <a href="https://example.com">Link</a></p></div>',
    );
  });

  it('should handle multi-line markdown content inside figure', async () => {
    const processor = await createMarkdownProcessor({
      remarkPlugins: markdown.remarkPlugins,
      rehypePlugins: [],
    });
    const content = `:::figure[My Caption]
**Bold text**

*Italic text*
:::`;
    const result = await processor.render(content);

    // Expect standard block handling inside figure: paragraphs for text blocks
    // Caption should be moved to figcaption
    expect(result.code.trim()).toBe(
      '<figure><p><strong>Bold text</strong></p><p><em>Italic text</em></p><figcaption>My Caption</figcaption></figure>',
    );
  });
});
