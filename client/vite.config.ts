import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // @ts-expect-error - Conflit de versions Rollup entre workspace racine et client
  plugins: [react()],
  css: {
    preprocessorOptions: {
      sass: {
        style: "expanded",
      },
    },
  },
  resolve: {
    // Dédupliquer React et React-DOM pour éviter les versions multiples
    // Utilisé en combinaison avec "overrides" dans package.json pour forcer React 19
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    exclude: ["highcharts"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          highcharts: [
            "highcharts/es-modules/masters/highcharts-more.src.js",
            "highcharts/es-modules/masters/highcharts.src.js",
            "highcharts/es-modules/masters/modules/offline-exporting.src.js",
            "highcharts/es-modules/masters/modules/pattern-fill.src.js",
            "highcharts/es-modules/masters/modules/export-data.src.js",
            "highcharts/es-modules/masters/modules/exporting.src.js",
            "highcharts/es-modules/masters/modules/map.src.js",
            "highcharts/es-modules/masters/modules/flowmap.src.js",
            "highcharts/es-modules/masters/modules/sankey.src.js",
            "highcharts/es-modules/masters/modules/treemap.src.js",
            "highcharts/es-modules/masters/modules/heatmap.src.js",
            "highcharts/es-modules/masters/modules/variable-pie.src.js",
            "highcharts/es-modules/masters/modules/variwide.src.js",
          ],
        },
      },
    },
  },
});
