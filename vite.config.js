import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repositoryMatch = /^([^/]+)\/([^/]+)$/.exec(process.env.GITHUB_REPOSITORY || '');
const repoName = repositoryMatch ? repositoryMatch[2] : null;
const pagesBase = repoName ? `/${repoName}/` : '/';

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? pagesBase : '/',
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setupTests.js',
    globals: true,
  },
});
