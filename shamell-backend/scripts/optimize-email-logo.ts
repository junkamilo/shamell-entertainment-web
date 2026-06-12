/**
 * Resize and compress the embedded email logo asset.
 * Usage: npx ts-node scripts/optimize-email-logo.ts
 */
import { writeFileSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

const TARGET_WIDTH = 140;
const LOGO_PATH = join(process.cwd(), 'assets', 'email', '01_bailarina.png');

async function main() {
  const optimized = await sharp(LOGO_PATH)
    .resize(TARGET_WIDTH)
    .png({ compressionLevel: 9, palette: true, quality: 80 })
    .toBuffer();

  writeFileSync(LOGO_PATH, optimized);
  console.log(`Optimized ${LOGO_PATH} (${optimized.length} bytes)`);
}

void main();
