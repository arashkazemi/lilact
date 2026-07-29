import fs from "fs";
import path from "path";

const root = path.resolve(process.cwd(), "root");
const dist = path.resolve(process.cwd(), "dist");

fs.mkdirSync(root, { recursive: true });

for (const name of fs.readdirSync(dist)) {
  const src = path.join(dist, name);
  const dst = path.join(root, name);
  if (fs.statSync(src).isFile()) fs.copyFileSync(src, dst);
}