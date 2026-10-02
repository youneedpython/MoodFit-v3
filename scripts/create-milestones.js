#!/usr/bin/env node

/**
 * Create GitHub Milestones for MoodFit v3 Project
 * 
 * Usage:
 *   GITHUB_TOKEN=<your-token> node scripts/create-milestones.js
 * 
 * Environment Variables:
 *   GITHUB_TOKEN: GitHub Personal Access Token (required)
 *   REPO_OWNER: Repository owner (default: youneedpython)
 *   REPO_NAME: Repository name (default: MoodFit-v3)
 */

const https = require('https');

const OWNER = process.env.REPO_OWNER || 'youneedpython';
const REPO = process.env.REPO_NAME || 'MoodFit-v3';
const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.error('Error: GITHUB_TOKEN environment variable is required');
  console.error('Usage: GITHUB_TOKEN=<your-token> node scripts/create-milestones.js');
  process.exit(1);
}

const milestones = [
  {
    title: 'Milestone 1: Project Bootstrap',
    description: `목적: Spring Boot 4.1.1과 React 19 기반 프로젝트 스켈레톤 생성

선행 조건:
- docs/06-PLAN.md 승인
- Gate A 승인
- Spring Boot Version Re-review 승인

주요 산출물:
- Frontend: React + Vite + TypeScript 기반
- Backend: Spring Boot + Gradle 기반
- .env.example, .gitignore 보완

완료 조건:
- Frontend/Backend Skeleton 생성
- 승인된 Version 사용 확인
- npm test & npm run build 성공
- ./gradlew test & ./gradlew build 성공
- 외부 MySQL 없이 검증 성공
- 실제 Secret 미포함`
  },
  {
    title: 'Milestone 2: Initial Local Verification Harness',
    description: `목적: 반복 가능한 로컬 검증 절차 구성

선행 조건:
- Milestone 1 완료
- Frontend/Backend Test/Build 가능 상태

주요 산출물:
- scripts/verify.ps1
- scripts/verify.sh
- Frontend Test/Build 검증 절차
- Backend Test/Build 검증 절차

완료 조건:
- 로컬 검증 스크립트 반복 실행 가능
- 초기 Frontend/Backend Test/Build 포함
- 실패 시 종료 코드 보장`
  },
  {
    title: 'Milestone 3: Initial GitHub Actions CI',
    description: `목적: Local Verification과 동등한 검증을 GitHub Actions에서 수행

선행 조건:
- Milestone 2 완료
- Local Verification 성공

주요 산출물:
- GitHub Actions CI Workflow
- Frontend Test/Build
- Backend Test/Build

완료 조건:
- CI가 초기 Test/Build 정상 수행
- MySQL Service Container 미사용
- CI 실패를 숨기지 않음`
  },
  {
    title: 'Milestone 4: Backend Domain / API Skeleton',
    description: `목적: API Contract와 Domain 경계 정의, Wellness Rule 구현 전 검증 가능한 Backend 기반 준비

선행 조건:
- Milestone 1, 2, 3 완료
- docs/05-API_SPEC.md 확인

주요 산출물:
- Request/Response DTO 구조
- Controller Skeleton
- Service Interface 또는 빈 Service 구조
- Repository 구조
- Error Response 구조

완료 조건:
- API Skeleton이 Contract와 충돌하지 않음
- Wellness Rule이 필요한 부분은 보류
- Backend 검증이 Local Verification과 CI에 반영`
  },
  {
    title: 'Milestone 5: Wellness Analysis / Recommendation Rule Approval',
    description: `목적: DEC-014 Wellness Analysis Rule 후보 제안 및 Human Review

선행 조건:
- Milestone 4 완료
- docs/09-DECISIONS.md DEC-014 확인

주요 산출물:
- Wellness Score 계산식 후보
- Mood 판정 기준 후보
- Metric 가중치, Weather 영향, Temperature 처리 정책
- Food/Music Recommendation Rule 후보

완료 조건:
- Gate B 필요
- Human이 모든 Rule과 Edge Case 승인
- 승인된 Rule이 docs/09-DECISIONS.md에 기록`
  },
  {
    title: 'Milestone 6: Backend Domain / API Core',
    description: `목적: 승인된 Rule 기반으로 Check-in 저장, 분석, 추천 생성, 조회 구현

선행 조건:
- Milestone 4, 5 완료
- Gate B 승인 완료

주요 산출물:
- WellnessCheckin Entity
- Wellness Analysis Service
- Recommendation Service
- POST/GET API 구현

완료 조건:
- Check-in 저장과 분석 결과 생성 수행
- 주요 Backend Test 통과
- Backend 검증이 Local Verification과 CI에 반영`
  },
  {
    title: 'Milestone 7: Frontend Foundation / Design System',
    description: `목적: v3 화면 구현을 위한 공통 UI 기반 및 Route 구조 생성

선행 조건:
- Milestone 1, 2, 3 완료
- Gate A 승인 완료
- docs/02-V1-REFERENCE.md 확인

주요 산출물:
- React Router 기반 Route 구조
- 공통 Layout 및 Component (Button, Card, Badge, MetricCard 등)
- styles/tokens.css, styles/global.css
- API Client 기본 구조

완료 조건:
- Frontend 기반이 주요 화면 연결 가능
- 공통 Component 렌더링 Test 통과
- Frontend 검증이 Local Verification과 CI에 반영`
  },
  {
    title: 'Milestone 8: Daily Check-in',
    description: `목적: 사용자가 신체 리듬과 날씨를 입력하고 Backend 분석 요청 가능하게 함

선행 조건:
- Milestone 6, 7 완료

주요 산출물:
- Daily Check-in 화면 및 입력 Form
- Client-side Validation
- API 제출 흐름 (Submitting/Success/Error 상태)

완료 조건:
- 사용자가 Check-in 저장 가능
- Validation Error 필드 가까이 표시
- 저장/분석 중 중복 제출 방지`
  },
  {
    title: 'Milestone 9: Dashboard',
    description: `목적: 최신 Check-in 결과와 추천 정보를 한 화면에서 확인

선행 조건:
- Milestone 6, 7, 8 완료

주요 산출물:
- Dashboard 화면
- Wellness Hero
- 5개 Body Metric Card
- Food/Music Recommendation Card
- Empty/Loading/Error 상태

완료 조건:
- Dashboard에서 최신 분석 결과 확인 가능
- Empty/Loading/Error 상태 명확히 처리
- Responsive Layout 검토 완료`
  },
  {
    title: 'Milestone 10: History / Trend',
    description: `목적: 최근 7일 웰니스 상태 변화와 추천 이력 요약 확인

선행 조건:
- Milestone 6, 7, 9 완료

주요 산출물:
- History 화면
- 최근 7일 Wellness Score Trend
- 날짜별 Mood, 주요 Metric 요약
- 추천 이력 요약

완료 조건:
- History에서 최근 7일 기록 확인 가능
- Trend는 CSS/SVG 기반 단순 Component
- 외부 Chart Library 미사용`
  },
  {
    title: 'Milestone 11: Verification Hardening',
    description: `목적: Core Feature 완료 후 전체 Frontend/Backend Test와 Build 범위 검증

선행 조건:
- Milestone 8, 9, 10 완료
- Local Verification 누적 확장 완료
- CI 누적 확장 완료

주요 산출물:
- 전체 Frontend/Backend Test/Build 검증
- Local Verification 범위 점검
- CI 범위 점검
- Verification Gap 목록

완료 조건:
- Core Feature 전체에 대한 Test/Build 통과
- Local Verification과 CI가 Core MVP 검증 범위 반영
- 남은 Verification Gap 명확히 기록`
  },
  {
    title: 'Milestone 12: GitHub Actions Bot',
    description: `목적: 검증 결과나 Harness 관련 기록 자동화

선행 조건:
- Milestone 2, 3, 11 완료
- Local Verification/CI 안정화
- Core Feature 구현 및 검증 완료

주요 산출물:
- GitHub Actions Bot 도입 계획
- 검증 결과 또는 Harness 기록 자동화

완료 조건:
- Bot이 Source Code 자동 수정하지 않음
- 기록/검증 결과가 의도한 위치에 저장
- Local Verification/CI 안정성 유지`
  },
  // Post-MVP 보완 (TASK-011 / TASK-012 후속 보완 작업 후보 FU-1 ~ FU-5)
  {
    title: 'Milestone 13: Local Verification Environment Alignment',
    description: `목적: Local Verification과 CI 실행 환경 차이 축소 (FU-2)

주요 산출물:
- verify.ps1 / verify.sh에 npm ci 단계 추가
- .nvmrc 또는 engines로 Node.js 24.21.0 명시

완료 조건:
- Local Verification이 CI와 같은 방식으로 Frontend 의존성 설치
- 승인된 Node.js Version이 Repository에 명시됨`
  },
  {
    title: 'Milestone 14: Gradle Wrapper Version Review',
    description: `목적: Gradle Wrapper Version 유지 / 변경 결정 (FU-5)

선행 조건:
- Milestone 13 완료

완료 조건:
- Gradle Wrapper Version 결정이 DEC-015에 기록됨
- 변경 시 Backend Test / Build와 CI 통과`
  },
  {
    title: 'Milestone 15: Timezone-fixed Date Display Test',
    description: `목적: 날짜 / 시각 표시를 고정 Timezone 기준으로 검증 (FU-4)

선행 조건:
- Milestone 14 완료

완료 조건:
- 날짜 / 시각 표시 Test가 실행 환경 Timezone과 관계없이 같은 결과`
  },
  {
    title: 'Milestone 16: DB Integration Test (MySQL)',
    description: `목적: DB 연동 테스트 — Backend를 실제 MySQL에 연결해 검증 (FU-3)

선행 조건:
- Milestone 15 완료
- Gate C (검증 도구, DEC-009 / DEC-019 재검토)

완료 조건:
- 실제 MySQL에서 Schema 적용과 저장 / 조회 자동 검증
- CI Database Strategy 변경이 DEC로 기록됨`
  },
  {
    title: 'Milestone 17: API Contract Test (Frontend / Backend)',
    description: `목적: API 계약 테스트 — Frontend / Backend가 API 형식을 지키는지 자동 검증 (FU-1)

선행 조건:
- Milestone 16 완료
- Gate C (계약 테스트 방식 / 도구 선택)

완료 조건:
- API 계약 위반이 Local Verification과 CI에서 자동으로 발견됨`
  },
  // Agent 자동화 / AWS 배포 Roadmap (docs/tasks/, TASK-018 ~ TASK-031)
  {
    title: 'Milestone 18: CI Runner OS Transition Hardening',
    description: `목적: \`ubuntu-latest\` → Ubuntu 26 전환(2026-10-19)에 대비해 CI가 Runner Image 변경에도 안정적으로 동작하도록 보완한다. (FU-6)

선행 조건:
- 선행 Task 없음 (2026-10-19 전환 전 완료 목표)

Gate:
- Runner 전략(\`ubuntu-24.04\` 고정 / \`ubuntu-latest\` 유지 + 보완)은 CI 동작 변경이므로 Human Approval

완료 조건:
- 승인된 Runner 전략이 Remote CI에서 검증되고 FU-6이 DONE으로 기록된다.

상세: docs/tasks/TASK-018_CI_RUNNER_OS_HARDENING.md`
  },
  {
    title: 'Milestone 19: Multi-Agent Automation Policy',
    description: `목적: Codex(Executor) / Claude(Reviewer) / Orchestrator / Human의 권한, Human Gate, 승인 채널, 로그인 정책을 정의한다. 정책 / 계약 설계만 하며 자동화 Code는 만들지 않는다.

선행 조건:
- TASK-018 완료

Gate:
- DEC-026 Human Approval, 승인 후 AGENTS.md 반영

완료 조건:
- DEC-026이 Human Approved 되고 승인된 정책이 AGENTS.md에 반영된다.

상세: docs/tasks/TASK-019_MULTI_AGENT_POLICY.md`
  },
  {
    title: 'Milestone 20: Local Multi-Agent Orchestrator',
    description: `목적: 로컬에서 한 명령으로 Codex 실행 → Deterministic Verify → Claude Review → 제한된 Rework가 동작하는 Orchestrator를 만든다. (Node.js 24 + \`.mjs\`, Dependency 없음)

선행 조건:
- TASK-019 완료

Gate:
- 확정된 언어 / Runtime 외 Runtime이나 새 Dependency가 필요하면 Gate C

완료 조건:
- Local Multi-Agent Loop가 Fake CLI와 실제 로그인된 CLI로 재현 / 검증된다.

상세: docs/tasks/TASK-020_LOCAL_ORCHESTRATOR.md`
  },
  {
    title: 'Milestone 21: Git / PR Harness',
    description: `목적: Orchestrator에 안전한 Branch / Stage / Commit / Push / PR 계층을 추가한다. (Human GitHub 로그인 후 사용)

선행 조건:
- TASK-020 완료

Gate:
- Git 권한 확대, GitHub CLI 도입, Auto Merge 정책은 Human Approval

완료 조건:
- Task Branch → Safe Stage → Commit → Push → PR 흐름이 정책대로 검증된다.

상세: docs/tasks/TASK-021_GIT_PR_HARNESS.md`
  },
  {
    title: 'Milestone 22: GitHub CI Integration / PR Gate',
    description: `목적: 로컬 Harness가 만든 PR을 GitHub의 Deterministic CI와 Human 승인으로 마무리하는 흐름을 완성한다. GitHub Actions에서는 Agent를 실행하지 않는다.

선행 조건:
- TASK-021 완료

Gate:
- CI 동작 변경 / Branch Protection은 Gate C

완료 조건:
- End-to-End Harness Run(로컬 실행 → PR → CI → Human Approve → Merge)이 검증된다.

상세: docs/tasks/TASK-022_GITHUB_CI_INTEGRATION.md`
  },
  {
    title: 'Milestone 23: AWS Architecture / Cost Gate',
    description: `목적: AWS Resource 생성 전 Architecture / Cost / Security / 계정 구조 / RDS Version을 결정한다.

선행 조건:
- TASK-022 완료

Gate:
- Architecture, Region, 계정 / SSO 범위, Network, RDS, 비용 상한은 Human Approval

완료 조건:
- Architecture / Cost Decision이 Human Approved 된다.

상세: docs/tasks/TASK-023_AWS_ARCHITECTURE_GATE.md`
  },
  {
    title: 'Milestone 24: Deployment Artifact / Container / Health',
    description: `목적: Frontend / Backend 배포 Artifact를 재현 가능하게 만들고 Health Check 전략을 확정한다.

선행 조건:
- TASK-023 완료

Gate:
- 새 Dependency, Health API, API Contract, Base Image 정책 변경 시 Gate C

완료 조건:
- 배포 Artifact가 로컬에서 재현 / 검증되고 Health 전략이 문서화된다.

상세: docs/tasks/TASK-024_DEPLOYMENT_ARTIFACT_CONTAINER_HEALTH.md`
  },
  {
    title: 'Milestone 25: AWS SSO / GitHub OIDC / IAM Gate',
    description: `목적: 사람 / 로컬 Agent는 AWS SSO(Human 로그인 후 Agent 작업), CI / CD는 GitHub OIDC로 장기 Access Key 없이 접근하도록 설계한다.

선행 조건:
- TASK-023 완료 (TASK-024 권장)

Gate:
- IAM Identity Center, Permission Set, IAM, GitHub Environment, Secret 정책은 Human Approval

완료 조건:
- SSO / OIDC / IAM / Environment 정책이 승인되고 Human이 SSO / Profile 구성을 마친다.

상세: docs/tasks/TASK-025_AWS_SSO_OIDC_IAM_GATE.md`
  },
  {
    title: 'Milestone 26: AWS IaC Foundation',
    description: `목적: Network / ECR / S3·CloudFront / RDS / Secret Reference를 IaC(CloudFormation 우선)로 정의한다.

선행 조건:
- TASK-023, TASK-025 완료

Gate:
- 실제 비용 Resource 생성 전 Human Approval Checkpoint

완료 조건:
- IaC가 정적 검증되고 최초 Apply / Change Set 승인 준비가 된다.

상세: docs/tasks/TASK-026_AWS_IAC_FOUNDATION.md`
  },
  {
    title: 'Milestone 27: AWS Application Infrastructure',
    description: `목적: ECS Fargate / ALB / RDS 연동과 Frontend → API Routing을 IaC로 완성한다.

선행 조건:
- TASK-024, TASK-026 완료

Gate:
- IaC 검증과 비용 Gate

완료 조건:
- Application Infra Template이 검증되고 Staging 적용 준비가 된다.

상세: docs/tasks/TASK-027_AWS_APPLICATION_INFRA.md`
  },
  {
    title: 'Milestone 28: Staging Deployment / Smoke Test',
    description: `목적: 최초 Staging 환경을 로컬(SSO Staging Profile)에서 배포하고 End-to-End Smoke Test를 한다.

선행 조건:
- TASK-025 승인, TASK-026 / TASK-027 완료

Gate:
- Change Set 적용과 비용 Resource 생성은 Human Approval

완료 조건:
- Staging URL / API가 동작하고 Smoke Test PASS, Resource / 비용 Inventory가 기록된다.

상세: docs/tasks/TASK-028_STAGING_DEPLOYMENT_SMOKE.md`
  },
  {
    title: 'Milestone 29: Staging Continuous Deployment',
    description: `목적: \`main\`의 검증된 변경을 GitHub OIDC로 Staging에 자동 배포한다.

선행 조건:
- TASK-028 완료

Gate:
- CD 동작 변경은 Gate C

완료 조건:
- 검증된 Commit이 Staging에 자동 배포되고 Smoke Test가 자동 PASS한다.

상세: docs/tasks/TASK-029_STAGING_CD.md`
  },
  {
    title: 'Milestone 30: Production Continuous Deployment',
    description: `목적: Release Tag(\`v3.x.y\`, DEC-025) 단위로 Staging에서 검증된 Artifact를 Human 승인 후 Production에 배포한다.

선행 조건:
- TASK-029 완료

Gate:
- Production 배포 / 최초 생성 / 파괴적 Migration은 Human Approval

완료 조건:
- Human 승인 후 Production 배포와 Smoke Test가 성공하고 Rollback 절차가 검증된다.

상세: docs/tasks/TASK-030_PRODUCTION_CD.md`
  },
  {
    title: 'Milestone 31: Operations / Cost Guard / Cleanup',
    description: `목적: 운영 / 비용 / 삭제 / 복구 관점의 최종 Hardening과 문서 동기화를 한다.

선행 조건:
- TASK-030 완료

Gate:
- Resource 삭제, RDS Snapshot / Delete, Budget, Destructive Cleanup은 Human Approval

완료 조건:
- 운영 / 비용 / 삭제 / 복구 정책이 Human Review를 통과하고 문서와 실제 환경이 동기화된다.

상세: docs/tasks/TASK-031_OPERATIONS_COST_CLEANUP.md`
  }
];

function makeRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `token ${TOKEN}`,
        'User-Agent': 'MoodFit-v3-Milestone-Creator',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null
          });
        } else {
          reject({
            status: res.statusCode,
            message: data
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function createMilestones() {
  console.log(`Creating ${milestones.length} milestones for ${OWNER}/${REPO}...\n`);

  // 다시 실행해도 안전하도록 이미 있는 Milestone(제목 기준, open / closed 모두)은 건너뛴다.
  const existing = await makeRequest('GET', `/repos/${OWNER}/${REPO}/milestones?state=all&per_page=100`);
  const existingTitles = new Set(existing.data.map((milestone) => milestone.title));

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const milestone of milestones) {
    if (existingTitles.has(milestone.title)) {
      console.log(`- Skipped (already exists): ${milestone.title}`);
      skipped++;
      continue;
    }
    try {
      const response = await makeRequest(
        'POST',
        `/repos/${OWNER}/${REPO}/milestones`,
        {
          title: milestone.title,
          description: milestone.description,
          state: 'open'
        }
      );

      console.log(`✓ Created: ${milestone.title}`);
      console.log(`  URL: ${response.data.html_url}\n`);
      created++;
    } catch (error) {
      console.error(`✗ Failed to create: ${milestone.title}`);
      console.error(`  Status: ${error.status}`);
      console.error(`  Message: ${error.message}\n`);
      failed++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Summary:`);
  console.log(`  Created: ${created}/${milestones.length}`);
  console.log(`  Skipped: ${skipped}/${milestones.length}`);
  console.log(`  Failed: ${failed}/${milestones.length}`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

createMilestones().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
