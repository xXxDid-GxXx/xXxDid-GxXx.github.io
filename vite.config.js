import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        linearMarketplace: resolve(__dirname, 'projects/linear-marketplace.html'),
        uxAudit: resolve(__dirname, 'projects/ux-audit.html'),
        carbonFocus: resolve(__dirname, 'projects/carbon-focus.html'),
      },
    },
  },
});
