import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: [".ngrok-free.dev", "c8fb-103-83-128-73.ngrok-free.app"],
  },
});
