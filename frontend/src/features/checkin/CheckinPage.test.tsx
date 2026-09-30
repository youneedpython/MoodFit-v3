import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import type { CheckinResponse } from "../../types/api";
import { CheckinPage } from "./CheckinPage";

const RESULT: CheckinResponse = {
  id: 1,
  recordedAt: "2026-09-30T00:00:00Z",
  mood: { code: "ENERGETIC", label: "활기 있음" },
  wellnessScore: 76,
  summary: "현재 입력 기준으로 에너지 수준은 비교적 높고, 스트레스 부담은 크지 않은 편입니다.",
  metrics: { heartRate: 68, respiratoryRate: 18, sleepScore: 86, stressLevel: 31, energyLevel: 74 },
  weather: { temperature: 19, condition: "RAIN" },
  foods: [
    { name: "연어 샐러드", tag: "에너지 균형", reason: "가볍게 에너지를 유지하기 좋은 메뉴입니다." },
    { name: "따뜻한 채소 스튜", tag: "따뜻한 메뉴", reason: "비 오는 날씨에 어울리는 따뜻한 메뉴입니다." }
  ],
  music: [
    { title: "Light Motion Playlist", artist: "MoodFit Curated", tag: "가벼운 활력", reason: "높은 에너지에 어울리는 밝은 흐름입니다." },
    { title: "Rainy Indoor Playlist", artist: "MoodFit Curated", tag: "잔잔한 감성", reason: "비 오는 날의 실내 분위기에 어울립니다." }
  ]
};

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function renderPage() {
  render(
    <MemoryRouter>
      <CheckinPage />
    </MemoryRouter>
  );
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/심박수/), { target: { value: "68" } });
  fireEvent.change(screen.getByLabelText(/호흡수/), { target: { value: "18" } });
  fireEvent.change(screen.getByLabelText(/수면 점수/), { target: { value: "86" } });
  fireEvent.change(screen.getByLabelText(/스트레스 수준/), { target: { value: "31" } });
  fireEvent.change(screen.getByLabelText(/에너지 수준/), { target: { value: "74" } });
  fireEvent.change(screen.getByLabelText(/기온/), { target: { value: "19.0" } });
  fireEvent.click(screen.getByLabelText("비"));
}

function submitButton() {
  return screen.getByRole("button", { name: /분석 요청|분석 중/ }) as HTMLButtonElement;
}

