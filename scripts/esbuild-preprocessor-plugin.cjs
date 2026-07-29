// scripts/esbuild-preprocessor-plugin.cjs
const fs = require("fs/promises");
const path = require("path");
const { transpileJSX } = require("../src/jsx.js");

function createLilactJsxPlugin({ mode }) {
  const DEBUG = mode !== "production";

  return {
    name: "lilact-transpile-jsx",
    setup(build) {
      build.onLoad({ filter: /\.jsx$/ }, async (args) => {
        const source = await fs.readFile(args.path, "utf8");

        const out = transpileJSX(source, {
          path: args.path,
          appendSourcemap: DEBUG,
        });

        return { contents: out, loader: "js" };
      });

      // Optional: if you want .js files through your transpiler too, add another onLoad:
      // build.onLoad({ filter: /\.js$/ }, async (args) => { ... })
    },
  };
}

module.exports = { createLilactJsxPlugin };
