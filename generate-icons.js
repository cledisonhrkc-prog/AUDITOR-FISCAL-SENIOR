import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

async function generate() {
  const publicDir = path.join(process.cwd(), 'public');
  const svgPath = path.join(publicDir, 'icon.svg');

  if (!fs.existsSync(svgPath)) {
    console.error('SVG icon not found at:', svgPath);
    process.exit(1);
  }

  try {
    console.log('Generating PWA icons...');
    
    await sharp(svgPath)
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'icon-192.png'));
    console.log('Successfully generated icon-192.png');

    await sharp(svgPath)
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'icon-512.png'));
    console.log('Successfully generated icon-512.png');

  } catch (err) {
    console.error('Error generating icons during build:', err);
  }
}

generate();
