/**
 * DEC-024: Repository Root `contracts/`의 공유 계약 파일.
 * Backend(`CheckinContractTests`)는 실제 응답을, Frontend는 아래 Type 검사와 화면 Test로 같은 파일을 기준으로 검증한다.
 */
import createdJson from "../../../contracts/checkin-create-201.json";
import validationErrorJson from "../../../contracts/checkin-create-400.json";
import historyJson from "../../../contracts/checkin-history-200.json";
import latestJson from "../../../contracts/checkin-latest-200.json";
import notFoundJson from "../../../contracts/checkin-latest-404.json";
import type { CheckinResponse, ErrorResponse, HistoryResponse } from "../types/api";

/** 문자열 Union(예: MoodCode)을 string으로 넓혀 JSON에서 추론된 Type과 비교할 수 있게 한다. */
type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends readonly (infer U)[]
        ? Widen<U>[]
        : T extends object
          ? { [K in keyof T]: Widen<T[K]> }
          : T;

type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

type Expect<T extends true> = T;

/*
 * 계약 파일과 api.ts Type의 필드 구성(이름, 중첩 구조, 값 형식)이 정확히 같아야 한다.
 * 필드가 누락 / 추가 / 변경되면 `npm run build`(tsc --noEmit)가 실패한다.
 */
export type ContractTypeChecks = [
  Expect<Equals<typeof createdJson, Widen<CheckinResponse>>>,
  Expect<Equals<typeof latestJson, Widen<CheckinResponse>>>,
  Expect<Equals<typeof historyJson, Widen<HistoryResponse>>>,
  // Error 응답의 fieldErrors는 상황마다 Key가 달라 Key 목록과 값 형식만 비교한다.
  Expect<Equals<keyof typeof notFoundJson, keyof ErrorResponse>>,
  Expect<Equals<keyof typeof validationErrorJson, keyof ErrorResponse>>,
  Expect<Equals<(typeof validationErrorJson)["fieldErrors"][keyof (typeof validationErrorJson)["fieldErrors"]], string>>
];

export const CHECKIN_CREATED = createdJson as CheckinResponse;
export const CHECKIN_LATEST = latestJson as CheckinResponse;
export const CHECKIN_LATEST_NOT_FOUND = notFoundJson as ErrorResponse;
export const CHECKIN_HISTORY = historyJson as HistoryResponse;
export const CHECKIN_VALIDATION_ERROR = validationErrorJson as ErrorResponse;
