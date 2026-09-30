import { describe, expect, it } from "vitest";
import { EMPTY_FORM, mapServerFieldErrors, validateCheckinForm, type CheckinFormValues } from "./checkinForm";

const VALID: CheckinFormValues = {
  heartRate: "68",
  respiratoryRate: "18",
  sleepScore: "86",
  stressLevel: "31",
  energyLevel: "74",
  temperature: "19.0",
  weather: "RAIN"
};

function errorsFor(overrides: Partial<CheckinFormValues>) {
  const result = validateCheckinForm({ ...VALID, ...overrides });
  return result.ok ? {} : result.errors;
}

describe("validateCheckinForm", () => {
  it("converts valid input into the API request", () => {
    expect(validateCheckinForm(VALID)).toEqual({
      ok: true,
      request: {
        heartRate: 68,
        respiratoryRate: 18,
        sleepScore: 86,
        stressLevel: 31,
        energyLevel: 74,
        temperature: 19,
        weather: "RAIN"
      }
    });
  });

  it("requires every field", () => {
    const result = validateCheckinForm(EMPTY_FORM);

    expect(result.ok).toBe(false);
    expect(Object.keys(result.ok ? {} : result.errors).sort()).toEqual(
      ["energyLevel", "heartRate", "respiratoryRate", "sleepScore", "stressLevel", "temperature", "weather"].sort()
    );
  });

  it.each([
    ["heartRate", "40", true],
    ["heartRate", "39", false],
    ["heartRate", "180", true],
    ["heartRate", "181", false],
    ["respiratoryRate", "8", true],
    ["respiratoryRate", "7", false],
    ["respiratoryRate", "40", true],
    ["respiratoryRate", "41", false],
    ["sleepScore", "0", true],
    ["sleepScore", "-1", false],
    ["stressLevel", "100", true],
    ["stressLevel", "101", false],
    ["energyLevel", "74.5", false],
    ["temperature", "-30", true],
    ["temperature", "-30.1", false],
    ["temperature", "50.0", true],
    ["temperature", "50.1", false],
    ["temperature", "19.2", true],
    ["temperature", "19.25", false]
  ] as const)("%s = %s is valid: %s (API Spec 4절 기준)", (name, value, valid) => {
    expect(errorsFor({ [name]: value })[name] === undefined).toBe(valid);
  });

  it("uses Korean range messages", () => {
    expect(errorsFor({ heartRate: "200" }).heartRate).toBe("40 이상 180 이하의 정수로 입력해 주세요.");
    expect(errorsFor({ temperature: "19.25" }).temperature).toBe(
      "-30.0 이상 50.0 이하, 소수 첫째 자리까지 입력해 주세요."
    );
    expect(errorsFor({ weather: "" }).weather).toBe("날씨를 선택해 주세요.");
  });
});

describe("mapServerFieldErrors", () => {
  it("maps known fields to the same Korean messages regardless of the server locale", () => {
    expect(mapServerFieldErrors({ temperature: "must be ...", weather: "Invalid value." })).toEqual({
      temperature: "-30.0 이상 50.0 이하, 소수 첫째 자리까지 입력해 주세요.",
      weather: "날씨를 선택해 주세요."
    });
  });

  it("ignores fields that are not on the form", () => {
    expect(mapServerFieldErrors({ unknownField: "Invalid value." })).toEqual({});
  });
});
