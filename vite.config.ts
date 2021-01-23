import { defineConfig } from "vite";

export default defineConfig({
  alias: {
    "@shimmer/core": "/packages/@shimmer/core/index.ts",
    "@shimmer/dsl": "/packages/@shimmer/dsl/index.ts",
    "@shimmer/debug": "/packages/@shimmer/debug/index.ts",
    "@shimmer/dom": "/packages/@shimmer/dom/index.ts",
    "@shimmer/reactive": "/packages/@shimmer/reactive/index.ts",
    "@shimmer/dev-mode": "/packages/@shimmer/dev-mode/index.ts",
    tslib: "tslib/tslib.es6.js",
  },
  optimizeDeps: {
    include: [
      "@babel/runtime/regenerator",
      "lz-string",
      "aria-query",
      "pretty-format",
    ],
  },
  esbuild: {
    jsxInject: "import { h, f } from '@shimmer/dsl'",
    jsxFactory: "h",
    jsxFragment: "f",
  },
  css: {
    preprocessorOptions: {
      scss: {
        includePaths: ["./node_modules", "./app/node_modules"],
      },
    },
  },
});
