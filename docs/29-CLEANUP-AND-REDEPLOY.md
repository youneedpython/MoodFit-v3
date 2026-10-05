# 29. 환경 정리와 다시 만들기

2026-10-05에 Staging과 Production의 AWS Resource를 모두 정리했다. 이 문서는 무엇을 지웠고 무엇이 남았는지, 다시 만들려면 무엇을 하면 되는지를 적는다.

## 1. 현재 상태

- `https://staging.moodfit.8949db.kr`, `https://moodfit.8949db.kr`은 **열리지 않는다.**
- 저장소의 코드, Template, Runbook, 문서, Release(`v3.1.0` ~ `v3.5.0`), 사용 영상, Wiki는 그대로다.
- `deploy-staging`, `deploy-production` Workflow는 **비활성화**했다. `main`에 Merge해도 배포를 시도하지 않는다. CI는 그대로 동작한다.

## 2. 정리 기록

Human이 2026-10-05에 삭제 목록과 순서를 승인했고("1. 삭제 2. OAuth Secret 직접 지울게 3. 네가 해 4. 한 번에 맡김"), Claude 세션이 위임받은 관리 Profile로 실행했다. 승인한 목록에 없는 것은 지우지 않았다.

### 지운 Stack (13개)

환경마다 만든 순서의 역순으로 지웠다.

| 순서 | Stack | Production | Staging |
|---|---|---|---|
| 1 | app | 삭제 | 삭제 |
| 2 | frontend | 삭제 | 삭제 |
| 3 | data | 삭제 | 삭제 |
| 4 | iam | 삭제 | 삭제 |
| 5 | certificate (us-east-1) | 삭제 | 삭제 |
| 6 | network | 삭제 | 삭제 |
| 7 | ecr | (없음) | 삭제 |

- DB는 삭제 보호를 끈 뒤 Stack을 지웠다. Template의 설정에 따라 마지막 Snapshot이 자동으로 생겼다.
- Production에는 ecr / budget Stack을 만들지 않았다. Production은 Staging의 Image 저장소를 함께 썼다.

### Stack을 지운 뒤 따로 지운 것

Template에서 "남김"(Retain / Snapshot)으로 설정한 Resource다.

| 대상 | 개수 |
|---|---|
| S3 Bucket (화면 파일 2, ALB 접속 Log 2) | 4 |
| ECR 저장소와 Image | 1 |
| DB 접속 정보 Secret | 2 |
| CloudWatch Log Group (Application 2, DB 오류 / 느린 Query 4) | 6 |
| DB 마지막 Snapshot | 2 |
| GitHub OIDC Provider | 1 |

DB Snapshot을 지운 이유: Staging DB에는 실제 로그인 사용자의 기록이 있었고, 개인정보 안내는 백업이 최대 14일 남는다고 설명한다. Snapshot을 계속 보관하면 그 안내와 어긋난다. **기록은 복구할 수 없다.**

### 정리 뒤 확인

삭제 뒤 조회해 0개임을 확인했다: MoodFit Stack(Budget 제외), RDS Instance / Snapshot / 자동 백업, NAT Gateway, 고정 IP, 기본 VPC가 아닌 VPC, Load Balancer, ECS Cluster, CloudFront 배포, 인증서(두 Region), Network Interface, MoodFit Bucket, ECR 저장소, MoodFit Log Group, `moodfit-` IAM Role, OIDC Provider.

## 3. 남긴 것

| 대상 | 이유 | 비용 |
|---|---|---|
| Route 53 Hosted Zone | 프로젝트 전부터 있던 도메인이다 | 월 USD 0.5 |
| `moodfit-staging-budget` Stack | 남은 비용이 있으면 알려 준다 | 무료 |
| OAuth Secret | Human이 직접 넣은 값이라 Human이 직접 지우기로 했다 | 지우기 전까지 월 USD 0.4 |
| 인증서 검증용 DNS Record 4개 | 인증서를 만들 때 자동으로 생긴 것으로 Stack 삭제에 포함되지 않는다. 승인 목록에 없어 지우지 않았다 | 무료 |
| IAM Identity Center 권한 설정, 다른 계정의 AI 호출 Role | Human이 직접 만든 것이다 | 무료 |
| GitHub Environment `staging` / `production`과 Secret | 가리키는 대상이 없어졌다. 다시 만들 때 값을 바꿔 넣는다 | 무료 |

## 4. 다시 만들기

걸리는 시간은 환경 하나에 1시간 30분 ~ 2시간 30분 정도다. 대부분 DB와 CloudFront를 기다리는 시간이다. 2026-10-05의 Production 생성은 Network 시작부터 첫 배포 성공까지 약 1시간 40분이 걸렸다(사람의 승인을 기다린 시간 포함).

### Staging

[Staging Runbook](18-STAGING-DEPLOYMENT-RUNBOOK.md)을 처음부터 따른다. 순서는 budget(이미 있음) → network → ecr → data → certificate → frontend → iam → Image Build / Push → app → iam UPDATE다.

달라지는 점:

1. OIDC Provider를 지웠으므로 iam Parameter는 `CreateOidcProvider=true`로 둔다(Runbook의 기본과 같다).
2. Local Parameter 파일(`infra/cloudformation/local/`)의 Subnet, Security Group, 인증서, Secret, Bucket 값은 모두 새 Stack의 Output으로 바꾼다. 이전 값은 쓸 수 없다.
3. OAuth Secret을 지웠다면 Human이 다시 만들고 값을 넣는다([로그인 안내](22-AUTH.md)). Google / Kakao 콘솔의 Callback 주소는 그대로 쓸 수 있다.
4. AI 호출 Role의 신뢰 대상은 새 Task Role로 바꾼다([LLM 환경 안내](24-LLM-INFRA.md)). Role 이름 끝의 식별자가 달라진다.
5. GitHub Environment `staging`의 Secret 4개를 새 Output으로 바꾼다.
6. `deploy-staging` Workflow를 다시 켠다(Actions 화면 또는 `gh workflow enable deploy-staging`).

### Production

[Production Runbook](28-PRODUCTION-DEPLOYMENT-RUNBOOK.md)을 따른다. Staging의 ECR 저장소와 OIDC Provider가 먼저 있어야 하므로 **Staging을 먼저 만든다.** 그 뒤 GitHub Environment `production`의 Secret 4개를 바꾸고 `deploy-production` Workflow를 다시 켠다.

### 2026-10-05 생성에서 배운 점

- iam Parameter의 Log 쓰기 대상(`EnvironmentLogStreamArnPattern`)은 환경 이름이 경로에 들어간다(`/moodfit/{환경}/application`). Staging 값을 복사해 이름만 바꾸면 이 값이 Staging 것으로 남는다. 그대로 App을 만들면 Task가 Log를 쓰지 못한다. 생성 직후 UPDATE로 고쳤다.
- iam의 예정 Cluster / Service ARN은 이름 규칙만 맞추면 실제 값과 같다. 실행 Role 두 개의 ARN만 iam 생성 뒤 UPDATE로 실제 값을 넣으면 된다.
- Production은 budget Stack을 따로 만들지 않아도 된다. Budget은 계정 전체 비용을 본다.

## 5. 확인하지 못한 것

- 이 문서의 "다시 만들기"는 실제로 다시 만들어 검증하지 않았다.
- Production의 소셜 로그인, AI 문장, 이전 Tag로의 Rollback은 실행해 보지 않았다. Production은 체험 계정과 Smoke Test로만 확인했다.
