import { defineConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default defineConfig({
  ...viteConfig,
  test: {
    globals: true,
    setupFiles: ["test/setupTest.test.ts"],
    coverage: {
      provider: "v8",
    },
    projects: [
      {
        extends: true,
        test: {
          name: { label: "base", color: "blue" },
          include: ["test/*.test.*"],
          environment: "jsdom",
          exclude: ["test/setupTest.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: { label: "react", color: "cyan" },
          include: ["test/react/*.test.*"],
          environment: "jsdom",
        },
      },
      {
        extends: true,
        test: {
          name: "astro",
          include: ["test/astro/*.test.*"],
          environment: "node",
          testTransformMode: {
            web: ["**.astro"],
          },
        },
      },
    ],
  },
});
