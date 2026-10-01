import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8080"
    }
  },
  test: {
    // DEC-022: 표시 Timezone(Asia/Seoul)과 다른 실행 Timezone으로 고정해, 어느 PC에서든 Timezone 의존 회귀를 잡는다.
    env: { TZ: "UTC" },
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"]
  }
});
