import esbuild from "esbuild";
import buildConfig from "./buildConfig.mjs";

const context = await esbuild.context(buildConfig);
await context.watch();