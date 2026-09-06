import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // مسارات نسبية: يشتغل التطبيق من جذر النطاق أو من أي مجلد فرعي
  base: "./",
  plugins: [react()],
  resolve: {
    // النسخة التي تجلب ملفاتها وقت التشغيل لا التي تدمجها في الحزمة: الدمج
    // يضع ١٤ م.ب داخل ملف جافاسكربت، والمحرك الثاني لا يُنزَّل إلا عند الحاجة.
    conditions: ["onnxruntime-web-use-extern-wasm"],
    alias: {
      // نسخة المعالج وحدها من ONNX Runtime: النسخة الافتراضية تجرّ ملف
      // jsep‏ (٢٧ م.ب) لتشغيل WebGPU، ونحن نشغّل على المعالج فتكفي ١٤ م.ب.
      // صاحب المحل هو من يدفع ثمن كل ميغابايت على بيانات موبايل عامله.
      "onnxruntime-web": "onnxruntime-web/wasm",
    },
  },
  optimizeDeps: {
    esbuildOptions: { conditions: ["onnxruntime-web-use-extern-wasm"] },
  },
  server: { host: true, port: 5173 },
});
