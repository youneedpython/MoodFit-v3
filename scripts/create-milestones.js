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
 *   REPO_NAME: Repository name (default: today-v3)
 */

const https = require('https');

const OWNER = process.env.REPO_OWNER || 'youneedpython';
const REPO = process.env.REPO_NAME || 'today-v3';
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

  let created = 0;
  let failed = 0;

  for (const milestone of milestones) {
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
