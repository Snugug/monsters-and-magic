import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import Search from '$components/Search.svelte';

// Mock Pagefind
const mockPagefind = {
  options: vi.fn(),
  init: vi.fn(),
  search: vi.fn(),
};

// Mock dynamic import
vi.mock('/pagefind/pagefind.js', () => ({
  default: mockPagefind,
  ...mockPagefind
}));

describe('Search.svelte', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPagefind.search.mockResolvedValue({ results: [] });
  });

  async function waitForPagefind() {
    await waitFor(() => {
      expect(mockPagefind.init).toHaveBeenCalled();
    }, { timeout: 1000 });
  }

  it('should render search input', () => {
    const { container } = render(Search);
    const input = container.querySelector('input[name="search"]');
    expect(input).toBeTruthy();
  });

  it('should initialize pagefind on mount', async () => {
    render(Search);
    await waitForPagefind();
    expect(mockPagefind.options).toHaveBeenCalled();
  });

  it('should update results on input', async () => {
    mockPagefind.search.mockResolvedValue({
      results: [
        {
          id: '1',
          data: async () => ({
            url: '/test',
            meta: { title: 'Test Result' },
            excerpt: 'Test content'
          })
        }
      ]
    });

    const { container } = render(Search);
    await waitForPagefind();

    const input = container.querySelector('input[name="search"]') as HTMLInputElement;
    
    await fireEvent.input(input, { target: { value: 'test' } });
    
    // Wait for effect
    await waitFor(() => {
      const results = container.querySelector('.results');
      expect(results).toBeTruthy();
      expect(results?.textContent).toContain('Test Result');
    });
  });

  it('should clear results on escape key', async () => {
    const { container } = render(Search);
    await waitForPagefind();

    const input = container.querySelector('input[name="search"]') as HTMLInputElement;
    
    // Set value
    await fireEvent.input(input, { target: { value: 'test' } });
    
    // Focus the input so Escape clears it
    input.focus();
    
    // Press Escape
    await fireEvent.keyUp(input, { key: 'Escape' });
    
    // Wait for effect
    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('should focus input on escape key if not focused', async () => {
    const { container } = render(Search);
    await waitForPagefind();

    const input = container.querySelector('input[name="search"]') as HTMLInputElement;
    const button = container.querySelector('button') as HTMLButtonElement;
    
    // Focus button (or body)
    button.focus();
    
    // Press Escape on button (since it also has onkeyup={clear})
    await fireEvent.keyUp(button, { key: 'Escape' });
    
    // Should focus input
    expect(document.activeElement).toBe(input);
  });

  it('should submit form and redirect', async () => {
    // Mock window.location
    const originalLocation = window.location;
    delete (window as any).location;
    (window as any).location = { ...originalLocation, toString: () => 'http://localhost/' };

    const { container } = render(Search);
    await waitForPagefind();

    const form = container.querySelector('form') as HTMLFormElement;
    const input = container.querySelector('input[name="search"]') as HTMLInputElement;
    
    // Set value so `looked` is updated
    await fireEvent.input(input, { target: { value: 'query' } });
    
    // Wait for search result promise to resolve so `looked` state is updated
    // pagefind.search is async
    await waitFor(() => {
        expect(mockPagefind.search).toHaveBeenCalledWith('query');
    });
    // Wait a bit more for state update
    await new Promise(resolve => setTimeout(resolve, 10));

    await fireEvent.submit(form);
    
    // Restore
    window.location = originalLocation;
  });
});
