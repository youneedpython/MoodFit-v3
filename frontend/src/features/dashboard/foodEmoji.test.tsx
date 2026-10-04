import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { foodEmoji } from "./foodEmoji";
import { RecommendationCards } from "./RecommendationCards";

const FOODS = [
  "따뜻한 수프와 곡물빵", "연어 샐러드", "두부 채소 덮밥", "닭가슴살 라이스볼",
  "따뜻한 죽", "그릭 요거트 볼", "따뜻한 채소 스튜", "과일 곁들인 그린 샐러드",
  "따뜻한 현미 주먹밥", "달걀 채소 오트밀", "찐 감자와 달걀", "소고기 채소 비빔밥",
  "통밀 닭고기 샌드위치", "버섯 메밀국수", "병아리콩 채소 볶음", "참치 채소 김밥",
  "달걀 토마토 볶음밥", "따뜻한 우동", "오이 냉국과 보리밥", "버섯 칼국수",
  "채소 만둣국", "토마토 파스타", "구운 채소 쿠스쿠스",
];

describe("음식 장식 아이콘", () => {
  it.each(FOODS)("현재 추천 메뉴 %s에 대응한다", (name) => {
    expect(foodEmoji(name)).not.toBe("🍽️");
  });
  it("모르는 메뉴는 기본 아이콘을 사용한다", () => {
    expect(foodEmoji("새로운 메뉴")).toBe("🍽️");
  });
  it("음식 이름의 접근성 이름에 아이콘을 포함하지 않는다", () => {
    render(<RecommendationCards foods={[{ name: "연어 샐러드", tag: "균형", reason: "추천" }]} music={[]} />);
    const heading = screen.getByRole("heading", { name: "연어 샐러드" });
    expect(heading.querySelector('[aria-hidden="true"]')?.textContent).toBe("🥗");
  });
});
