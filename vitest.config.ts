import { defineConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default defineConfig({
  ...viteConfig,
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["test/setupTest.test.ts"],
    include: ["test/**"],
    exclude: ["test/setupTest.test.ts"],
  },
});
