import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    react(),
    dts({
      exclude: ["test"],
    }),
    tsconfigPaths(),
  ],
  build: {
    lib: {
      entry: {
        index: "src/index.ts",
        react: "src/react/index.ts",
      },
      name: "Stash",
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
  },
});
