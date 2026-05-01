import { defineConfig, minify } from 'vite';

export default defineConfig({
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
