import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs';

// ---------------------------------------------------------------------------
// Vite plugin: copies Chrome Extension artefacts into dist/ after each build
// so that the dist/ directory is a valid, loadable MV3 extension.
//
// Files copied:
//   manifest.json        (root)         → dist/manifest.json
//   public/background.js                → dist/background.js
//   public/popup.html                   → dist/popup.html
//   public/popup.js                     → dist/popup.js
//   public/icons/*                      → dist/icons/*  (if present)
// ---------------------------------------------------------------------------
function extensionAssetPlugin() {
  return {
    name: 'extension-asset-copy',
    closeBundle() {
      const root = resolve(__dirname);
      const dist = resolve(__dirname, 'dist');

      // manifest.json (lives at project root, not inside public/)
      const manifestSrc = resolve(root, 'manifest.json');
      if (existsSync(manifestSrc)) {
        copyFileSync(manifestSrc, resolve(dist, 'manifest.json'));
        console.log('  ✔  manifest.json → dist/manifest.json');
      }

      // Files inside public/ that must land at the dist root (not in assets/)
      const publicFiles = ['background.js', 'popup.html', 'popup.js', 'contentScript.js', 'alert.css'];
      for (const file of publicFiles) {
        const src = resolve(root, 'public', file);
        if (existsSync(src)) {
          copyFileSync(src, resolve(dist, file));
          console.log(`  ✔  public/${file} → dist/${file}`);
        }
      }

      // icons/ sub-directory
      const iconsSrc = resolve(root, 'public', 'icons');
      if (existsSync(iconsSrc)) {
        const iconsDst = resolve(dist, 'icons');
        mkdirSync(iconsDst, { recursive: true });
        for (const f of readdirSync(iconsSrc)) {
          copyFileSync(resolve(iconsSrc, f), resolve(iconsDst, f));
        }
        console.log('  ✔  public/icons/* → dist/icons/');
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    extensionAssetPlugin(),
  ],
  server: {
    port: 5173,
    strictPort: true, // Prevents Vite from switching to 5174 if 5173 is temporarily busy
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});