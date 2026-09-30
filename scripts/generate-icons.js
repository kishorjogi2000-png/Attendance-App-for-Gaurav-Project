import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Create Brand SVG Icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e3a8a" />
      <stop offset="50%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    <linearGradient id="glowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.2" />
    </linearGradient>
  </defs>
  <!-- Background Base -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />
  <circle cx="256" cy="256" r="210" fill="url(#glowGrad)" />

  <!-- Shield / Security Base -->
  <path d="M256 90 L380 140 V240 C380 325 325 395 256 422 C187 395 132 325 132 240 V140 Z" fill="#ffffff" opacity="0.15" />
  <path d="M256 110 L360 152 V235 C360 306 314 366 256 392 C198 366 152 306 152 235 V152 Z" fill="#ffffff" />
  
  <!-- Fingerprint / Time Attendance / Face ID Hybrid Motif -->
  <!-- Checkmark Badge -->
  <circle cx="256" cy="250" r="82" fill="#2563eb" />
  <path d="M222 250 L246 274 L294 226" fill="none" stroke="#ffffff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" />
  
  <!-- Clock ticks / Attendance ring -->
  <circle cx="256" cy="250" r="105" fill="none" stroke="#60a5fa" stroke-width="6" stroke-dasharray="12 10" />
  
  <!-- Bottom Pill Label -->
  <rect x="156" y="328" width="200" height="38" rx="19" fill="#1e3a8a" />
  <text x="256" y="353" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="800" fill="#38bdf8" text-anchor="middle" letter-spacing="2">ATTENDANCE</text>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');

// Function to generate a PNG buffer using pure Node.js + zlib
function generateSolidPng(width, height, r, g, b) {
  // Simple CRC32 table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c >>> 0;
  }

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function writeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crc = crc32(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 2; // Color type: 2 (Truecolor RGB)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = writeChunk('IHDR', ihdrData);

  // Raw image scanlines
  // Each scanline begins with filter type 0, followed by width * 3 bytes (RGB)
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const rOuter = width * 0.46;
  const rInner = width * 0.22;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < rInner) {
        // Inner checkmark / core: Bright Blue/White
        rawData[pxOffset] = 255;
        rawData[pxOffset + 1] = 255;
        rawData[pxOffset + 2] = 255;
      } else if (dist < rOuter) {
        // Shield body: Royal Blue gradient
        const t = y / height;
        rawData[pxOffset] = Math.floor(30 * (1 - t) + 14 * t);
        rawData[pxOffset + 1] = Math.floor(58 * (1 - t) + 165 * t);
        rawData[pxOffset + 2] = Math.floor(138 * (1 - t) + 233 * t);
      } else {
        // Outer background: Deep Navy
        rawData[pxOffset] = r;
        rawData[pxOffset + 1] = g;
        rawData[pxOffset + 2] = b;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = writeChunk('IDAT', compressed);
  const iendChunk = writeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate Icons
console.log('Generating PWA Icons...');
const pwa192 = generateSolidPng(192, 192, 30, 58, 138);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);

const pwa512 = generateSolidPng(512, 512, 30, 58, 138);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);

// Maskable icon has 15% extra padding around the content
const pwaMaskable512 = generateSolidPng(512, 512, 15, 23, 42);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwaMaskable512);

const appleTouchIcon = generateSolidPng(180, 180, 30, 58, 138);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouchIcon);

fs.writeFileSync(path.join(publicDir, 'favicon.ico'), pwa192);

console.log('PWA Icons successfully generated in /public!');
