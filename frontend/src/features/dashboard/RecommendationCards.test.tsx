import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CHECKIN_CREATED } from "../../contracts/contracts";
import { RecommendationCards } from "./RecommendationCards";

describe("music playback", () => {
  it("shows five recommendations and creates an iframe only after playback is requested", () => {
    const { container } = render(<RecommendationCards {...CHECKIN_CREATED} />);
    expect(within(screen.getByRole("region", { name: "추천 음식" })).getAllByRole("listitem")).toHaveLength(5);
    expect(within(screen.getByRole("region", { name: "추천 음악" })).getAllByRole("listitem")).toHaveLength(5);
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector("img, script, link")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Dynamite - BTS 재생" }));
    const player = screen.getByTitle("Dynamite - BTS YouTube 플레이어");
    expect(player.getAttribute("src")).toBe("https://www.youtube-nocookie.com/embed/gdZLi9oWNZg?autoplay=1");
    const link = screen.getByRole("link", { name: "Dynamite YouTube에서 열기 (새 탭)" });
    expect(link.getAttribute("href")).toBe("https://www.youtube.com/watch?v=gdZLi9oWNZg");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    fireEvent.click(screen.getByRole("button", { name: "Dynamite 재생 닫기" }));
    expect(container.querySelector("iframe")).toBeNull();
  });

  it.each([undefined, null, "", "too-short", "gdZLi9oWNZg/", "OPf0YbXqDm!", "gdZLi9oWNZg\n"])(
    "keeps legacy or invalid video metadata as text (%s)", (videoId) => {
      const track = { ...CHECKIN_CREATED.music[0]!, videoId };
      const { container } = render(<RecommendationCards foods={CHECKIN_CREATED.foods.slice(0, 2)} music={[track, { ...track, title: "이전 추천" }]} />);
      expect(screen.getByText("Dynamite")).toBeTruthy();
      expect(screen.queryByRole("button")).toBeNull();
      expect(screen.queryByRole("link")).toBeNull();
      expect(container.querySelector("iframe")).toBeNull();
      expect(within(screen.getByRole("region", { name: "추천 음악" })).getAllByRole("listitem")).toHaveLength(2);
    }
  );

  it("removes the player when the displayed recommendation changes", () => {
    const { rerender, container } = render(<RecommendationCards {...CHECKIN_CREATED} />);
    fireEvent.click(screen.getByRole("button", { name: "Dynamite - BTS 재생" }));
    rerender(<RecommendationCards foods={[]} music={[{ ...CHECKIN_CREATED.music[0]!, videoId: "dvgZkm1xWPE" }]} />);
    expect(container.querySelector("iframe")).toBeNull();
  });
});
