import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  // In HF Spaces the app is served from root; VITE_API_URL points to the same origin
  base: "/",
  build: {
    outDir: "dist",
    sourcemap: false,
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy all /auth, /children etc. to FastAPI during local dev
      "/auth":       "http://localhost:8000",
      "/children":   "http://localhost:8000",
      "/growth":     "http://localhost:8000",
      "/attendance": "http://localhost:8000",
      "/activity":   "http://localhost:8000",
      "/mpr":        "http://localhost:8000",
      "/voice":      "http://localhost:8000",
      "/rag":        "http://localhost:8000",
      "/agent":      "http://localhost:8000",
      "/dashboard":  "http://localhost:8000",
      "/visits":     "http://localhost:8000",
    },
  },
})
