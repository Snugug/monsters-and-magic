import post from 'posthtml';
import { postHTMLRefBuilder } from '$$lib/transforms/ref';

const plugins = [postHTMLRefBuilder];

export const posthtml = post(plugins);
