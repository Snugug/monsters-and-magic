import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../setup'; // Ensure setup runs

// Mock fetch
vi.stubGlobal('fetch', vi.fn());

// Mock Popover API if not present
if (!HTMLElement.prototype.showPopover) {
  HTMLElement.prototype.showPopover = vi.fn(function(this: HTMLElement) {
    this.setAttribute('popover-open', '');
    this.dispatchEvent(new Event('toggle', { bubbles: false, cancelable: false }));
  });
  HTMLElement.prototype.hidePopover = vi.fn(function(this: HTMLElement) {
    this.removeAttribute('popover-open');
    this.dispatchEvent(new Event('toggle', { bubbles: false, cancelable: false }));
  });
}

describe('TermReference.ts', () => {
  let TermReference: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    
    // We need to import the module to trigger custom element registration
    // If it was already imported, we might need to rely on that or reset modules
    // Since customElements.define throws if called twice with same name, we should check registry
    
    if (!customElements.get('ref-')) {
       await import('$components/TermReference');
    }
  });

  it('should be registered as a custom element', () => {
    expect(customElements.get('ref-')).toBeDefined();
    expect(customElements.get('s-ref')).toBeDefined();
  });

  it('should replace content with a button when cache is populated', async () => {
    // Setup fetch mock to return content
    (global.fetch as any).mockResolvedValue({
      status: 200,
      text: () => Promise.resolve('<div id="title">Term Title</div><div id="content"><p>Term description.</p></div>'),
    });

    const el = document.createElement('ref-');
    el.setAttribute('src', 'glossary/term');
    el.innerHTML = 'Term';
    document.body.appendChild(el);

    // Wait for async operations in connectedCallback
    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => setTimeout(resolve, 0));

    // Should have replaced content with button
    const button = el.querySelector('button.term-ref');
    expect(button).toBeTruthy();
    expect(button?.textContent).toBe('Term');
  });

  it('should create popover on click', async () => {
    (global.fetch as any).mockResolvedValue({
      status: 200,
      text: () => Promise.resolve('<div id="title">Term Title</div><div id="content"><p>Term description.</p></div>'),
    });

    const el = document.createElement('ref-');
    el.setAttribute('src', 'glossary/term-2');
    el.innerHTML = 'Term 2';
    document.body.appendChild(el);

    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => setTimeout(resolve, 0));

    const button = el.querySelector('button.term-ref') as HTMLButtonElement;
    expect(button).toBeTruthy();

    button.click();

    // Check if popover was created and appended to body
    const popover = document.body.querySelector('aside.term-popover');
    expect(popover).toBeTruthy();
    expect(popover?.textContent).toContain('Term Title');
    expect(popover?.textContent).toContain('Term description.');
  });
});
