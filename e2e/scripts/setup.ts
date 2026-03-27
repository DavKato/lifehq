import dotenv from "dotenv";
import { resolve } from "node:path";

dotenv.config({ path: resolve(import.meta.dirname, "../../.env") });

const { default: globalSetup } = await import("../global-setup.ts");
await globalSetup();
console.log("Auth state written to e2e/.auth/session.json");
