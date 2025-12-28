import { describe, it, expect } from 'vitest';
import * as shared from '$lib/shared';

describe('lib/shared', () => {
  it('should export constants', () => {
    expect(shared.sizes).toBeDefined();
    expect(shared.elements).toBeDefined();
    expect(shared.dieSizes).toBeDefined();
    expect(shared.vision).toBeDefined();
    expect(shared.speeds).toBeDefined();
    expect(shared.swarmImmunities).toBeDefined();
    expect(shared.monsterTypes).toBeDefined();
    expect(shared.tags).toBeDefined();
    expect(shared.baseMonster).toBeDefined();
    expect(shared.monsterCalc).toBeDefined();
  });

  it('should have valid baseMonster defaults', () => {
    expect(shared.baseMonster.size).toBe('medium');
    expect(shared.baseMonster.hp).toBe(0);
  });
});