describe("CheckinPage", () => {
  it("groups inputs and shows range hints for each field", () => {
    renderPage();

    expect(screen.getByRole("group", { name: "신체 리듬" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "컨디션" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "날씨" })).toBeTruthy();
    expect(screen.getByText("40 ~ 180 정수")).toBeTruthy();
    expect(screen.getByText("-30.0 ~ 50.0, 소수 첫째 자리까지")).toBeTruthy();
    expect(screen.getAllByRole("radio")).toHaveLength(4);
  });

  it("shows validation errors next to fields, focuses the first invalid field and does not call the API", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderPage();

    fireEvent.change(screen.getByLabelText(/심박수/), { target: { value: "200" } });
    fireEvent.click(submitButton());

    const heartRate = screen.getByLabelText(/심박수/);
    expect(heartRate.getAttribute("aria-invalid")).toBe("true");
    expect(heartRate.getAttribute("aria-describedby")).toContain("heartRate-error");
    expect(document.getElementById("heartRate-error")?.textContent).toBe("40 이상 180 이하의 정수로 입력해 주세요.");
    expect(screen.getByText("날씨를 선택해 주세요.")).toBeTruthy();
    expect(document.activeElement).toBe(heartRate);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("clears a field error when the user edits that field", () => {
    renderPage();
    fireEvent.click(submitButton());
    expect(document.getElementById("sleepScore-error")).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/수면 점수/), { target: { value: "80" } });

    expect(document.getElementById("sleepScore-error")).toBeNull();
  });

  it("submits once, disables the form while submitting, and shows the API result", async () => {
    let resolveFetch: (response: Response) => void = () => undefined;
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => (resolveFetch = resolve)));
    vi.stubGlobal("fetch", fetchMock);
    renderPage();
    fillValidForm();

    fireEvent.click(submitButton());
    fireEvent.click(submitButton());
    fireEvent.submit(submitButton().closest("form")!);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(submitButton().disabled).toBe(true);
    expect(submitButton().textContent).toBe("분석 중...");
    expect((screen.getByLabelText(/심박수/) as HTMLInputElement).disabled).toBe(true);

    await act(async () => resolveFetch(jsonResponse(201, RESULT)));

    const heading = await screen.findByRole("heading", { name: "Check-in이 저장되었습니다." });
    expect(document.activeElement).toBe(heading);
    expect(screen.getByText("활기 있음")).toBeTruthy();
    expect(screen.getByText("76")).toBeTruthy();
    expect(screen.getByText(RESULT.summary)).toBeTruthy();
    expect(screen.getByText("따뜻한 채소 스튜")).toBeTruthy();
    expect(screen.getByText("Rainy Indoor Playlist")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Dashboard로 이동" }).getAttribute("href")).toBe("/");
    expect(JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)).toMatchObject({
      heartRate: 68,
      temperature: 19,
      weather: "RAIN"
    });
  });

  it("returns to an empty form with 새로 입력하기", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse(201, RESULT))));
    renderPage();
    fillValidForm();
    fireEvent.click(submitButton());
    await screen.findByRole("heading", { name: "Check-in이 저장되었습니다." });

    fireEvent.click(screen.getByRole("button", { name: "새로 입력하기" }));

    expect((screen.getByLabelText(/심박수/) as HTMLInputElement).value).toBe("");
  });

  it("shows server validation errors next to the matching field", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse(400, {
            code: "VALIDATION_ERROR",
            message: "Request validation failed.",
            fieldErrors: { temperature: "must be a number with at most 1 fraction digit" }
          })
        )
      )
    );
    renderPage();
    fillValidForm();

    fireEvent.click(submitButton());

    expect(await screen.findByText("-30.0 이상 50.0 이하, 소수 첫째 자리까지 입력해 주세요.")).toBeTruthy();
    expect(screen.getByLabelText(/기온/).getAttribute("aria-invalid")).toBe("true");
    expect(submitButton().disabled).toBe(false);
  });

  it("shows an API error with retry and keeps the entered values", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(jsonResponse(201, RESULT));
    vi.stubGlobal("fetch", fetchMock);
    renderPage();
    fillValidForm();

    fireEvent.click(submitButton());

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Check-in을 저장하지 못했습니다.");
    expect(alert.textContent).toContain("서버에 연결할 수 없습니다.");
    expect((screen.getByLabelText(/심박수/) as HTMLInputElement).value).toBe("68");

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findByRole("heading", { name: "Check-in이 저장되었습니다." })).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each(["다시 시도", "분석 요청"])(
    "validates edited input again when %s is pressed after an API error",
    async (buttonName) => {
      const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError("Failed to fetch"));
      vi.stubGlobal("fetch", fetchMock);
      renderPage();
      fillValidForm();
      fireEvent.click(submitButton());
      await screen.findByRole("alert");

      fireEvent.change(screen.getByLabelText(/심박수/), { target: { value: "200" } });
      fireEvent.click(screen.getByRole("button", { name: buttonName }));

      const heartRate = screen.getByLabelText(/심박수/);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(document.getElementById("heartRate-error")?.textContent).toBe("40 이상 180 이하의 정수로 입력해 주세요.");
      expect(heartRate.getAttribute("aria-invalid")).toBe("true");
      expect(document.activeElement).toBe(heartRate);
      expect(screen.queryByRole("alert")).toBeNull();
    }
  );

  it("uses a generic Korean message for server errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse(500, { code: "INTERNAL_ERROR", message: "Server error", fieldErrors: {} })))
    );
    renderPage();
    fillValidForm();

    fireEvent.click(submitButton());

    expect((await screen.findByRole("alert")).textContent).toContain(
      "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요."
    );
  });
});
