#!/usr/bin/env node
"use strict";

import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

import { spawnSync } from "child_process";

function usage() {
  console.error(
    "Usage:\n" +
      "  transpile-dir <inDir> --outDir <outDir> [Options]\n\n" +
      "Options:\n" +
      "  --inDir <dir>          Input directory for transpiled files (required)\n\n" +
      "  --outDir <dir>         Output directory for transpiled files (required)\n\n" +
      "  --isDebug              Add debug labels \n" +
      "  --discardComments      Discard comments \n" +
      "  --injectTraceLabels    Inject trace labels needed by Lilact only \n" +
      "  --factory <func>       The factory function (default: createComponent)\n" +
      "  -h, --help             Show help\n"
  );
  process.exit(1);
}

let factory = "createComponent";
let discardComments = false;
let injectTraceLabels = false;
let isDebug = false;

let outDir, inDir;
const argv = process.argv.slice(2);

for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--outDir") {
    outDir = argv[++i];
    if (!outDir) usage();
    outDir = path.resolve(outDir);
  } 
  else if (a === "--inDir") {
    inDir = argv[++i];
    if (!inDir) usage();
    inDir = path.resolve(inDir);
  } 
  else if (a === "--isDebug") {
    globalThis.DEBUG = true;
  } 
  else if (a === "--discardComments") {
    discardComments = true;
  } 
  else if (a === "--injectTraceLabels") {
    injectTraceLabels = true;
  } 
  else if (a === "--factory") {
    factory = argv[++i];
  } 
  else {
    usage();
  } 
}

function walkJsxFiles(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkJsxFiles(full));
    else if (ent.isFile() && (ent.name.endsWith(".js") || ent.name.endsWith(".jsx") ) ) out.push(full);
  }
  return out;
}

const files = walkJsxFiles(inDir);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transpileBin = path.resolve(__dirname, "transpile.js");

if (!fs.existsSync(transpileBin)) {
  throw new Error(`Missing ${transpileBin}`);
}

for (const inputPath of files) {

  const relPath = path.relative(inDir, inputPath);

  let targetOutFile = path.join(outDir, relPath); // file-level destination

  if(targetOutFile.endsWith('.jsx')) {
    targetOutFile = targetOutFile.slice(0,targetOutFile.length-1);
  }

  if (fs.existsSync(targetOutFile)) {
    fs.unlinkSync(targetOutFile);
  }

  const args = [transpileBin, inputPath, "--out", targetOutFile, "--factory", factory];

  if(isDebug) args.push("--isDebug");
  if(discardComments) args.push("--discardComments");
  if(injectTraceLabels) args.push("--injectTraceLabels");

  const res = spawnSync(
    process.execPath,
    args,
    { stdio: "inherit" }
  );

  if (res.status !== 0) process.exit(res.status ?? 1);
}
