#!/usr/bin/env node
// Instax-style print PDF generator for Memory Press AR targets.
//
// Usage: node make-pdf.js -o "C:\path\out.pdf" photo1 [photo2 ...]
//
// Cards are exactly 4R (6x4 in) so cutting on the line yields a standard
// photo-print size. Landscape photos: two cards stacked per A4 portrait page.
// Portrait photos: one 4R portrait card per page (rare for this project).
// Images are only read, never copied. Print at 100% / Actual size.

const fs = require('fs');
const PDFDocument = require('pdfkit');

const A4 = { w: 595.28, h: 841.89 }; // points, portrait
const CARD = { w: 432, h: 288 }; // 4R landscape: 6in x 4in
const GAP = 24;

// Instax proportions: thin, even border on sides and top (fraction of card
// width — real Instax is ~4.2%); the photo fills the card width and ALL
// remaining height becomes the thick bottom chin. Wide (16:9) photos in a
// 3:2 card get a generous chin naturally, no cropping needed.
const BORDER = 0.042;
const MIN_CHIN = 0.1; // of card height — floor for squarer photos

function parseArgs(argv) {
  const images = [];
  let out = null;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '-o') out = argv[++i];
    else images.push(argv[i]);
  }
  if (!out || images.length === 0) {
    console.error('Usage: node make-pdf.js -o out.pdf photo1 [photo2 ...]');
    process.exit(1);
  }
  return { out, images };
}

const { out, images } = parseArgs(process.argv);

for (const img of images) {
  if (!fs.existsSync(img)) {
    console.error(`Not found: ${img}`);
    process.exit(1);
  }
}

const doc = new PDFDocument({ autoFirstPage: false });
doc.pipe(fs.createWriteStream(out));

function drawCard(img, info, cardX, cardY, cardW, cardH) {
  const aspect = info.width / info.height;
  const border = cardW * BORDER;
  // Fill the card width behind thin side borders; leftover height is chin.
  let photoW = cardW - 2 * border;
  let photoH = photoW / aspect;
  // Squarer/taller photos would eat the chin — shrink to keep a minimum
  // chin, centering horizontally (sides grow a little in that case).
  const maxPhotoH = cardH - border - cardH * MIN_CHIN;
  if (photoH > maxPhotoH) {
    photoH = maxPhotoH;
    photoW = photoH * aspect;
  }

  doc.rect(cardX, cardY, cardW, cardH).lineWidth(0.5).stroke('#d9d4cd');
  doc.image(img, cardX + (cardW - photoW) / 2, cardY + border, {
    width: photoW,
    height: photoH,
  });
}

const landscapeImgs = [];
for (const img of images) {
  const info = doc.openImage(img);
  if (info.width >= info.height) {
    landscapeImgs.push({ img, info });
  } else {
    // Portrait: one 4R portrait card per page.
    doc.addPage({ size: [A4.w, A4.h], margin: 0 });
    drawCard(img, info, (A4.w - CARD.h) / 2, (A4.h - CARD.w) / 2, CARD.h, CARD.w);
  }
}

// Landscape: two stacked 4R cards per A4 portrait page.
for (let i = 0; i < landscapeImgs.length; i += 2) {
  const pair = landscapeImgs.slice(i, i + 2);
  doc.addPage({ size: [A4.w, A4.h], margin: 0 });
  const totalH = pair.length * CARD.h + (pair.length - 1) * GAP;
  let y = (A4.h - totalH) / 2;
  for (const { img, info } of pair) {
    drawCard(img, info, (A4.w - CARD.w) / 2, y, CARD.w, CARD.h);
    y += CARD.h + GAP;
  }
}

doc.end();
console.log(`Wrote ${out}`);
