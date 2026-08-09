import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'no-cache-scene-images',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.match(/^\/detective\/.*\.(jpg|jpeg|png)(\?.*)?$/i)) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
          }
          next();
        });
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        main:       resolve(__dirname, 'index.html'),
        standalone: resolve(__dirname, 'standalone.html'),
      },
    },
  },
});