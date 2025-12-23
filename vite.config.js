import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/hand_landmark_display/",
  plugins: [react()],
});
