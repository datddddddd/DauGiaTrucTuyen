import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [ react() ],
  appType: 'spa',
  server: {
    port: 5173,
    proxy: { 
      '/api': { 
        target: 'http://127.0.0.1:8000', 
        changeOrigin: true 
      } 
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        seller: path.resolve(__dirname, 'seller.html'),
        admin: path.resolve(__dirname, 'admin.html'),
      },
    },
  },
  resolve: {
    alias: {
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
  },
})