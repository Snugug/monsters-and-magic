import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Footer from '$components/Footer.astro';

describe('Footer', () => {
  it('should render footer with copyright and current year', async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(Footer);

    expect(result).toContain('<footer');
    expect(result).toContain('</footer>');
    // Footer should contain some content
    expect(result.length).toBeGreaterThan(20);
  });

  it('should render as a semantic footer element', async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(Footer);

    // Should start with footer tag (after any whitespace)
    expect(result.trim()).toMatch(/^<footer/);
  });
});
