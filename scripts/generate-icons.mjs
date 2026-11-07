/**
 * Generates the whole favicon / app-icon set from one vector mark.
 *
 * The previous icons were a downscale of a full-body photograph, which is
 * unreadable in a browser tab. This draws an "A" monogram in Champagne Gold
 * on Deep Plum — the two brand anchors — and rasterises every size the site
 * needs, including a multi-resolution .ico.
 *
 *   node scripts/generate-icons.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const PLUM = "#49283f";
const GOLD = "#c99a72";
const IVORY = "#f8f4ef";

const monogram = `
  <path d="M30 74 L50 28 L70 74" fill="none" stroke="${GOLD}" stroke-width="8"
        stroke-linecap="square" stroke-linejoin="miter"/>
  <path d="M39.5 60.5 L60.5 60.5" fill="none" stroke="${IVORY}" stroke-width="6.5"
        stroke-linecap="square"/>`;

/** Rounded-square mark. `bleed` fills the whole tile (Apple crops corners itself). */
function markSvg({ bleed = false } = {}) {
  const background = bleed
    ? `<rect width="100" height="100" fill="${PLUM}"/>`
    : `<rect width="100" height="100" rx="22" ry="22" fill="${PLUM}"/>`;
  const ring = bleed
    ? ""
    : `<rect x="3.5" y="3.5" width="93" height="93" rx="19" ry="19" fill="none"
             stroke="${GOLD}" stroke-width="1.6" opacity="0.55"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  ${background}${ring}${monogram}
</svg>`;
}

/** Circular variant, so the navbar's `rounded-full` crop looks deliberate. */
function circleSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <defs><clipPath id="c"><circle cx="50" cy="50" r="49"/></clipPath></defs>
  <g clip-path="url(#c)">
    <rect width="100" height="100" fill="${PLUM}"/>
    <circle cx="50" cy="50" r="45" fill="none" stroke="${GOLD}" stroke-width="1.6" opacity="0.55"/>
    ${monogram}
  </g>
</svg>`;
}

async function png(svg, size) {
  return sharp(Buffer.from(svg))
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** Builds a PNG-based .ico (understood by every browser since Vista). */
function ico(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);

  const dir = Buffer.alloc(16 * entries.length);
  let offset = 6 + dir.length;

  entries.forEach(({ size, data }, i) => {
    const base = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, base + 0);
    dir.writeUInt8(size >= 256 ? 0 : size, base + 1);
    dir.writeUInt8(0, base + 2); // palette size
    dir.writeUInt8(0, base + 3); // reserved
    dir.writeUInt16LE(1, base + 4); // colour planes
    dir.writeUInt16LE(32, base + 6); // bits per pixel
    dir.writeUInt32LE(data.length, base + 8);
    dir.writeUInt32LE(offset, base + 12);
    offset += data.length;
  });

  return Buffer.concat([header, dir, ...entries.map((e) => e.data)]);
}

const root = process.cwd();
const pub = path.join(root, "public");
const app = path.join(root, "src", "app");

await mkdir(path.join(pub, "brand"), { recursive: true });

const rounded = markSvg();
const bleed = markSvg({ bleed: true });

const writes = [
  [path.join(pub, "favicon-16x16.png"), await png(rounded, 16)],
  [path.join(pub, "favicon-32x32.png"), await png(rounded, 32)],
  [path.join(pub, "apple-touch-icon.png"), await png(bleed, 180)],
  [path.join(pub, "android-chrome-192x192.png"), await png(rounded, 192)],
  [path.join(pub, "android-chrome-512x512.png"), await png(rounded, 512)],
  [path.join(pub, "brand", "icon.png"), await png(circleSvg(), 512)],
  [path.join(app, "icon.png"), await png(rounded, 512)],
  [path.join(app, "apple-icon.png"), await png(bleed, 180)],
];

const icoEntries = [];
for (const size of [16, 32, 48]) {
  icoEntries.push({ size, data: await png(bleed, size) });
}
writes.push([path.join(pub, "favicon.ico"), ico(icoEntries)]);

for (const [file, data] of writes) {
  await writeFile(file, data);
  console.log(`wrote ${path.relative(root, file)} (${data.length} bytes)`);
}
