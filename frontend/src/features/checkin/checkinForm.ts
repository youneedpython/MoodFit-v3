import type { CreateCheckinRequest, WeatherCondition } from "../../types/api";

/**
 * Daily Check-in 입력 정의와 Client-side Validation 보조.
 * 기준은 docs/05-API_SPEC.md 4절 Validation과 Backend CreateCheckinRequest와 같다.
 * 최종 검증은 Backend가 수행한다.
 */

export type NumberFieldName =
  | "heartRate"
  | "respiratoryRate"
  | "sleepScore"
  | "stressLevel"
  | "energyLevel"
  | "temperature";

export type FieldName = NumberFieldName | "weather";

export type NumberFieldDefinition = {
  name: NumberFieldName;
  label: string;
  unit?: string;
  min: number;
  max: number;
  /** 정수만 허용하면 0, Temperature처럼 소수 첫째 자리까지 허용하면 1 */
  fractionDigits: 0 | 1;
};

export const NUMBER_FIELDS: Record<NumberFieldName, NumberFieldDefinition> = {
  heartRate: { name: "heartRate", label: "심박수", unit: "bpm", min: 40, max: 180, fractionDigits: 0 },
  respiratoryRate: { name: "respiratoryRate", label: "호흡수", unit: "회/분", min: 8, max: 40, fractionDigits: 0 },
  sleepScore: { name: "sleepScore", label: "수면 점수", min: 0, max: 100, fractionDigits: 0 },
  stressLevel: { name: "stressLevel", label: "스트레스 수준", min: 0, max: 100, fractionDigits: 0 },
  energyLevel: { name: "energyLevel", label: "에너지 수준", min: 0, max: 100, fractionDigits: 0 },
  temperature: { name: "temperature", label: "기온", unit: "°C", min: -30, max: 50, fractionDigits: 1 }
};

export const FIELD_GROUPS: { title: string; description: string; fields: NumberFieldName[] }[] = [
  { title: "신체 리듬", description: "안정된 상태에서 측정한 값을 입력해 주세요.", fields: ["heartRate", "respiratoryRate"] },
  { title: "컨디션", description: "오늘 느끼는 정도를 0 ~ 100 사이로 입력해 주세요.", fields: ["sleepScore", "stressLevel", "energyLevel"] }
];

export const WEATHER_OPTIONS: { value: WeatherCondition; label: string }[] = [
  { value: "CLEAR", label: "맑음" },
  { value: "CLOUDY", label: "흐림" },
  { value: "RAIN", label: "비" },
  { value: "SNOW", label: "눈" }
];

export type CheckinFormValues = Record<NumberFieldName, string> & { weather: WeatherCondition | "" };

export type FieldErrors = Partial<Record<FieldName, string>>;

export const EMPTY_FORM: CheckinFormValues = {
  heartRate: "",
  respiratoryRate: "",
  sleepScore: "",
  stressLevel: "",
  energyLevel: "",
  temperature: "",
  weather: ""
};

export const FIELD_ORDER: FieldName[] = [
  "heartRate",
  "respiratoryRate",
  "sleepScore",
  "stressLevel",
  "energyLevel",
  "temperature",
  "weather"
];

function formatBound(value: number, fractionDigits: 0 | 1) {
  return fractionDigits === 0 ? String(value) : value.toFixed(fractionDigits);
}

export function rangeHint(field: NumberFieldDefinition) {
  const range = `${formatBound(field.min, field.fractionDigits)} ~ ${formatBound(field.max, field.fractionDigits)}`;
  return field.fractionDigits === 0 ? `${range} 정수` : `${range}, 소수 첫째 자리까지`;
}

export function rangeMessage(field: NumberFieldDefinition) {
  const min = formatBound(field.min, field.fractionDigits);
  const max = formatBound(field.max, field.fractionDigits);
  return field.fractionDigits === 0
    ? `${min} 이상 ${max} 이하의 정수로 입력해 주세요.`
    : `${min} 이상 ${max} 이하, 소수 첫째 자리까지 입력해 주세요.`;
}

const INTEGER_PATTERN = /^-?\d+$/;
const ONE_FRACTION_PATTERN = /^-?\d+(\.\d)?$/;

function validateNumber(field: NumberFieldDefinition, raw: string): string | undefined {
  const value = raw.trim();
  if (value === "") {
    return "값을 입력해 주세요.";
  }
  const pattern = field.fractionDigits === 0 ? INTEGER_PATTERN : ONE_FRACTION_PATTERN;
  const numeric = Number(value);
  if (!pattern.test(value) || numeric < field.min || numeric > field.max) {
    return rangeMessage(field);
  }
  return undefined;
}

export type ValidationResult =
  | { ok: true; request: CreateCheckinRequest }
  | { ok: false; errors: FieldErrors };

export function validateCheckinForm(values: CheckinFormValues): ValidationResult {
  const errors: FieldErrors = {};

  for (const field of Object.values(NUMBER_FIELDS)) {
    const error = validateNumber(field, values[field.name]);
    if (error) {
      errors[field.name] = error;
    }
  }
  if (values.weather === "") {
    errors.weather = "날씨를 선택해 주세요.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    request: {
      heartRate: Number(values.heartRate.trim()),
      respiratoryRate: Number(values.respiratoryRate.trim()),
      sleepScore: Number(values.sleepScore.trim()),
      stressLevel: Number(values.stressLevel.trim()),
      energyLevel: Number(values.energyLevel.trim()),
      temperature: Number(values.temperature.trim()),
      weather: values.weather as WeatherCondition
    }
  };
}

/**
 * Backend VALIDATION_ERROR의 fieldErrors 중 화면에 있는 필드를 한국어 안내로 변환한다.
 * Backend 메시지는 실행 환경 Locale에 따라 언어가 달라질 수 있으므로 같은 범위 안내를 사용한다.
 * 화면에 없는 필드의 오류는 포함하지 않으며, 호출하는 쪽에서 일반 오류로 표시한다.
 */
export function mapServerFieldErrors(serverErrors: Record<string, string>): FieldErrors {
  const errors: FieldErrors = {};
  for (const name of Object.keys(serverErrors)) {
    if (name in NUMBER_FIELDS) {
      errors[name as NumberFieldName] = rangeMessage(NUMBER_FIELDS[name as NumberFieldName]);
    } else if (name === "weather") {
      errors.weather = "날씨를 선택해 주세요.";
    }
  }
  return errors;
}
