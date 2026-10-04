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
    fireEvent.click(screen.getByRole("button", { name: "Uptown Funk - Mark Ronson ft. Bruno Mars 재생" }));
    const player = screen.getByTitle("Uptown Funk - Mark Ronson ft. Bruno Mars YouTube 플레이어");
    expect(player.getAttribute("src")).toBe("https://www.youtube-nocookie.com/embed/OPf0YbXqDm0?autoplay=1");
    const link = screen.getByRole("link", { name: "Uptown Funk YouTube에서 열기 (새 탭)" });
    expect(link.getAttribute("href")).toBe("https://www.youtube.com/watch?v=OPf0YbXqDm0");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    fireEvent.click(screen.getByRole("button", { name: "Uptown Funk 재생 닫기" }));
    expect(container.querySelector("iframe")).toBeNull();
  });

  it.each([undefined, null, "", "too-short", "OPf0YbXqDm0/", "OPf0YbXqDm!", "OPf0YbXqDm0\n"])(
    "keeps legacy or invalid video metadata as text (%s)", (videoId) => {
      const track = { ...CHECKIN_CREATED.music[0]!, videoId };
      const { container } = render(<RecommendationCards foods={CHECKIN_CREATED.foods.slice(0, 2)} music={[track, { ...track, title: "이전 추천" }]} />);
      expect(screen.getByText("Uptown Funk")).toBeTruthy();
      expect(screen.queryByRole("button")).toBeNull();
      expect(screen.queryByRole("link")).toBeNull();
      expect(container.querySelector("iframe")).toBeNull();
      expect(within(screen.getByRole("region", { name: "추천 음악" })).getAllByRole("listitem")).toHaveLength(2);
    }
  );

  it("removes the player when the displayed recommendation changes", () => {
    const { rerender, container } = render(<RecommendationCards {...CHECKIN_CREATED} />);
    fireEvent.click(screen.getByRole("button", { name: "Uptown Funk - Mark Ronson ft. Bruno Mars 재생" }));
    rerender(<RecommendationCards foods={[]} music={[{ ...CHECKIN_CREATED.music[0]!, videoId: "ru0K8uYEZWw" }]} />);
    expect(container.querySelector("iframe")).toBeNull();
  });
});
