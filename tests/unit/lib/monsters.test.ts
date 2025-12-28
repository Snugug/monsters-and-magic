import { describe, it, expect } from 'vitest';
import { calculatePoints, dieTotal, damageStep } from '$lib/monsters';
import { baseMonster } from '$lib/shared';

// Mock Data
const mockTraits: any[] = [
  { id: 'trait1', points: 1 },
  { id: 'trait-no-points', points: undefined },
];
const mockFeats: any[] = [
  { id: 'feat1', rare: false },
  { id: 'featRare', rare: true },
];
const mockWeapons: any[] = [
  { id: 'dagger', damage: '1d4' },
  { id: 'sword', damage: '1d8' },
];
const mockArmor: any[] = [
  { id: 'shield', ac: 1, type: 'shield' },
  { id: 'plate', ac: 5, type: 'heavy' },
  { id: 'leather', ac: 1, type: 'light' },
  { id: 'chain', ac: 3, type: 'medium' },
];
const mockTechniques: any[] = [{ id: 'tech1', rare: false }];
const mockCharms: any[] = [
  { id: 'charm1', rare: false },
  { id: 'armor', rare: false },
];

const calculate = calculatePoints(
  mockTraits as any,
  mockFeats as any,
  mockWeapons as any,
  mockArmor as any,
  mockTechniques as any,
  mockCharms as any,
);

