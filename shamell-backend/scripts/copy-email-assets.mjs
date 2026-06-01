import { cpSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcFile = join(root, 'assets', 'email', '01_bailarina.png');
const destDir = join(root, 'dist', 'assets', 'email');
const destFile = join(destDir, '01_bailarina.png');

mkdirSync(destDir, { recursive: true });
cpSync(srcFile, destFile);
console.log(`Copied email logo to ${destFile}`);
