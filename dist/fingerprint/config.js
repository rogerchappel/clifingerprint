import { readFileSync } from "node:fs";
import { validateConfig } from "./builder.js";
export function loadConfig(path) {
    const raw = readFileSync(path, "utf-8");
    const config = JSON.parse(raw);
    validateConfig(config);
    return config;
}
//# sourceMappingURL=config.js.map