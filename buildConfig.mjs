import { glsl } from "esbuild-plugin-glsl";
import copyStaticFiles from "esbuild-copy-static-files";

export default {
  entryPoints: ["src/app.ts"],
  outdir: "dist",
  bundle: true,
  plugins: [
    glsl({ minify: true }),
    copyStaticFiles({
      src: "src"
    }),
  ],
};