import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "../../components/Button/Button";
import { Card } from "../../components/Card/Card";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { ErrorState } from "../../components/StateView/StateView";
import { ApiError, checkinApi } from "../../services/api";
import { fetchLocalWeather, readAutoWeather, saveAutoWeather, WeatherError } from "../../services/weather";
import type { CheckinResponse, CreateCheckinRequest } from "../../types/api";
import { CheckinResultSummary } from "./CheckinResultSummary";
import {
  EMPTY_FORM,
  FIELD_GROUPS,
  NUMBER_FIELDS,
  WEATHER_OPTIONS,
  mapServerFieldErrors,
  rangeHint,
  validateCheckinForm,
  type CheckinFormValues,
  type FieldErrors,
  type NumberFieldName
} from "./checkinForm";
import "./CheckinPage.css";

type SubmitState =
  | { status: "editing" }
  | { status: "submitting" }
  | { status: "error"; message: string }
  | { status: "success"; result: CheckinResponse };

function errorMessageFor(error: unknown) {
  if (error instanceof ApiError && error.code === "NETWORK_ERROR") {
    return error.message;
  }
  return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

/** CHECK-001 Daily Check-in */
export function CheckinPage() {
  const [values, setValues] = useState<CheckinFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "editing" });
  const [focusRequest, setFocusRequest] = useState(0);
  const submittingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [autoWeather, setAutoWeather] = useState(readAutoWeather);
  const autoWeatherRef = useRef(autoWeather);
  const [weatherState, setWeatherState] = useState({ loading: false, message: "", error: false });
  const weatherEdited = useRef(false);
  const weatherRequest = useRef<AbortController | null>(null);
  const preferenceVersion = useRef(0);

  function setWeatherPreference(enabled: boolean) {
    preferenceVersion.current += 1;
    autoWeatherRef.current = enabled;
    setAutoWeather(enabled);
    const saved = saveAutoWeather(enabled);
    if (!enabled) {
      weatherRequest.current?.abort();
      weatherRequest.current = null;
      setWeatherState({ loading: false, message: "자동 조회를 껐습니다. 직접 입력하거나 버튼으로 가져올 수 있습니다.", error: false });
    }
    return saved;
  }

  async function getWeather() {
    if (weatherRequest.current || submittingRef.current) return;
    const controller = new AbortController();
    weatherRequest.current = controller;
    const version = preferenceVersion.current;
    setWeatherState({ loading: true, message: "현재 위치의 날씨를 조회하고 있습니다.", error: false });
    try {
      const result = await fetchLocalWeather(controller.signal);
      if (controller.signal.aborted) return;
      let saved = true;
      if (version === preferenceVersion.current) saved = setWeatherPreference(true);
      if (!weatherEdited.current && !submittingRef.current) {
        setValues((current) => current.temperature || current.weather ? current : { ...current, temperature: String(result.temperature), weather: result.weather });
        setErrors((current) => ({ ...current, temperature: undefined, weather: undefined }));
      }
      setWeatherState({ loading: false, message: (weatherEdited.current ? "입력한 날씨를 유지했습니다." : "현재 위치의 날씨를 가져왔습니다. 값을 수정할 수 있습니다.") + (saved ? "" : " 자동 조회 설정을 저장하지 못했습니다."), error: false });
    } catch (error) {
      if (!controller.signal.aborted) setWeatherState({ loading: false, message: error instanceof WeatherError ? error.message : "날씨 조회에 실패했습니다. 직접 입력해 주세요.", error: true });
    } finally {
      if (weatherRequest.current === controller) weatherRequest.current = null;
    }
  }

  useEffect(() => {
    let active = true;
    const version = preferenceVersion.current;
    if (readAutoWeather() && navigator.permissions?.query) {
      void (async () => {
        try {
          const permission = await navigator.permissions.query({ name: "geolocation" });
          if (active && version === preferenceVersion.current && permission.state === "granted" && autoWeatherRef.current && !weatherEdited.current) void getWeather();
        } catch { /* Unsupported permission queries keep button-only behavior. */ }
      })();
    }
    return () => { active = false; weatherRequest.current?.abort(); weatherRequest.current = null; };
  }, []);

  // Validation 실패 후 첫 번째 잘못된 입력으로 Focus를 이동한다.
  useEffect(() => {
    if (focusRequest > 0) {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  }, [focusRequest]);

  function updateValue(name: keyof CheckinFormValues) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      if (name === "temperature" || name === "weather") weatherEdited.current = true;
      setValues((current) => ({ ...current, [name]: value }));
      setErrors((current) => ({ ...current, [name]: undefined }));
    };
  }

  async function submit(request: CreateCheckinRequest) {
    // 버튼 비활성화와 별도로, 같은 렌더 사이클의 연속 제출도 막는다.
    if (submittingRef.current) {
      return;
    }
    submittingRef.current = true;
    weatherRequest.current?.abort();
    weatherRequest.current = null;
    setWeatherState({ loading: false, message: "", error: false });
    setSubmitState({ status: "submitting" });

    try {
      const result = await checkinApi.create(request);
      setSubmitState({ status: "success", result });
    } catch (error) {
      if (error instanceof ApiError && error.code === "VALIDATION_ERROR") {
        const mapped = mapServerFieldErrors(error.fieldErrors);
        if (Object.keys(mapped).length > 0) {
          setErrors(mapped);
          setSubmitState({ status: "editing" });
          setFocusRequest((count) => count + 1);
          return;
        }
      }
      setSubmitState({ status: "error", message: errorMessageFor(error) });
    } finally {
      submittingRef.current = false;
    }
  }

  // 일반 제출과 재시도는 같은 Validation 경로를 사용한다.
  // 입력이 잘못되면 API를 호출하지 않고, 이전 API Error를 해제해 입력 수정 상태로 돌아간다.
  function validateAndSubmit() {
    const validation = validateCheckinForm(values);
    if (!validation.ok) {
      setErrors(validation.errors);
      setSubmitState({ status: "editing" });
      setFocusRequest((count) => count + 1);
      return;
    }
    setErrors({});
    void submit(validation.request);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    validateAndSubmit();
  }

  function startOver() {
    weatherEdited.current = false;
    setValues(EMPTY_FORM);
    setErrors({});
    setSubmitState({ status: "editing" });
  }

  if (submitState.status === "success") {
    return (
      <>
        <PageHeader title="Daily Check-in" description="오늘의 신체 리듬과 날씨를 입력합니다." />
        <CheckinResultSummary result={submitState.result} onStartOver={startOver} />
      </>
    );
  }

  const isSubmitting = submitState.status === "submitting";

  function renderNumberField(name: NumberFieldName) {
    const field = NUMBER_FIELDS[name];
    const error = errors[name];
    const hintId = `${name}-hint`;
    const errorId = `${name}-error`;
    return (
      <div className="checkin-field" key={name}>
        <label className="checkin-field__label" htmlFor={name}>
          {field.label}
          {field.unit && <span className="checkin-field__unit"> ({field.unit})</span>}
        </label>
        <input
          id={name}
          name={name}
          type="number"
          inputMode={field.fractionDigits === 0 ? "numeric" : "decimal"}
          min={field.min}
          max={field.max}
          step={field.fractionDigits === 0 ? 1 : 0.1}
          className="checkin-field__input"
          value={values[name]}
          onChange={updateValue(name)}
          disabled={isSubmitting}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${hintId} ${errorId}` : hintId}
        />
        <p id={hintId} className="checkin-field__hint">
          {rangeHint(field)}
        </p>
        {error && (
          <p id={errorId} className="checkin-field__error">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Daily Check-in" description="오늘의 신체 리듬과 날씨를 입력합니다." />

      {submitState.status === "error" && (
        <Card className="checkin-error">
          <ErrorState title="Check-in을 저장하지 못했습니다." message={submitState.message} onRetry={validateAndSubmit} />
        </Card>
      )}

      <form ref={formRef} className="checkin-form" onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
        {FIELD_GROUPS.map((group) => (
          <Card key={group.title}>
            <fieldset className="checkin-group">
              <legend className="checkin-group__legend">{group.title}</legend>
              <p className="checkin-group__description">{group.description}</p>
              <div className="checkin-group__fields">{group.fields.map(renderNumberField)}</div>
            </fieldset>
          </Card>
        ))}

        <Card>
          <fieldset className="checkin-group">
            <legend className="checkin-group__legend">날씨</legend>
            <p className="checkin-group__description">현재 위치의 기온과 날씨를 입력해 주세요.</p>
            <div className="checkin-weather-tools">
              <Button type="button" disabled={isSubmitting || weatherState.loading} onClick={() => void getWeather()}>
                {weatherState.loading ? "날씨 조회 중..." : "현재 위치 날씨 가져오기"}
              </Button>
              <label className="checkin-weather__option">
                <input type="checkbox" checked={autoWeather} disabled={isSubmitting} onChange={(event) => setWeatherPreference(event.target.checked)} />
                위치 허용 후 진입 시 자동 조회
              </label>
              <p className="checkin-field__hint">위치는 약 10km 단위로 반올림해 날씨 조회에만 사용합니다. 직접 입력한 값은 유지합니다.</p>
              <p className="checkin-field__hint">날씨 데이터: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a></p>
              {weatherState.message && <p role={weatherState.error ? "alert" : "status"}>{weatherState.message}</p>}
            </div>
            <div className="checkin-group__fields">
              {renderNumberField("temperature")}
              <fieldset
                className="checkin-field checkin-weather"
                aria-describedby={errors.weather ? "weather-error" : undefined}
              >
                <legend className="checkin-field__label">날씨 상태</legend>
                <div className="checkin-weather__options">
                  {WEATHER_OPTIONS.map((option) => (
                    <label key={option.value} className="checkin-weather__option">
                      <input
                        type="radio"
                        name="weather"
                        value={option.value}
                        checked={values.weather === option.value}
                        onChange={updateValue("weather")}
                        disabled={isSubmitting}
                        aria-invalid={errors.weather ? "true" : "false"}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
                {errors.weather && (
                  <p id="weather-error" className="checkin-field__error">
                    {errors.weather}
                  </p>
                )}
              </fieldset>
            </div>
          </fieldset>
        </Card>

        <div className="checkin-form__actions">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "분석 중..." : "분석 요청"}
          </Button>
        </div>
      </form>
    </>
  );
}
