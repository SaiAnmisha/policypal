import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Forward API calls to Spring Boot so the browser sees one origin
    proxy: {
      "/auth": "http://localhost:8080",
      "/documents": "http://localhost:8080",
      "/ask": "http://localhost:8080",
    },
  },
});
