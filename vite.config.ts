import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` emits relative asset URLs, so the same build works at a domain root
// (Netlify, Vercel) and under a sub-path such as https://<user>.github.io/clientflow-crm/.
export default defineConfig({
  base: './',
  plugins: [react()],
});