describe('lib/monsters', () => {
  it('should calculate defaults for base monster', () => {
    const monster = structuredClone(baseMonster);
    const res = calculate(monster);
    expect(res.hp).toBe(10);
    expect(res.ac).toBe(1);
    expect(res.points).toBe(0);
    expect(res.cr).toBe(0);
  });

  it('should adjust for Size', () => {
    const tiny = structuredClone(baseMonster);
    tiny.size = 'tiny';
    const tVal = calculate(tiny);
    expect(tVal.speed.walking).toBe(30);
    expect(tVal.hp).toBe(6);
    expect(tVal.points).toBe(1);
    expect(tVal.cr).toBe(0);

    const huge = structuredClone(baseMonster);
    huge.size = 'huge';
    const hVal = calculate(huge);
    expect(hVal.hp).toBe(14);
    expect(hVal.points).toBe(-1);
    expect(hVal.cr).toBe(0);

    const garg = structuredClone(baseMonster);
    garg.size = 'gargantuan';
    const gVal = calculate(garg);
    expect(gVal.hp).toBe(20);
    expect(gVal.points).toBe(-1);
    expect(gVal.cr).toBe(0);

    const small = structuredClone(baseMonster);
    small.size = 'small';
    const sVal = calculate(small);
    expect(sVal.hp).toBe(8);
    expect(sVal.points).toBe(0);
    expect(sVal.cr).toBe(0);

    const large = structuredClone(baseMonster);
    large.size = 'large';
    const lVal = calculate(large);
    expect(lVal.hp).toBe(12);
    expect(lVal.points).toBe(-1);
    expect(lVal.cr).toBe(0);
  });

  it('should calculate Swarm', () => {
    const swarm = structuredClone(baseMonster);
    swarm.swarm = 'medium';
    const val = calculate(swarm);
    expect(val.tags).toContain('Swarm');
    expect(val.points).toBe(5);
    expect(val.cr).toBe(0);
  });

  it('should calculate Vision points', () => {
    const m = structuredClone(baseMonster);
    m.vision = [
      'low-light vision',
      'darkvision',
      'blindsight',
      'tremmorsense',
      'truesight',
    ];
    m.blindsight = 10;
    m.tremmorsense = 20;
    m.truesight = 30;
    const val = calculate(m);
    expect(val.points).toBe(12);
    expect(val.cr).toBe(1);
  });

  it('should calculate Movement points and tags', () => {
    const m = structuredClone(baseMonster);
    m.speeds = ['flying', 'climbing', 'swimming', 'burrowing'];
    m.flying = 30;
    m.climbing = 30;
    m.swimming = 30;
    m.burrowing = 30;
    const val = calculate(m);
    expect(val.tags).toContain('flying');
    expect(val.tags).toContain('climbing');
    expect(val.tags).toContain('swimming');
    expect(val.tags).toContain('burrowing');
    expect(val.points).toBe(7);

    m.walking = 60;
    const fast = calculate(m);
    expect(fast.tags).toContain('fast');
    expect(fast.points).toBe(10);

    m.walking = 0;
    const slow = calculate(m);
    expect(slow.tags).toContain('slow');
    expect(slow.points).toBe(4);
  });

  it('should calculate Offense Stats', () => {
    const m = structuredClone(baseMonster);
    m.savage = 1;
    m.strong = 1;
    m.energetic = 1;
    m.conditioned = 1;
    m.spicy = 'fire';
    m.radiates = 'fire';

    const val = calculate(m);
    expect(val.tags).toContain('savage');
    expect(val.tags).toContain('strong');
    expect(val.tags).toContain('energetic');
    expect(val.tags).toContain('conditioned');
    expect(val.tags).toContain('spicy');
    expect(val.tags).toContain('radiates');
    expect(val.points).toBe(16);

    const weak = structuredClone(baseMonster);
    weak.strong = -1;
    const weakVal = calculate(weak);
    expect(weakVal.tags).toContain('weak');
    expect(weakVal.points).toBe(-1);
  });

  it('should calculate Weapons and Natural Weapons', () => {
    const m = structuredClone(baseMonster);
    m.weapons = ['sword', 'dagger'];
    m.naturalWeapons = [
      {
        name: 'Bite',
        damage: '1d12',
        range: 5,
        element: 'physical',
        properties: [],
        mastery: '',
      },
    ];

    const val = calculate(m);
    expect(val.tags).toContain('armed');
    expect(val.tags).toContain('vicious');
    expect(val.points).toBe(3);

    m.weapons = ['dagger']; // 1d4
    m.naturalWeapons = [];
    m.size = 'huge';
    const timid = calculate(m);
    expect(timid.tags).toContain('timid');
    expect(timid.points).toBe(-2);
  });

  it('should calculate Attacks points (coverage for branches)', () => {
    const m = structuredClone(baseMonster);
    m.attacks = [
      {
        name: 'Fatigue Heavy',
        damage: '1d8',
        ap: 1,
        fatigue: 10,
      } as any,
      {
        name: 'Threaded Only',
        ap: 3,
        thread: true,
        fatigue: 0,
      } as any,
      {
        name: 'Recharge 1d4',
        ap: 3,
        recharge: '1d4',
        fatigue: 0,
      } as any,
      {
        name: 'Recharge 1d8',
        ap: 3,
        recharge: '1d8',
        fatigue: 0,
      } as any,
      {
        name: 'Recharge 1d10',
        ap: 3,
        recharge: '1d10',
        fatigue: 0,
      } as any,
      {
        name: 'Recharge Thread',
        ap: 3,
        recharge: '1d6',
        thread: true,
        fatigue: 0,
      } as any,
      {
        name: 'Condition Attack',
        ap: 1,
        condition: 'Prone',
        fatigue: 0,
      } as any,
    ];

    const val = calculate(m);
    expect(val.points).toBe(1);
    expect(Number.isNaN(val.points)).toBe(false);
  });

  it('should calculate Training and Traits', () => {
    const m = structuredClone(baseMonster);
    m.type = 'humanoid';
    m.lineage = 'human';
    m.traits = ['trait1'];
    m.feats = ['feat1', 'featRare'];
    m.techniques = ['tech1'];
    m.cantrips = ['c1'];
    m.charms = ['charm1'];

    const val = calculate(m);
    expect(val.tags).toContain('skilled');
    expect(val.tags).toContain('trained');
    expect(val.tags).toContain('advanced caster');
    expect(val.points).toBe(14);

    const caster = structuredClone(baseMonster);
    caster.cantrips = ['c1'];
    const casterVal = calculate(caster);
    expect(casterVal.tags).toContain('caster');
    expect(casterVal.points).toBe(1);
  });

  it('should calculate Defense (Armor, HP, Resistances)', () => {
    const m = structuredClone(baseMonster);
    m.armor = [{ id: 'plate' }] as any;
    m.cunning = 2;
    // calculate(m) -> covered elsewhere

    const med = structuredClone(baseMonster);
    med.armor = [{ id: 'chain' }] as any;
    med.cunning = 3;
    const medVal = calculate(med);
    expect(medVal.ac).toBeGreaterThan(1);
    expect(medVal.points).toBe(10);

    const light = structuredClone(baseMonster);
    light.armor = [{ id: 'leather' }] as any;
    light.cunning = 3;
    const lightVal = calculate(light);
    expect(lightVal.ac).toBe(4);
    expect(lightVal.points).toBe(6);

    const resM = structuredClone(baseMonster);
    resM.resistance = ['physical'];
    const resVal = calculate(resM);
    expect(resVal.tags).toContain('thick-skinned');
    expect(resVal.points).toBe(3);

    const eleRes = structuredClone(baseMonster);
    eleRes.resistance = ['fire'];
    const eleVal = calculate(eleRes);
    expect(eleVal.tags).toContain('resistant');
    expect(eleVal.points).toBe(2);

    const incorp = structuredClone(baseMonster);
    incorp.immunity = ['poison'];
    incorp.incorporeal = true;
    const incVal = calculate(incorp);
    expect(incVal.tags).not.toContain('immune');
    expect(incVal.points).toBe(6);

    const vulM = structuredClone(baseMonster);
    vulM.vulnerable = ['cold'];
    const valVul = calculate(vulM);
    expect(valVul.tags).toContain('vulnerable');
    expect(valVul.points).toBe(-1); // Points(1) = 1. Subtracted. -1.

    const absM = structuredClone(baseMonster);
    absM.absorbent = ['lightning'];
    const valAbs = calculate(absM);
    expect(valAbs.tags).toContain('absorbent');
    expect(valAbs.points).toBe(6); // Points(1,6) = 6.

    const condM = structuredClone(baseMonster);
    condM.conditions = ['prone'];
    const valCond = calculate(condM);
    expect(valCond.tags).toContain('resilient');
    expect(valCond.points).toBe(3); // Points(1,3) = 3.
  });

  it('should calculate Armored property combined with Armor items', () => {
    const m = structuredClone(baseMonster);
    m.armor = [{ id: 'leather' }] as any;
    m.armored = 1;
    const val = calculate(m);
    expect(val.ac).toBe(3);
    expect(val.points).toBe(4);

    const monk = structuredClone(baseMonster);
    monk.armor = [];
    monk.armored = 2;
    const monkVal = calculate(monk);
    expect(monkVal.tags).toContain('armored');
    expect(monkVal.points).toBe(4);
  });

  it('should calculate Armor Charm', () => {
    const m = structuredClone(baseMonster);
    m.armor = [{ id: 'shield' }] as any;
    m.cunning = 1;
    m.spellcasting = 'power';
    m.power = 2;
    m.charms = [{ id: 'armor' }] as any;

    const val = calculate(m);
    expect(val.armorCharm).toBe(true);
    expect(val.ac).toBe(3);
    expect(val.points).toBe(8);
  });

  it('should handle special HP modifications (Stout/Frail)', () => {
    const m = structuredClone(baseMonster);
    m.hp = 1;
    const stout = calculate(m);
    expect(stout.tags).toContain('stout');
    expect(stout.points).toBe(1);

    m.hp = -1;
    const frail = calculate(m);
    expect(frail.tags).toContain('frail');
    expect(frail.points).toBe(-1);
  });

  it('should handle Ancient', () => {
    const m = structuredClone(baseMonster);
    m.ancient = true;
    const val = calculate(m);
    expect(val.ap).toBeGreaterThan(3);
    expect(val.points).toBe(4);
  });

  it('should explicitly cover line 361 (Exposed) and 392 (Immune)', () => {
    const exposedM = structuredClone(baseMonster);
    exposedM.armor = [];
    exposedM.cunning = 10;
    exposedM.armored = -2;
    const exposedVal = calculate(exposedM);
    expect(exposedVal.tags).toContain('exposed');
    expect(exposedVal.ac).toBe(8);
    expect(exposedVal.points).toBe(14);

    const immuneM = structuredClone(baseMonster);
    immuneM.immunity = ['fire'];
    immuneM.incorporeal = false;
    const immuneVal = calculate(immuneM);
    expect(immuneVal.tags).toContain('immune');
    expect(immuneVal.points).toBe(5);
  });

  it('should cover CR < 0 adjustment (line 425)', () => {
    const m = structuredClone(baseMonster);
    m.size = 'tiny';
    m.vulnerable = ['fire', 'cold', 'acid', 'lightning'];
    m.power = -2;
    m.cunning = -2;
    const val = calculate(m);
    expect(val.cr).toBe(0);
    expect(val.points).toBe(-15);
  });

  describe('Branch Coverage Edge Cases', () => {
    it('should cover Medium size (switch default)', () => {
      const m = structuredClone(baseMonster);
      m.size = 'medium';
      const val = calculate(m);
      expect(val.speed.walking).toBe(30);
      expect(val.reach).toBe(5);
      expect(val.points).toBe(0);
    });

    it('should handle Humanoid logic branches', () => {
      const m = structuredClone(baseMonster);
      m.type = 'humanoid';
      m.lineage = 'human';
      m.traits = [];
      calculate(m);

      const m2 = structuredClone(baseMonster);
      m2.type = 'humanoid';
      m2.lineage = '';
      m2.traits = ['trait1'];
      calculate(m2);
    });

    it('should handle Missing Reference Data (find returns undefined)', () => {
      const m = structuredClone(baseMonster);
      m.traits = ['non-existent-trait'];
      m.weapons = ['non-existent-weapon'];
      m.armor = [{ id: 'non-existent-armor' }] as any;
      m.techniques = ['non-existent-tech'];
      m.feats = ['non-existent-feat'];
      const val = calculate(m);
      expect(val.points).toBe(4);
    });

    it('should handle Attack Damage branches', () => {
      const m = structuredClone(baseMonster);
      m.attacks = [
        {
          name: 'No Damage Attack',
          ap: 1,
          damage: '',
          fatigue: 0,
        } as any,
        {
          name: 'Fatigue Exact Half',
          ap: 1,
          damage: '1d6',
          fatigue: 1,
        } as any,
      ];
      const val = calculate(m);
      expect(val.points).toBe(5);
    });

    it('should test points() helper function branches', () => {
      const m = structuredClone(baseMonster);
      m.vision = ['blindsight'];
      m.blindsight = 0;
      const val0 = calculate(m);
      expect(val0.points).toBe(0);

      const slowM = structuredClone(baseMonster);
      slowM.walking = 20;
      const valWithneg = calculate(slowM);
      expect(valWithneg.tags).toContain('slow');
      expect(valWithneg.points).toBe(-1);
    });

    it('should handle Multiple Natural Weapons (vmax sorting branches)', () => {
      const m = structuredClone(baseMonster);
      m.naturalWeapons = [
        { name: 'Small', damage: '1d4' },
        { name: 'Big', damage: '1d12' },
        { name: 'Medium', damage: '1d8' },
      ] as any;
      const val = calculate(m);
      expect(val.tags).toContain('vicious');
      expect(val.points).toBe(3);
    });

    it('should handle Invalid Recharge and implicit else chains', () => {
      const m = structuredClone(baseMonster);
      m.attacks = [
        {
          name: 'Invalid Recharge',
          ap: 1,
          recharge: '5-6',
          fatigue: 0,
        } as any,
      ];
      const val = calculate(m);
      expect(val.points).toBe(3);
    });

    it('should handle Peaceful Monster (vmax IS null)', () => {
      const m = structuredClone(baseMonster);
      m.weapons = [];
      m.naturalWeapons = [];
      m.attacks = [];
      const val = calculate(m);
      expect(val.tags).not.toContain('vicious');
      expect(val.tags).not.toContain('timid');
      expect(val.points).toBe(0);
    });

    it('should handle HP fallthrough (Safe implicit else)', () => {
      const m = structuredClone(baseMonster);
      m.hp = NaN;
      const val = calculate(m);
      expect(val.tags).not.toContain('frail');
      expect(val.tags).not.toContain('stout');
      expect(val.points).toBe(2);
    });

    it('should handle Strong = NaN (Unreachable implicit else coverage)', () => {
      const m = structuredClone(baseMonster);
      m.strong = NaN;
      const val = calculate(m);
      expect(val.tags).not.toContain('strong');
      expect(val.tags).not.toContain('weak');
      expect(val.points).toBe(2);
    });

    it('should handle Trait with undefined points (Line 87 || 0 branch)', () => {
      const m = structuredClone(baseMonster);
      m.type = 'humanoid';
      m.lineage = 'human';
      m.traits = ['trait-no-points'];
      const val = calculate(m);
      expect(val.points).toBe(0);
    });
  });

  describe('CR Calculation', () => {
    // Formula: CR = Math.ceil((points - 7) / 10)
    // CR 0 if points <= 7 (due to clamp).
    // CR 1 = 8..17 points. (8-7)/10 = 0.1 -> ceil 1. (17-7)/10 = 1 -> ceil 1.
    // CR 2 = 18..27 points.

    it('should calculate CR 0 (Points <= 7)', () => {
      const m = structuredClone(baseMonster);
      m.strong = 7; // Adds 7 points. Total 7.
      const val = calculate(m);
      expect(val.points).toBe(7);
      expect(val.cr).toBe(0);
    });

    it('should calculate CR 1 (Points 8-17)', () => {
      // Lower Bound
      const mMin = structuredClone(baseMonster);
      mMin.strong = 8;
      const valMin = calculate(mMin);
      expect(valMin.points).toBe(8);
      expect(valMin.cr).toBe(1);

      // Upper Bound
      const mMax = structuredClone(baseMonster);
      mMax.strong = 17;
      const valMax = calculate(mMax);
      expect(valMax.points).toBe(17);
      expect(valMax.cr).toBe(1);
    });

    it('should calculate CR 2 (Points 18-27)', () => {
      // Lower Bound
      const mMin = structuredClone(baseMonster);
      mMin.strong = 18;
      const valMin = calculate(mMin);
      expect(valMin.points).toBe(18);
      expect(valMin.cr).toBe(2);

      // Upper Bound
      const mMax = structuredClone(baseMonster);
      mMax.strong = 27;
      const valMax = calculate(mMax);
      expect(valMax.points).toBe(27);
      expect(valMax.cr).toBe(2);
    });

    it('should calculate CR 3 (Points 28)', () => {
      const m = structuredClone(baseMonster);
      m.strong = 28;
      const val = calculate(m);
      expect(val.points).toBe(28);
      expect(val.cr).toBe(3);
    });

    it('should calculate High CR (CR 10: 98-107, CR 20: 198-207)', () => {
      // CR 10
      const m10 = structuredClone(baseMonster);
      m10.strong = 100; // (100-7)/10 = 9.3 -> ceil 10.
      const val10 = calculate(m10);
      expect(val10.points).toBe(100);
      expect(val10.cr).toBe(10);

      // CR 20 check
      const m20 = structuredClone(baseMonster);
      m20.strong = 200; // (200-7)/10 = 19.3 -> ceil 20.
      const val20 = calculate(m20);
      expect(val20.points).toBe(200);
      expect(val20.cr).toBe(20);
    });
  });

  describe('helpers', () => {
    it('should calculate dieTotal', () => {
      expect(dieTotal('1d6')).toBe(6);
      expect(dieTotal('2d8')).toBe(16);
      expect(dieTotal('5')).toBe(5);
    });

    it('should calculate damageStep', () => {
      expect(damageStep('1d4')).toBeGreaterThanOrEqual(0);
      expect(damageStep('1d12')).toBeGreaterThan(damageStep('1d4'));
    });
  });
});
