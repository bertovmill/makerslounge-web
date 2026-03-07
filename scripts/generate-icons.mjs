import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');

// The icon as an SVG string (no rounded corners - iOS adds them)
const iconSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#4A9FE5"/>
  <path d="M256 760V264l160 256 160-256v496" stroke="#faf9f7" stroke-width="72" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M672 760V264" stroke="#faf9f7" stroke-width="72" stroke-linecap="round"/>
  <path d="M672 760h96" stroke="#faf9f7" stroke-width="72" stroke-linecap="round"/>
</svg>`;

// Favicon SVG (with rounded corners for web)
const faviconSvg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="96" fill="#4A9FE5"/>
  <path d="M128 380V132l80 128 80-128v248" stroke="#faf9f7" stroke-width="36" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M336 380V132" stroke="#faf9f7" stroke-width="36" stroke-linecap="round"/>
  <path d="M336 380h48" stroke="#faf9f7" stroke-width="36" stroke-linecap="round"/>
</svg>`;

const sizes = [
  // iOS App Store
  { name: 'icon-1024.png', size: 1024 },
  // iOS home screen
  { name: 'apple-touch-icon.png', size: 180 },
  // PWA / Android
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-192.png', size: 192 },
  // Favicon
  { name: 'favicon-32.png', size: 32 },
  { name: 'favicon-16.png', size: 16 },
];

async function generate() {
  // Generate app icon PNGs (no rounded corners for iOS)
  for (const { name, size } of sizes) {
    const svg = name.startsWith('favicon') ? faviconSvg : iconSvg;
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(join(publicDir, name));
    console.log(`Generated ${name} (${size}x${size})`);
  }

  // Also generate the favicon SVG
  console.log('\nAll icons generated!');
}

generate().catch(console.error);
