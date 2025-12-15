import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, extname } from 'path';
import fm from 'front-matter';
import { stringify } from 'yaml';

const monsters = readdirSync('src/content/monsters').filter(
  (f) => extname(f) === '.md',
);
const images = readdirSync('public/images/monsters')
  .filter((f) => extname(f) === '.png')
  .map((i) => basename(i, '.png'));

// console.log(monsters);
// console.log(images);

for (const m of monsters) {
  const f = readFileSync(`src/content/monsters/${m}`, 'utf-8');
  const { attributes, body } = fm(f);
  if (attributes.image === '') {
    const bn = basename(m, '.md');
    if (images.includes(bn)) {
      attributes.image = `images/monsters/${bn}.png`;
      const output = `---\n${stringify(attributes)}---\n\n${body}`;
      writeFileSync(`src/content/monsters/${m}`, output);
    }
  }
}
