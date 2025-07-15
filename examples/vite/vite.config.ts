import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { treatAsCommonjs } from "vite-plugin-treat-umd-as-commonjs";

export default defineConfig({
  plugins: [
    react(),
    treatAsCommonjs(),
    {
      name: 'raw-css-as-string',
      enforce: 'pre',
      async resolveId(source, importer) {
        if (source.endsWith('.raw.css') && !source.includes('?raw')) {
          // rewrite import to append ?raw query
          const resolved = await this.resolve(source + '?raw', importer, { skipSelf: true });
          if (resolved) return resolved.id;
          return null;
        }
        return null;
      }
    },
    {
      name: "fix-text-query",
      enforce: "pre",
      async resolveId(source, importer) {
        if (source.includes("?text")) {
          let fixed = source.replace("?text", "?raw");
          const resolved = await this.resolve(fixed, importer, { skipSelf: true });
          if (resolved) {
            return resolved.id;
          }
          return fixed;
        }
        return null;
      },
    },
  ],
  assetsInclude: ["**/*.whl", "**/*.raw.css"],
  resolve: {
    alias: [
      {
        find: /^~(.*)$/,
        replacement: "$1",
      },
    ],
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (/pypi\//.test(assetInfo.name)) {
            return "pypi/[name][extname]";
          }
          return "assets/[name][extname]";
        },
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".whl": "text",
      },
    },
  },
});
