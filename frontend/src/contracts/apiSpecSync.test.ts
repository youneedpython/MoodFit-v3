// @vitest-environment node
/// <reference types="node" />
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import deletionJson from "../../../contracts/account-delete-204.json";
import guestDeletionJson from "../../../contracts/account-delete-guest-403.json";
import {
  CHECKIN_CREATED,
  CHECKIN_HISTORY,
  CHECKIN_LATEST,
  CHECKIN_LATEST_NOT_FOUND,
  CHECKIN_VALIDATION_ERROR
} from "./contracts";

const API_SPEC = readFileSync(new URL("../../../docs/05-API_SPEC.md", import.meta.url), "utf-8").replace(/\r\n/g, "\n");

/** `## {section}` 안에서 `marker` 다음에 오는 첫 JSON 예시를 읽는다. */
function jsonExampleAfter(section: string, marker: string): unknown {
  const start = API_SPEC.indexOf(`\n## ${section}`);
  expect(start, `docs/05-API_SPEC.md에 '## ${section}' 절이 있어야 한다.`).toBeGreaterThanOrEqual(0);
  const next = API_SPEC.indexOf("\n## ", start + 1);
  const body = API_SPEC.slice(start, next === -1 ? undefined : next);

  const markerIndex = body.indexOf(marker);
  expect(markerIndex, `'## ${section}' 절에 '${marker}'가 있어야 한다.`).toBeGreaterThanOrEqual(0);
  const block = /```json\n([\s\S]*?)```/.exec(body.slice(markerIndex));
  expect(block, `'${marker}' 다음에 JSON 예시가 있어야 한다.`).not.toBeNull();
  return JSON.parse(block![1]!);
}

/** DEC-024: API 명세 문서의 Response 예시가 계약 파일과 같아야 한다. */
describe("docs/05-API_SPEC.md ↔ contracts/", () => {
  it("matches account deletion success metadata and the guest error", () => {
    expect(jsonExampleAfter("12. 계정과 기록 삭제", "### Response — 204 No Content")).toEqual(deletionJson);
    expect(jsonExampleAfter("12. 계정과 기록 삭제", "### 체험 계정 — 403 Forbidden")).toEqual(guestDeletionJson);
  });
  it("uses five recommendations in mood-three/context-two order with approved playback IDs", () => {
    expect(CHECKIN_CREATED.foods).toHaveLength(5);
    expect(CHECKIN_CREATED.music).toHaveLength(5);
    expect(CHECKIN_CREATED.music.map((track) => track.videoId)).toEqual([
      "gdZLi9oWNZg", "dvgZkm1xWPE", "JGwWNGJdvx8", "zABLecsR5UE", "BzYnNdJhZQw"
    ]);
    expect(CHECKIN_HISTORY.items[0]!.foodNames).toEqual(CHECKIN_CREATED.foods.map((food) => food.name));
    expect(CHECKIN_HISTORY.items[0]!.musicTitles).toEqual(CHECKIN_CREATED.music.map((track) => track.title));
  });
  it("matches the check-in create response example", () => {
    expect(jsonExampleAfter("4. Check-in 생성", "### Response — 201 Created")).toEqual(CHECKIN_CREATED);
  });

  it("documents the latest response as the same structure as create", () => {
    expect(CHECKIN_LATEST).toEqual(CHECKIN_CREATED);
  });

  it("matches the latest not-found response example", () => {
    expect(jsonExampleAfter("5. 최신 Check-in 조회", "### 기록 없음")).toEqual(CHECKIN_LATEST_NOT_FOUND);
  });

  it("matches the history response example", () => {
    expect(jsonExampleAfter("6. History 조회", "### Response — 200 OK")).toEqual(CHECKIN_HISTORY);
  });

  it("matches the validation error response example", () => {
    expect(jsonExampleAfter("8. Error Response", "형식")).toEqual(CHECKIN_VALIDATION_ERROR);
  });
});
