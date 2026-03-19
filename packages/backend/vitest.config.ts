import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globalSetup: "./test/global-setup.ts",
	},
	plugins: [
		cloudflareTest({
			wrangler: { configPath: "./wrangler.jsonc" },
			miniflare: {
				serviceBindings: {
					testServer: "test-sever-workerd",
				},
				workers: [
					{
						name: "test-server-workerd",
						compatibilityDate: "2026-3-10",
						modules: [
							{
								type: "ESModule",
								path: "./dist/index.js",
							},
						],
						durableObjects: {
							GAME_DO: {
								className: "GameDO",
								useSQLite: true,
							},
						},
					},
				],
			},
		}),
	],
});
