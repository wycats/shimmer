import { defineConfig } from "vite";

console.log("hi");

export default defineConfig({
  alias: {
    "@shimmer/core": "/packages/@shimmer/core/index.ts",
  },
  server: {
    open: "/index.html",
  },
});
