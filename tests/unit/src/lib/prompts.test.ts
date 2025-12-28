import { describe, it, expect } from 'vitest';
import { CREATURE_PROMPT } from '$lib/prompts';

describe('lib/prompts', () => {
  it('should export CREATURE_PROMPT string', () => {
    expect(typeof CREATURE_PROMPT).toBe('string');
    expect(CREATURE_PROMPT.length).toBeGreaterThan(0);
    expect(CREATURE_PROMPT).toContain('<system_instruction>');
  });
});
