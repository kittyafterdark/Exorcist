import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const source = resolve('src/frontend.js');
const target = resolve('dist/frontend.js');
const code = await readFile(source, 'utf8');
if (!code.includes('export function setup(ctx)')) throw new Error('Missing Spindle setup export');
await writeFile(target, code, 'utf8');
console.log('Built', target);
