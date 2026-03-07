import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const splashDir = join(root, 'ios/App/App/Assets.xcassets/Splash.imageset');

const svg = `<svg width="2732" height="2732" viewBox="0 0 2732 2732" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="2732" height="2732" fill="#faf9f7"/>
  <g transform="translate(1110, 1166)">
    <path d="M0 240V0l80 128 80-128v240" stroke="#4A9FE5" stroke-width="36" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M208 240V0" stroke="#4A9FE5" stroke-width="36" stroke-linecap="round"/>
    <path d="M208 240h48" stroke="#4A9FE5" stroke-width="36" stroke-linecap="round"/>
  </g>
</svg>`;

const buf = Buffer.from(svg);

await sharp(buf).resize(2732, 2732).png().toFile(join(splashDir, 'splash-2732x2732.png'));
await sharp(buf).resize(2732, 2732).png().toFile(join(splashDir, 'splash-2732x2732-1.png'));
await sharp(buf).resize(2732, 2732).png().toFile(join(splashDir, 'splash-2732x2732-2.png'));
console.log('Splash screens generated!');
