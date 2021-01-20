import { defineConfig } from "vite";

export default defineConfig({
  alias: {
    "@shimmer/core": "/packages/@shimmer/core/index.ts",
    "@shimmer/dsl": "/packages/@shimmer/dsl/index.ts",
    "@shimmer/debug": "/packages/@shimmer/debug/index.ts",
    "@shimmer/dom": "/packages/@shimmer/dom/index.ts",
    "@shimmer/reactive": "/packages/@shimmer/reactive/index.ts",
    "@shimmer/dev-mode": "/packages/@shimmer/dev-mode/index.ts",
  },
  optimizeDeps: {
    include: ["tslib"],
  },
  css: {
    preprocessorOptions: {
      scss: {
        includePaths: ["./app/node_modules"],
      },
    },
  },
});
