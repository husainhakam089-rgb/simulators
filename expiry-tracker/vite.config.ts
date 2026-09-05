import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // مسارات نسبية: يشتغل التطبيق من جذر النطاق أو من أي مجلد فرعي
  base: "./",
  plugins: [react()],
  server: { host: true, port: 5173 },
});
