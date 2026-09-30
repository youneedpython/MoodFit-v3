import { describe, expect, it, vi } from "vitest";
import type { CreateCheckinRequest } from "../types/api";
import { ApiError, checkinApi } from "./api";

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function stubFetch(response: Response | Error) {
  const fetchMock = vi.fn((_input: string, _init?: RequestInit) =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response)
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const request: CreateCheckinRequest = {
  heartRate: 68,
  respiratoryRate: 18,
  sleepScore: 86,
  stressLevel: 31,
  energyLevel: 74,
  temperature: 19.0,
  weather: "RAIN"
};

describe("checkinApi", () => {
  it("posts a check-in as JSON to /api/check-ins", async () => {
    const fetchMock = stubFetch(jsonResponse(201, { id: 1, wellnessScore: 76 }));

    const result = await checkinApi.create(request);

    expect(result).toMatchObject({ id: 1, wellnessScore: 76 });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/check-ins");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init?.body as string)).toEqual(request);
    expect((init?.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
  });

  it("returns null for latest when no check-in exists (404 CHECKIN_NOT_FOUND)", async () => {
    stubFetch(jsonResponse(404, { code: "CHECKIN_NOT_FOUND", message: "Latest check-in was not found.", fieldErrors: {} }));

    await expect(checkinApi.getLatest()).resolves.toBeNull();
  });

  it("requests history with the default of 7 days", async () => {
    const fetchMock = stubFetch(jsonResponse(200, { days: 7, items: [] }));

    await expect(checkinApi.getHistory()).resolves.toEqual({ days: 7, items: [] });
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/check-ins/history?days=7");
  });

  it("maps validation errors to ApiError with field errors", async () => {
    stubFetch(
      jsonResponse(400, {
        code: "VALIDATION_ERROR",
        message: "Request validation failed.",
        fieldErrors: { temperature: "must be a number with at most 1 fraction digit" }
      })
    );

    const error = await checkinApi.create(request).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
      fieldErrors: { temperature: "must be a number with at most 1 fraction digit" }
    });
  });

  it("does not hide non-empty-state errors on latest", async () => {
    stubFetch(jsonResponse(500, { code: "INTERNAL_ERROR", message: "Server error", fieldErrors: {} }));

    await expect(checkinApi.getLatest()).rejects.toMatchObject({ status: 500, code: "INTERNAL_ERROR" });
  });

  it("handles responses without an ErrorResponse body", async () => {
    stubFetch(new Response("Bad Gateway", { status: 502 }));

    await expect(checkinApi.getHistory()).rejects.toMatchObject({ status: 502, code: "HTTP_ERROR" });
  });

  it("maps network failures to NETWORK_ERROR", async () => {
    stubFetch(new TypeError("Failed to fetch"));

    await expect(checkinApi.getHistory()).rejects.toMatchObject({ status: 0, code: "NETWORK_ERROR" });
  });
});
