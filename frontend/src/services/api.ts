import type {
  CheckinResponse,
  CreateCheckinRequest,
  ErrorResponse,
  HistoryResponse
} from "../types/api";

const API_BASE = "/api";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: Record<string, string>;

  constructor(status: number, code: string, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

function isErrorResponse(body: unknown): body is ErrorResponse {
  return typeof body === "object" && body !== null && "code" in body && "message" in body;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (init.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    if (isErrorResponse(body)) {
      throw new ApiError(response.status, body.code, body.message, body.fieldErrors ?? {});
    }
    throw new ApiError(response.status, "HTTP_ERROR", `요청을 처리하지 못했습니다. (HTTP ${response.status})`);
  }

  return (await response.json()) as T;
}

export const checkinApi = {
  create(payload: CreateCheckinRequest): Promise<CheckinResponse> {
    return request<CheckinResponse>("/check-ins", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  /**
   * 최신 Check-in을 조회한다.
   * 기록이 없으면(404 CHECKIN_NOT_FOUND) 오류가 아닌 Empty State이므로 null을 반환한다. (API Spec 5절)
   */
  async getLatest(): Promise<CheckinResponse | null> {
    try {
      return await request<CheckinResponse>("/check-ins/latest");
    } catch (error) {
      if (error instanceof ApiError && error.status === 404 && error.code === "CHECKIN_NOT_FOUND") {
        return null;
      }
      throw error;
    }
  },

  /** days 허용 범위: 1 ~ 30, 기본 7 (DEC-004) */
  getHistory(days = 7): Promise<HistoryResponse> {
    return request<HistoryResponse>(`/check-ins/history?days=${days}`);
  }
};
