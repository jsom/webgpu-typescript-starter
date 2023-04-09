import esbuild from "esbuild";
import buildConfig from "./buildConfig.mjs";

const build = await esbuild.build(buildConfig);