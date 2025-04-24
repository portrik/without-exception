import { defineConfig } from "rolldown";

import { baseConfig } from "../../rolldown.config.ts";

// biome-ignore lint/style/noDefaultExport: Rolldown configuration requires the default export
export default defineConfig({
	...baseConfig,
	input: ["./src/result.ts", "./src/option.ts", "./src/pipe.ts"],
});
