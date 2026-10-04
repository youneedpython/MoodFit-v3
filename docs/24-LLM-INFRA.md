# TASK-046 — LLM 환경 값과 계정 간 호출 권한

2026-10-04 Human 승인 A안 / DEC-037에 따른 Infra 구현이다. TASK-045 문서가 이 Branch에 없어 충돌 방지를 위해 이 문서에 기록한다. 실제 호출 기능은 TASK-045에 의존하며 Executor DONE은 Verify / Review / Human Squash Merge나 실제 호출 성공을 대신하지 않는다.

## 환경 값

| Backend 환경 변수 | App Parameter | 기본값 / 동작 |
|---|---|---|
| LLM_ENABLED | LlmEnabled | false; true일 때만 활성화 |
| LLM_MODEL_ID | LlmModelId | anthropic.claude-sonnet-5-5 |
| LLM_REGION | LlmRegion | ap-northeast-2 |
| LLM_ROLE_ARN | LlmRoleArn | 빈 값이면 환경 변수 자체를 생략, 값이 있으면 AssumeRole |
| LLM_DAILY_INSIGHT_LIMIT | 없음 | Backend 기본 10 |
| LLM_DAILY_REPORT_LIMIT | 없음 | Backend 기본 2 |

하루 한도는 Parameter로 만들지 않는다. App / IAM의 LlmRoleArn은 빈 문자열 또는 wildcard 없는 IAM Role ARN만 허용한다. 예시 Parameter 파일의 `<LlmRoleArn>`은 로컬 비추적 파일에서 실제 값으로 바꾸거나 미사용 시 빈 문자열로 바꾼다. 기본 비활성 상태로 유지하려면 LlmEnabled는 false로 둔다.

## 계정과 환경 경계

MoodFit 계정에서는 해당 모델을 사용할 수 없어 Human의 다른 계정에 Bedrock 호출 전용 Role을 만든다. API Key 없이 ECS Task Role → STS AssumeRole → SigV4 Messages API로 호출하며 비용은 호출 전용 Role이 있는 계정에 청구된다. Agent와 Claude 세션은 다른 계정에 접근하지 않는다.

IAM Template에는 환경별로 생성되는 TaskRole Resource 하나가 있다. Environment에 따라 별도 Stack의 Role이 되며 Production TaskRole Resource를 별도로 추가하지 않는다. 해당 Stack에 전달한 ARN 하나에만 sts:AssumeRole을 허용하고 빈 값이면 Policy를 생략한다. ExecutionRole은 변경하지 않는다. Staging IAM / App에 동일한 호출 Role ARN을 전달하며 Production Stack은 갱신하지 않는다. Production 적용은 별도 승인 후 해당 환경의 Task Role 하나를 신뢰하는 별도 호출 Role과 해당 환경 Parameter로 분리한다.

## Merge 후 Human 콘솔 절차

1. MoodFit IAM Stack 출력에서 Task Role ARN을 확인한다. 실제 ARN / 계정 ID는 문서, Prompt, Log에 쓰지 않는다.
2. 다른 계정 콘솔 → IAM → Role 생성 → 사용자 지정 신뢰 정책을 선택한다. [Trust 예시](../infra/iam/llm-invocation-trust.example.json)의 Placeholder를 위 Task Role ARN 하나로 교체한다. 계정 전체 Principal이나 wildcard를 쓰지 않는다.
3. [Permission 예시](../infra/iam/llm-invocation-permission.example.json)를 연결한다. Action은 bedrock-mantle:CreateInference 하나만 허용한다. Role 이름은 예를 들어 `moodfit-bedrock-invoke`로 정하고 생성 후 ARN을 로컬에서 확인한다.
4. MoodFit Staging IAM Stack UPDATE Change Set에 LlmRoleArn을 전달한다. 기존 Parameter를 유지하고 TaskRole에 해당 ARN 하나의 AssumeRole 권한만 추가되는지 검토 후 Human이 실행한다.
5. CD가 진행 중이지 않은지 확인한다. 현재 실행 중인 backend Image digest와 마지막 성공 CD Summary를 대조하여 BackendImage에 넣는다. App Stack UPDATE Change Set에 LlmEnabled true, 동일한 LlmRoleArn, 승인 모델 / Region을 전달하고 기존 설정을 유지한다. 오래된 Image로 돌아가지 않는지 검토 후 Human이 실행한다. CD는 현재 Task Definition을 복사해 Image만 바꾸므로 이 설정을 이어받는다.
6. 단일 COMPLETED Deployment, desired / running 2, pending 0과 Health를 확인한다. 소셜 로그인 → Check-in → AI 코멘트 표시를 확인하고 TASK-045 주간 리포트도 확인한다. 실패하면 Application Log의 권한 거부 / 시간 초과 등 실패 종류만 확인한다. 원문이나 민감 값을 Agent에 전달하지 않는다.
7. 끄려면 현재 digest를 유지한 App UPDATE에서 LlmEnabled를 false로 바꾼다. 비용 차단을 위해 다른 계정 Role을 삭제하거나 Trust를 비운다. 이미 발급된 임시 세션은 만료 전까지 유효할 수 있으므로 즉시 차단이 필요하면 Human이 활성 Role 세션 취소도 검토한다.

## 확인하지 못한 것과 검증 한계

승인 Contract는 `https://bedrock-mantle.<region>.api.aws/anthropic/v1/messages`의 서울 / 버지니아 북부 / 도쿄 비인증 요청 401 응답과 필요한 Action을 기록한다. 이는 실제 인증 호출 성공 증거가 아니다. Resource를 모델 단위로 좁히는 형식은 확인 필요하며 추측한 ARN은 쓰지 않는다. Permission 예시의 Resource *는 이 미확정 사항에 따른 승인 범위다.

정적 검증은 `bash scripts/iac-validate.sh`, `git diff --check`를 사용한다. Sandbox 밖 Orchestrator Verify가 기준이며 실제 Role 생성 / Stack 갱신 / AI 응답과 과금 확인은 Merge 후 Human이 수행한다.
