#!/usr/bin/env node
// Genera seed.sql desde seed_data.json
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const data  = JSON.parse(readFileSync(join(__dir, 'seed_data.json'), 'utf8'));

const esc = (s) => s ? s.replace(/'/g, "''") : '';

const lines = [
  '-- Culinary Hub — Seed generado desde seed_data.json',
  '-- Seguro re-ejecutar: ON CONFLICT DO NOTHING en todo\n',
  '-- ─── CULTURAS ─────────────────────────────────────────────────────────────\n',
  'INSERT INTO cultures (slug, name_es, name_en, description_es, description_en, level) VALUES',
];

const cultValues = data.cultures.map(c =>
  `  ('${esc(c.slug)}', '${esc(c.name.es)}', '${esc(c.name.en)}', '${esc(c.description.es)}', '${esc(c.description.en)}', 1)`
);
lines.push(cultValues.join(',\n') + '\nON CONFLICT (slug) DO NOTHING;\n');

lines.push('-- ─── INGREDIENTES ──────────────────────────────────────────────────────────\n');
lines.push('INSERT INTO ingredients (slug, name_es, name_en, category) VALUES');

const ingValues = data.ingredients.map(i =>
  `  ('${esc(i.slug)}', '${esc(i.name.es)}', '${esc(i.name.en)}', '${esc(i.category)}')`
);
lines.push(ingValues.join(',\n') + '\nON CONFLICT (slug) DO NOTHING;\n');

const sql = lines.join('\n');
writeFileSync(join(__dir, 'seed.sql'), sql);
console.log(`seed.sql generado: ${data.cultures.length} culturas, ${data.ingredients.length} ingredientes`);
