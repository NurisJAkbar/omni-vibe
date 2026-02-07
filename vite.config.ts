import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // Fix: Use '.' for current directory to avoid TypeScript errors with process.cwd()
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    define: {
      // This ensures process.env.API_KEY is replaced with the actual value during build
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});