import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' so the built site also runs from any static folder (HashRouter is used for routing)
export default defineConfig({ plugins: [react()], base: './' });
