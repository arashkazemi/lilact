import fs from "fs";
import path from "path";
import fg from "fast-glob";
import { fileURLToPath } from "url";
import { transpileJSX } from "../src/jsx.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const mode = process.env.MODE === "production" ? "production" : "development";
const DEBUG = mode === "development";

const outDir = path.resolve(projectRoot, ".tmp");

const files = await fg(["src/**/*.jsx", "src/**/*.js"], {
  cwd: projectRoot,
  onlyFiles: true,
});

await Promise.all(
  files.map(async (rel) => {
    const inPath = path.resolve(projectRoot, rel);

    const outRel = rel; //.replace(/\.(jsx|js)$/i, ".js");
    const outPath = path.resolve(outDir, outRel);

    await fs.promises.mkdir(path.dirname(outPath), { recursive: true });

    const source = await fs.promises.readFile(inPath, "utf8");

    const compiled = transpileJSX(source, {
      path: inPath,
      appendSourcemap: DEBUG,
    });

    await fs.promises.writeFile(outPath, compiled, "utf8");
  })
);

console.log("Preprocessing done.");
