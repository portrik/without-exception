import { defineConfig } from "vitest/config";

// biome-ignore lint/style/noDefaultExport: Default export is a vitest requirement
export default defineConfig({
	test: {
		watch: false,
		coverage: {
			enabled: true,
			provider: "istanbul",
		},
	},
});
