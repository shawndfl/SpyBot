import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    minify: false, // Disable minification of the final output
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
