#!/usr/bin/env node
/**
 * WCAG 2.1 AA / AAA Contrast Verification for Dermavia Ethereal Design Tokens
 * Checks luminance and contrast ratios against WCAG 2.1 standards:
 * - Normal text: minimum 4.5:1 (AA), 7.0:1 (AAA)
 * - Large text & UI components: minimum 3.0:1 (AA), 4.5:1 (AAA)
 */

function lum(hex) {
  const c = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(c.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(fg, bg) {
  const [l1, l2] = [lum(fg), lum(bg)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

const tokens = {
  // Storefront CSS Tokens
  ink: '#231a15',
  inkSoft: '#584a3e',
  muted: '#55493e',
  cream: '#f6f1e8',
  paper: '#fffdf8',
  parchment: '#f4efe6',
  cosmic950: '#0c132b',
  cosmic900: '#152147',
  heroIvory: '#fffbf2',
  heroChampagne: '#f4d996',
  goldDeep: '#855e1c',
  goldRich: '#c29340',
  success: '#24523c',
  danger: '#8d2e28',

  // DTCG 2025.10 Tokens
  dtcgInk: '#492E22',
  dtcgMuted: '#705649',
  dtcgCanvas: '#F7F0E9',
  dtcgPaper: '#FAF7F3',
  dtcgAction: '#7A4B60',
  dtcgSuccess: '#276749',
  dtcgDanger: '#A12B2B',
  dtcgDarkCanvas: '#211B1A',
  dtcgDarkSurface: '#302624',
};

const checks = [
  // Storefront Light Theme (Warm Clinical Cream/Parchment)
  { name: 'Primary Ink on Cream Canvas', fg: 'ink', bg: 'cream', min: 4.5, target: 'AA' },
  { name: 'Primary Ink on Paper Card', fg: 'ink', bg: 'paper', min: 4.5, target: 'AA' },
  { name: 'Primary Ink on Parchment Surface', fg: 'ink', bg: 'parchment', min: 4.5, target: 'AA' },
  { name: 'Soft Ink (Body copy) on Paper', fg: 'inkSoft', bg: 'paper', min: 4.5, target: 'AA' },
  { name: 'Muted Ink on Cream Canvas', fg: 'muted', bg: 'cream', min: 4.5, target: 'AA' },
  { name: 'Deep Gold on Cream Canvas', fg: 'goldDeep', bg: 'cream', min: 4.5, target: 'AA' },
  { name: 'Success Accent on Cream Canvas', fg: 'success', bg: 'cream', min: 4.5, target: 'AA' },
  { name: 'Danger Accent on Cream Canvas', fg: 'danger', bg: 'cream', min: 4.5, target: 'AA' },

  // Storefront Cosmic Dark Hero
  { name: 'Ivory Hero Text on Cosmic 950', fg: 'heroIvory', bg: 'cosmic950', min: 7.0, target: 'AAA' },
  { name: 'Champagne Hero Text on Cosmic 950', fg: 'heroChampagne', bg: 'cosmic950', min: 7.0, target: 'AAA' },
  { name: 'Champagne Hero Text on Cosmic 900', fg: 'heroChampagne', bg: 'cosmic900', min: 7.0, target: 'AAA' },

  // DTCG Canonical System
  { name: 'DTCG Ink on DTCG Paper', fg: 'dtcgInk', bg: 'dtcgPaper', min: 7.0, target: 'AAA' },
  { name: 'DTCG Ink on DTCG Canvas', fg: 'dtcgInk', bg: 'dtcgCanvas', min: 7.0, target: 'AAA' },
  { name: 'DTCG Action on DTCG Canvas', fg: 'dtcgAction', bg: 'dtcgCanvas', min: 4.5, target: 'AA' },
  { name: 'DTCG Success on DTCG Canvas', fg: 'dtcgSuccess', bg: 'dtcgCanvas', min: 4.5, target: 'AA' },
  { name: 'DTCG Danger on DTCG Canvas', fg: 'dtcgDanger', bg: 'dtcgCanvas', min: 4.5, target: 'AA' },
  { name: 'Hero Ivory on DTCG Dark Canvas', fg: 'heroIvory', bg: 'dtcgDarkCanvas', min: 7.0, target: 'AAA' },
];

console.log('===============================================================');
console.log('   DERMAVIA ETHEREAL — WCAG 2.1 DESIGN TOKEN CONTRAST AUDIT    ');
console.log('===============================================================\n');

let failed = 0;
for (const c of checks) {
  const fgColor = tokens[c.fg];
  const bgColor = tokens[c.bg];
  const r = ratio(fgColor, bgColor);
  const pass = r >= c.min;
  const status = pass ? 'PASS' : 'FAIL';
  const tag = `[${status}]`.padEnd(7);
  const line = `${tag} ${c.name.padEnd(38)} ${r.toFixed(2)}:1  (${c.target} min ${c.min}:1)`;
  if (pass) {
    console.log(`\x1b[32m${line}\x1b[0m`);
  } else {
    console.log(`\x1b[31m${line}\x1b[0m`);
    failed++;
  }
}

console.log('\n---------------------------------------------------------------');
if (failed === 0) {
  console.log(`\x1b[32mALL ${checks.length} CONTRAST CHECKS PASSED WCAG 2.1 AA/AAA STANDARDS.\x1b[0m\n`);
  process.exit(0);
} else {
  console.error(`\x1b[31m${failed} CONTRAST CHECKS FAILED.\x1b[0m\n`);
  process.exit(1);
}
