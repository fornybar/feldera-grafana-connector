import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  }))).flat();
}

const tests = (await files('src')).filter((path) => /\.(test|spec)\.[jt]sx?$/.test(path));
const focused = [];
for (const path of tests) {
  const text = await readFile(path, 'utf8');
  if (/\b(?:describe|it|test)\.only\s*\(/.test(text)) {
    focused.push(path);
  }
}
if (focused.length) {
  console.error(`Focused tests prohibited in CI:\n${focused.join('\n')}`);
  process.exit(1);
}
