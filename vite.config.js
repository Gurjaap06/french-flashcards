import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rolldownOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        alphabet: resolve(__dirname, "alphabet/index.html"),
      },
    },
  },
});