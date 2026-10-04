import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CHECKIN_CREATED } from "../../contracts/contracts";
import guest from "../../../../contracts/recommendation-feedback-guest-200.json";
import social from "../../../../contracts/recommendation-feedback-200.json";
import { RecommendationCards } from "./RecommendationCards";
import { useRecommendationFeedback } from "./useRecommendationFeedback";

function Screen({ legacy = false }: { legacy?: boolean }) {
  const feedback = useRecommendationFeedback();
  const foods = [{ ...CHECKIN_CREATED.foods[0]!, name: "연어 샐러드" }, ...CHECKIN_CREATED.foods.slice(1)];
  return <RecommendationCards foods={foods} music={legacy
    ? [{ ...CHECKIN_CREATED.music[0]!, videoId: null }] : CHECKIN_CREATED.music} feedback={feedback} />;
}
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
describe("추천 평가", () => {
  it("loads once, toggles, replaces and clears the item rating", async () => {
    const fetchMock = vi.fn().mockImplementation((_path: string, init?: RequestInit) => Promise.resolve(
      init?.method === "PUT" ? new Response(null, { status: 204 }) : response(social)));
    vi.stubGlobal("fetch", fetchMock);
    render(<Screen />);
    const like = await screen.findByRole("button", { name: "연어 샐러드 좋아요" });
    const dislike = screen.getByRole("button", { name: "연어 샐러드 별로예요" });
    expect(like.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(dislike);
    expect(dislike.getAttribute("aria-pressed")).toBe("true");
    await waitFor(() => expect(dislike.hasAttribute("disabled")).toBe(false));
    fireEvent.click(dislike);
    await waitFor(() => expect(dislike.hasAttribute("disabled")).toBe(false));
    expect(dislike.getAttribute("aria-pressed")).toBe("false");
    expect(JSON.parse(fetchMock.mock.calls[2]![1].body as string)).toEqual({ kind: "FOOD", item: "연어 샐러드", rating: null });
    fireEvent.click(like);
    await waitFor(() => expect(like.hasAttribute("disabled")).toBe(false));
    expect(fetchMock.mock.calls.filter(call => call[1]?.method !== "PUT")).toHaveLength(1);
    expect(screen.getByText(/다음 Check-in의 추천부터/)).toBeTruthy();
  });
  it("optimistically updates and restores the previous rating after failure", async () => {
    let rejectWrite: (reason: Error) => void = () => undefined;
    vi.stubGlobal("fetch", vi.fn((_path: string, init?: RequestInit) => init?.method === "PUT"
      ? new Promise<Response>((_resolve, reject) => { rejectWrite = reject; }) : Promise.resolve(response(social))));
    render(<Screen />);
    const dislike = await screen.findByRole("button", { name: "연어 샐러드 별로예요" });
    fireEvent.click(dislike);
    expect(dislike.getAttribute("aria-pressed")).toBe("true");
    rejectWrite(new Error("synthetic"));
    await screen.findByRole("alert");
    expect(dislike.getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("button", { name: "연어 샐러드 좋아요" }).getAttribute("aria-pressed")).toBe("true");
  });
  it("hides guest controls and explains social login", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(response(guest))));
    render(<Screen />);
    await screen.findByText("소셜 로그인 후 추천을 평가하면 다음 추천에 반영됩니다");
    expect(screen.queryByRole("button", { name: /좋아요|별로예요/ })).toBeNull();
  });
  it("does not offer feedback for legacy music without video metadata", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(response(social))));
    render(<Screen legacy />);
    await screen.findByRole("button", { name: "연어 샐러드 좋아요" });
    expect(screen.queryByRole("button", { name: "Dynamite 좋아요" })).toBeNull();
  });
  it("uses the music video id when evaluating a track", async () => {
    const fetchMock = vi.fn().mockImplementation((_path: string, init?: RequestInit) => Promise.resolve(
      init?.method === "PUT" ? new Response(null, { status: 204 }) : response(social)));
    vi.stubGlobal("fetch", fetchMock);
    render(<Screen />);
    const button = await screen.findByRole("button", { name: "Dynamite 좋아요" });
    fireEvent.click(button);
    await waitFor(() => expect(button.hasAttribute("disabled")).toBe(false));
    expect(JSON.parse(fetchMock.mock.calls[1]![1].body as string)).toEqual({ kind: "MUSIC", item: "gdZLi9oWNZg", rating: "LIKE" });
  });
});
