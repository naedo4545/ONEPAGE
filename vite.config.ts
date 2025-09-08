import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      server: {
        // Increase header size limits
        hmr: {
          overlay: false
        },
        // Optimize for development
        watch: {
          usePolling: false,
          ignored: ['**/node_modules/**', '**/dist/**']
        }
      },
      build: {
        // Optimize build size
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              utils: ['html2canvas']
            }
          }
        }
      }
    };
});
