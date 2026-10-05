import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "../../components/Button/Button";
import { Card } from "../../components/Card/Card";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { ErrorState } from "../../components/StateView/StateView";
import { ApiError, checkinApi } from "../../services/api";
import { fetchLocalWeather, readAutoWeather, saveAutoWeather, WeatherError, LocationDeniedError } from "../../services/weather";
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
  const [region, setRegion] = useState<string | null>(null);
  const [weatherState, setWeatherState] = useState({ loading: false, message: "", error: false });
  const weatherEdited = useRef(false);
  const weatherRequest = useRef<AbortController | null>(null);

  function setWeatherPreference(enabled: boolean) {
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
    setWeatherState({ loading: true, message: "현재 위치의 날씨를 조회하고 있습니다.", error: false });
    try {
      const result = await fetchLocalWeather(controller.signal);
      if (controller.signal.aborted) return;
      if (!weatherEdited.current && !submittingRef.current) {
        setValues((current) => ({ ...current, temperature: String(result.temperature), weather: result.weather }));
        setRegion(result.region && result.region !== "현재 위치" ? result.region : null);
        setErrors((current) => ({ ...current, temperature: undefined, weather: undefined }));
      }
      setWeatherState({ loading: false, message: "현재 위치의 날씨를 가져왔습니다. 직접 입력으로 바꿔 수정할 수 있습니다.", error: false });
    } catch (error) {
      if (!controller.signal.aborted) {
        setAutoWeather(false);
        if (error instanceof LocationDeniedError) saveAutoWeather(false);
        setWeatherState({ loading: false, message: error instanceof WeatherError ? error.message : "날씨 조회에 실패했습니다. 직접 입력해 주세요.", error: true });
      }
    } finally {
      if (weatherRequest.current === controller) weatherRequest.current = null;
    }
  }

  useEffect(() => {
    if (readAutoWeather()) void getWeather();
    return () => { weatherRequest.current?.abort(); weatherRequest.current = null; };
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
    void submit(region ? { ...validation.request, region } : validation.request);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    validateAndSubmit();
  }

  function startOver() {
    weatherEdited.current = false;
    setValues(EMPTY_FORM);
    setRegion(null);
    setErrors({});
    setSubmitState({ status: "editing" });
    if (autoWeather) void getWeather();
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
        {(["sleepScore", "stressLevel", "energyLevel"] as NumberFieldName[]).includes(name) && (
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            aria-label={`${field.label} Slider`}
            aria-valuetext={values[name] === "" ? "입력 안 함" : undefined}
            className="checkin-field__slider"
            value={values[name] === "" ? 50 : Math.min(100, Math.max(0, Number(values[name])))}
            onChange={updateValue(name)}
            disabled={isSubmitting}
          />
        )}
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
              <div className={`checkin-group__fields checkin-group__fields--${group.fields.length}`}>{group.fields.map(renderNumberField)}</div>
            </fieldset>
          </Card>
        ))}

        <Card>
          <fieldset className="checkin-group">
            <legend className="checkin-group__legend">날씨</legend>
            <p className="checkin-group__description">{autoWeather ? "현재 위치의 날씨를 자동으로 가져옵니다." : "현재 위치의 기온과 날씨를 입력해 주세요."}</p>
            <div className="checkin-weather-layout">
              <div className="checkin-weather-content">
                  <p>날씨 모드: {autoWeather ? "자동" : "직접 입력"}</p>
                  {weatherState.message && <p aria-live="polite" role={weatherState.error ? "alert" : "status"}>{weatherState.message}</p>}
                {autoWeather ? <div aria-live="polite" className="checkin-weather-summary">
                  <p>{values.temperature && values.weather ? `${region || "현재 위치"} · ${WEATHER_OPTIONS.find((option) => option.value === values.weather)?.label} · ${values.temperature}°C` : "날씨 조회 결과를 기다리고 있습니다."}</p>
                  {errors.temperature && <p role="alert" className="checkin-field__error">{errors.temperature}</p>}
                  {errors.weather && <p role="alert" className="checkin-field__error">{errors.weather}</p>}
                </div> : <div className="checkin-group__fields">
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
                </div>}
              </div>
              <div className="checkin-weather-tools">
                <Button variant="secondary" type="button" disabled={isSubmitting || weatherState.loading} onClick={() => { setWeatherPreference(true); weatherEdited.current = false; void getWeather(); }}>
                  {weatherState.loading ? "날씨 조회 중..." : autoWeather ? "다시 조회" : "자동으로 가져오기"}
                </Button>
                {autoWeather && <Button variant="secondary" type="button" disabled={isSubmitting} onClick={() => setWeatherPreference(false)}>직접 입력</Button>}
              </div>
              <div className="checkin-weather-notes">
                <p className="checkin-field__hint">위치(좌표)는 소수 둘째 자리로 반올림해 조회에만 사용하며 저장하지 않습니다. 지역 이름은 기록과 함께 저장됩니다.</p>
                <div className="checkin-weather-sources">
                  <p className="checkin-field__hint">지역 이름: <a href="https://www.bigdatacloud.com/" target="_blank" rel="noreferrer">BigDataCloud</a></p>
                  <p className="checkin-field__hint">날씨 데이터: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a></p>
                </div>
              </div>
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
