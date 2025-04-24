import type { RolldownOptions } from "rolldown";
import { dts } from "rolldown-plugin-dts";

const baseConfig: RolldownOptions = {
	plugins: [dts()],
	output: {
		dir: "dist",
	},
};

export { baseConfig };
