import { build } from "esbuild";

export async function setup() {
	await build({
		entryPoints: ["./src/index.ts"],
		outfile: "./dist/index.js",
		bundle: true,
		format: "esm",
		platform: "browser",
		target: "es2022",
		external: ["capnweb", "cloudflare:workers"],
	});
}
