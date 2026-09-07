import esbuild from "esbuild";
import process from "node:process";

const production = process.argv[2] === "production";
const helper = await esbuild.build({
  entryPoints: ["src/transcript-helper.ts"],
  bundle: true,
  format: "iife",
  globalName: "CYTTranscriptHelper",
  platform: "browser",
  target: "es2022",
  write: false,
  minify: production
});

await esbuild.build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian", "electron"],
  platform: "node",
  format: "cjs",
  target: "es2022",
  logLevel: "info",
  sourcemap: production ? false : "inline",
  minify: production,
  define: {
    __TRANSCRIPT_HELPER_SOURCE__: JSON.stringify(helper.outputFiles[0].text)
  },
  outfile: "main.js"
});
