import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  esbuild: {
    jsx: 'automatic',
  },
  build: {
    minify: false, // Disable minification of the final output
    sourcemap: true,
  },
  optimizeDeps: {
    exclude: ['three'], // so we can debug three js :)
  },
  test: {
    globals: true,
    environment: 'node',

    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
    include: ['tests/**/*.test.ts'],
  },
});
