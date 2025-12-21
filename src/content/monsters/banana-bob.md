---
title: Banana Bob
size: gargantuan
swarm: false
type: humanoid
image: images/monsters/banana-bob.png
focus: 5
power: 3
cunning: 4
luck: 0
spellcasting: luck
lineage: elf
traits:
  - fey-touched
feats:
  - rage
weapons:
  - greataxe
  - hand-crossbow
  - rapier
armor:
  - half-plate-armor
  - shield
vision:
  - low-light vision
  - blindsight
  - truesight
blindsight: 20
tremmorsense: 10
truesight: 10
speeds:
  - flying
walking: 10
flying: 70
climbing: 0
swimming: 0
burrowing: 0
savage: 1
strong: 1
energetic: 1
conditioned: 1
spicy: fatigue
radiates: radiant
naturalWeapons:
  - name: Fist
    damage: 2d8
    type: physical
    element: necrotic
    ranged: true
    range: 30
  - name: Tail
    damage: 1d6
    element: physical
    ranged: false
    properties:
      - agile
      - reach
    mastery: graze
attacks:
  - name: Test Attack Action
    type: attack
    damage: 1d6
    element: acid
    condition: Frightened
    ap: 3
    fatigue: 2
    trigger: ""
    recharge: 1d8
    thread: true
    description: Do A Thing
    ability: power
    range: 30
  - name: And A Save
    type: focus
    damage: 1d6
    element: physical
    condition: Unconscious
    ap: 1
    fatigue: 0
    trigger: ""
    recharge: ""
    thread: false
    description: A Thing
    ability: focus
  - name: Shield
    type: reaction
    damage: ""
    element: ""
    condition: Protected
    ap: 1
    fatigue: 0
    trigger: Hit by damage
    recharge: ""
    thread: false
    description: Look at me now
    ability: cunning
  - name: The Attack
    type: attack
    damage: 1d6
    element: force
    condition: ""
    ap: 2
    fatigue: 1
    trigger: ""
    recharge: ""
    thread: true
    description: Do a normal attack
    ability: luck
  - name: Oh No
    type: cunning
    damage: ""
    element: ""
    condition: Blinded
    ap: 1
    fatigue: 0
    trigger: ""
    recharge: ""
    thread: false
    description: Save or Suck
    ability: power
  - name: Go Fast
    type: other
    damage: 1d6
    element: ""
    condition: Quickened
    ap: 1
    fatigue: 0
    trigger: ""
    recharge: 1d10
    thread: false
    description: Go Fast Go Far
    ability: power
techniques:
  - brother-sister
cantrips:
  - lightning-lasso
charms:
  - counterspell
upcast: 0
hp: 4
armored: 3
resistance:
  - physical
immunity:
  - necrotic
vulnerable:
  - fire
absorbent:
  - force
conditions:
  - doomed
aggressive: false
amorphous: false
ancient: true
amphibious: false
aquatic: false
bloodthirsty: true
burden: false
draining: false
escape: false
flyby: false
grappler: false
illuminated: false
reach: false
jumper: false
lair: false
legendary: true
pack: false
unrelenting: true
undying: false
bursting: false
regeneration: false
extraplanar: false
occupier: false
freediver: false
icewalker: false
immutable: false
incorporeal: false
matana: false
webwalker: false
climber: false
tunneler: false
photophobic: false
siege: false
abduct: false
mastery: true
vicious: 0
elemental: ""
---

A Ranger's companion that takes the form of a medium sea creature
