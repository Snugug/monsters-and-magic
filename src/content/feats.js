import matter from 'gray-matter';
import fs from 'fs';
import path from 'path';
import slugify from 'slugify';

const files = fs
  .readdirSync('./classes')
  .filter((f) => ['.md', '.mdx'].includes(path.extname(f)))
  .map((m) => {
    const f = matter(fs.readFileSync(`./classes/${m}`, 'utf-8'));
    let { feats } = f.data;

    feats.map((ft) => (ft.class = m.replace(/\.md(x?)$/, '')));

    for (const feat of feats) {
      const body = feat.description;
      delete feat.description;
      const output = matter.stringify(body, feat);
      const url = `./feats/${slugify(feat.title, {
        lower: true,
      })}.md`;
      fs.writeFileSync(url, output);
    }

    delete f.data.feats;

    fs.writeFileSync(`./classes/${m}`, matter.stringify(f.content, f.data));

    return f;
  });

// console.log(files);
