import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Firebase Hosting serves from the root, so base '/'.
// For GitHub Pages project sites you'd switch to '/summer-base-camp/' (repo name).
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Split the big third-party SDKs out of the app chunk. Firebase is by
        // far the heaviest dependency; giving it (and React) their own chunks
        // keeps each under the 500 kB warning and lets the browser cache the
        // rarely-changing vendor code separately from our app code.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('/firebase/') || id.includes('/@firebase/')) return 'firebase'
          if (id.includes('/react') || id.includes('/scheduler/')) return 'react'
          return 'vendor'
        },
      },
    },
  },
})
