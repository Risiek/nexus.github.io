import { defineConfig } from 'vite'

export default defineConfig({
  // Set the base path for GitHub Pages (replace 'repository-name' with your actual repo name)
  // If deploying to user/organization pages, keep it as '/'
  base: '/',
  
  build: {
    // Output directory for production build
    outDir: 'dist',
    // Empty outDir before building
    emptyOutDir: true,
    // Minify for production
    minify: 'terser',
  },
  
  server: {
    // Development server configuration
    port: 5173,
    open: true,
  },

  // Allow JSON imports
  assetsInclude: ['**/*.json'],
})
