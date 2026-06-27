#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
}

const typedocOut = process.env.TYPEDOC_OUT || 'docs';
const from = path.resolve(__dirname, '..', 'root');
const to = path.resolve(__dirname, '..', typedocOut, 'static');

copyDirRecursive(from, to);
console.log(`Copied ${from} -> ${to}`);
