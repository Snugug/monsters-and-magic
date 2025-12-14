---
trigger: always_on
---

Available icons can be found in src/components/Sprite.astro. Use their id (without `icon--`) as the icon name for the Icon components (`src/components/Icon.svelte`).

If you cannot find an icon you need, you should add it to the sprite. To do so:

- Search for the relevant icon in the Google Material 3 icon set (https://github.com/google/material-design-icons). If there are multiple options, use the 24px sized one and the outlined style
- Add it to the sprite, removing any fill, height, or width attributes on the SVG
- Give it an id in the form of `icon--{name}` with `name` being slugified
