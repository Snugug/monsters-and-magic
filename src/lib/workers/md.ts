import * as Comlink from 'comlink';
import fm from 'front-matter';
import { stringify } from 'yaml';

Comlink.expose({
  parse: fm,
  compile(md: string, data: object) {
    const front = stringify(data);
    return `---\n${front}---\n\n${md}`;
  },
});
