import { defineConfig } from "vite";

export default defineConfig({
  alias: {
    "@shimmer/core": "/packages/@shimmer/core/index.ts",
    "@shimmer/dsl": "/packages/@shimmer/dsl/index.ts",
    "@shimmer/debug": "/packages/@shimmer/debug/index.ts",
    "@shimmer/dom": "/packages/@shimmer/dom/index.ts",
  },
});
