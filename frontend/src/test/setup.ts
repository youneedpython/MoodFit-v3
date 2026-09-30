import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Vitest globals를 사용하지 않으므로 Test마다 렌더링 결과와 Mock을 직접 정리한다.
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
