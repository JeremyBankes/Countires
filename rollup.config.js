import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { babel } from "@rollup/plugin-babel";

export default {
    input: "source/index.ts",
    external: [],
    output: {
        file: "public/scripts/index.js",
        format: "esm"
    },
    plugins: [
        typescript({ tsconfig: "source/tsconfig.json" }),
        nodeResolve(),
        commonjs(),
        babel({
            extensions: [".ts"],
            babelHelpers: "bundled",
            presets: ["@babel/preset-env"]
        })
    ]
};