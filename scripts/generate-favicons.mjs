import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SOURCE_IMAGE = 'C:\\Users\\razak\\.gemini\\antigravity-ide\\brain\\e210e880-e14e-460c-89b0-53d25a6f03bf\\.user_uploaded\\media_1788567755560.png';
const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const SRC_APP_DIR = path.join(ROOT_DIR, 'src', 'app');

async function generate() {
  console.log('Reading source image from:', SOURCE_IMAGE);
  const inputBuffer = await fs.readFile(SOURCE_IMAGE);

  // 1. Generate 48x48 PNG
  const p48 = await sharp(inputBuffer)
    .resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await fs.writeFile(path.join(PUBLIC_DIR, 'favicon-48.png'), p48);
  console.log('Generated public/favicon-48.png');

  // 2. Generate 192x192 PNG
  const p192 = await sharp(inputBuffer)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await fs.writeFile(path.join(PUBLIC_DIR, 'favicon-192.png'), p192);
  console.log('Generated public/favicon-192.png');

  // 3. Generate 180x180 PNG (Apple touch icon)
  const p180 = await sharp(inputBuffer)
    .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await fs.writeFile(path.join(PUBLIC_DIR, 'apple-icon.png'), p180);
  console.log('Generated public/apple-icon.png');

  // 4. Generate 512x512 PNG
  const p512 = await sharp(inputBuffer)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await fs.writeFile(path.join(PUBLIC_DIR, 'icon.png'), p512);
  await fs.writeFile(path.join(PUBLIC_DIR, 'Chaina-Store-fav-icon.png'), p512);
  console.log('Generated public/icon.png & Chaina-Store-fav-icon.png');

  // 5. Generate favicon.ico (ICO format or 48x48 PNG as ICO)
  await fs.writeFile(path.join(PUBLIC_DIR, 'favicon.ico'), p48);
  console.log('Generated public/favicon.ico');

  // 6. Update src/app source icon files
  await fs.writeFile(path.join(SRC_APP_DIR, 'icon-source.png'), p512);
  console.log('Generated src/app/icon-source.png');

  console.log('All favicon assets updated successfully!');
}

generate().catch((err) => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});
