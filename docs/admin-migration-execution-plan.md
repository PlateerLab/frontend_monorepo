# Admin Feature Migration Execution Plan

> **목표:** 19개 admin stub feature → xgen-frontend 소스 기반 완전한 구현 마이그레이션
> **아키텍처:** `PACKAGE (@xgen/*) → FEATURE (admin-*) → APP (apps/web)`

---

## 아키텍처 원칙 (Architecture Principles)

```
┌─────────────────────────────────────────────────────────┐
│  apps/web                                               │
│  ├─ 조립만 (assembly only)                                │
│  ├─ adminFeatureRegistry.ts → 이미 19개 import 완료       │
│  └─ sidebar-admin → 이미 9개 섹션 config 완료              │
├─────────────────────────────────────────────────────────┤
│  features/admin-*                                       │
│  ├─ 각 feature = 독립 패키지 = 삭제해도 다른 feature 영향 없음 │
│  ├─ @xgen/* packages만 import 가능                       │
│  ├─ feature → feature import ❌ (절대 금지)                │
│  └─ Tailwind + cn() 전용 (SCSS 금지)                     │
├─────────────────────────────────────────────────────────┤
│  packages/@xgen/*                                       │
│  ├─ api-client → 도메인별 API 모듈 (system, db, mcp 등)   │
│  ├─ ui → shadcn 기반 공유 UI 컴포넌트                      │
│  ├─ types → AdminFeatureModule, RouteComponentProps 등   │
│  ├─ i18n → useTranslation()                             │
│  ├─ icons → fi*/lu*/si* 아이콘                            │
│  └─ admin-setting-shared → BaseConfigPanel, config API   │
└─────────────────────────────────────────────────────────┘
```

---

## Phase 0: API 모듈 추가 (packages/api-client)

각 카테고리의 API를 `@xgen/api-client`에 추가합니다.

| 파일 | 원본 | 주요 함수 |
|------|------|-----------|
| `admin-system.ts` | system.js | getSystemStatus, streamSystemStatus, getBackendLogs |
| `admin-database.ts` | db.js | getTableList, executeQuery, getDatabaseInfo |
| `admin-crawler.ts` | crawler.ts | getCrawlerSessions, createCrawlerSession, subscribeCrawlerEvents |
| `admin-mcp.ts` | mcp.js | listMCPSessions, createMCPSession, getMCPMarketList |
| `admin-models.ts` | modelManagement.ts | listGPUs, loadModel, listModels |
| `admin-governance.ts` | (new) | getWorkflowRiskAssessments, getInspections, getPolicies, getAuditLogs |

---

## Phase 1: System Status (admin-system 섹션)

### 1.1 admin-system-monitor
```
features/admin-system-monitor/
├── package.json
└── src/
    ├── index.tsx           ← AdminFeatureModule export + SSE 기반 실시간 모니터링
    ├── types.ts            ← SystemData, CPUInfo, MemoryInfo, GPUInfo, DiskInfo, NetworkInfo
    └── components/
        ├── cpu-chart.tsx       ← CPU 사용률 라인 차트
        ├── memory-chart.tsx    ← 메모리 사용률 차트
        ├── gpu-section.tsx     ← GPU 정보 카드 (온도, VRAM)
        ├── disk-chart.tsx      ← 디스크 사용량 바 차트
        ├── network-table.tsx   ← 네트워크 인터페이스 테이블
        └── connection-status.tsx ← SSE 연결 상태 인디케이터
```
**핵심:** SSE(Server-Sent Events) 실시간 스트리밍, 40개 히스토리 라인차트

### 1.2 admin-system-health
```
features/admin-system-health/
├── package.json
└── src/
    ├── index.tsx           ← 서비스 상태 모니터링 메인
    ├── types.ts            ← ServiceInfo, HealthStatus
    └── components/
        ├── health-stats.tsx     ← 통계 카드 (total/healthy/unhealthy/incompatible)
        ├── service-table.tsx    ← 서비스 목록 테이블 (검색 가능)
        └── service-detail.tsx   ← 서비스 상세 (버전, 커밋 해시, 호환성)
```

### 1.3 admin-backend-logs
```
features/admin-backend-logs/
├── package.json
└── src/
    ├── index.tsx           ← 로그 목록 + 검색/필터/정렬
    ├── types.ts            ← BackendLog, LogLevel
    └── components/
        ├── log-filters.tsx      ← 레벨 필터, 검색, 정렬
        ├── log-table.tsx        ← 로그 테이블 (페이지네이션)
        └── log-detail-modal.tsx ← 로그 상세 메타데이터 모달
```

---

## Phase 2: Data Management (admin-data 섹션)

### 2.1 admin-database
```
features/admin-database/
├── package.json
└── src/
    ├── index.tsx           ← SQL 데이터베이스 탐색기
    ├── types.ts            ← QueryResult, TableInfo, ConnectionInfo
    └── components/
        ├── connection-info.tsx   ← DB 연결 상태 + 정보
        ├── table-list.tsx        ← 테이블 목록 (행 수 표시)
        ├── query-editor.tsx      ← SQL 쿼리 입력 + 실행
        ├── result-table.tsx      ← 쿼리 결과 테이블 (정렬 가능)
        └── cell-modal.tsx        ← 긴 값 확장 보기 모달
```

### 2.2 admin-data-scraper
```
features/admin-data-scraper/
├── package.json
└── src/
    ├── index.tsx           ← 크롤러 세션 관리 메인
    ├── types.ts            ← CrawlerSession, CrawlerStatus, CrawlerPage
    └── components/
        ├── scraper-stats.tsx     ← 5개 통계 카드
        ├── session-list.tsx      ← 세션 목록 (SSE 실시간 상태)
        ├── session-create.tsx    ← 세션 생성 폼
        └── data-lake-view.tsx    ← 수집된 데이터 열람
```

### 2.3 admin-storage → Placeholder (Coming Soon)
### 2.4 admin-backup → Placeholder (Coming Soon)

---

## Phase 3: Security & Audit (admin-security 섹션)

### 3.1 admin-security-settings
```
features/admin-security-settings/
├── package.json
└── src/
    ├── index.tsx           ← Guarder 보안 설정
    ├── types.ts            ← SecurityConfig
    └── components/
        └── guarder-config.tsx   ← PII/금지어 관리 (admin-setting-shared 패턴 활용)
```

### 3.2 admin-audit-logs → Placeholder
### 3.3 admin-error-logs → Placeholder

---

## Phase 4: MCP Management (admin-mcp 섹션)

### 4.1 admin-mcp-market
```
features/admin-mcp-market/
├── package.json
└── src/
    ├── index.tsx           ← MCP 마켓 브라우저
    ├── types.ts            ← MCPItem, MCPCategory
    └── components/
        ├── mcp-search-bar.tsx    ← 검색 + 정렬 옵션
        ├── mcp-category-tabs.tsx ← 카테고리 필터 탭
        ├── mcp-card.tsx          ← MCP 아이템 카드
        └── mcp-detail.tsx        ← MCP 상세 정보
```

### 4.2 admin-mcp-station
```
features/admin-mcp-station/
├── package.json
└── src/
    ├── index.tsx           ← MCP 서버 세션 관리
    ├── types.ts            ← MCPSession, MCPTool
    └── components/
        ├── station-health.tsx    ← MCP Station 헬스 상태
        ├── session-list.tsx      ← 세션 목록 + 도구 목록
        ├── session-create.tsx    ← 세션 생성 (Python/Node)
        └── auth-status.tsx       ← MS365 인증 상태/흐름
```

---

## Phase 5: MLOps (admin-ml 섹션)

### 5.1 admin-ml-model-control
```
features/admin-ml-model-control/
├── package.json
└── src/
    ├── index.tsx           ← GPU/모델 로딩 관리
    ├── types.ts            ← GPUInfo, ModelInfo, LoadModelConfig
    └── components/
        ├── gpu-dashboard.tsx     ← GPU 상태 카드
        ├── model-list.tsx        ← 로딩된 모델 목록
        ├── load-model-form.tsx   ← 모델 로딩 폼 (백엔드 선택, GPU 설정)
        └── health-status.tsx     ← LLM/임베딩 상태 표시
```

---

## Phase 6: AI Governance (admin-governance 섹션)

### 6.1 admin-gov-workflow-approval
```
features/admin-gov-workflow-approval/
├── package.json
└── src/
    ├── index.tsx           ← 워크플로우 배포 승인/반려
    ├── types.ts            ← ApprovalRequest, ApprovalStatus
    └── components/
        ├── approval-table.tsx    ← 승인 대기 목록
        └── approval-detail.tsx   ← 승인 상세 + 승인/반려 액션
```

### 6.2 admin-gov-risk-management
```
features/admin-gov-risk-management/
├── package.json
└── src/
    ├── index.tsx           ← AI 위험 평가 관리
    ├── types.ts            ← RiskAssessment, RiskLevel, ChecklistCategory
    └── components/
        ├── risk-table.tsx        ← 워크플로우 위험도 목록
        ├── risk-checklist.tsx    ← 4개 카테고리 체크리스트 평가
        ├── risk-detail.tsx       ← 위험 상세 + 파일 관리
        └── risk-history.tsx      ← 위험도 변경 이력
```

### 6.3 admin-gov-monitoring
```
features/admin-gov-monitoring/
├── package.json
└── src/
    ├── index.tsx           ← 점검 일정 관리
    ├── types.ts            ← InspectionRecord, InspectionCycle, InspectionResult
    └── components/
        ├── inspection-tabs.tsx    ← 3개 탭 (이력/계획/지연)
        ├── inspection-table.tsx   ← 점검 목록 테이블
        ├── inspection-form.tsx    ← 점검 생성/수정 폼
        └── overdue-alerts.tsx     ← 지연 항목 알림
```

### 6.4 admin-gov-control-policy
```
features/admin-gov-control-policy/
├── package.json
└── src/
    ├── index.tsx           ← PII 보호 / 금지어 정책 관리
    ├── types.ts            ← PolicyRule, RegexTemplate, RiskPolicy
    └── components/
        ├── pii-policy.tsx        ← PII 정책 CRUD
        ├── forbidden-words.tsx   ← 금지어 관리
        ├── regex-builder.tsx     ← 정규식 빌더 + 테스트
        ├── regex-templates.tsx   ← 정규식 템플릿 (한국/국제)
        └── risk-policy.tsx       ← 위험 정책 버전 관리
```

### 6.5 admin-gov-operation-history
```
features/admin-gov-operation-history/
├── package.json
└── src/
    ├── index.tsx           ← 거버넌스 운영 이력
    ├── types.ts            ← OperationLog, ActivityType, OperationResult
    └── components/
        ├── operation-stats.tsx   ← 4개 통계 카드
        ├── operation-table.tsx   ← 운영 로그 테이블 (필터/정렬)
        └── operation-detail.tsx  ← 운영 상세 확장
```

### 6.6 admin-gov-audit-tracking
```
features/admin-gov-audit-tracking/
├── package.json
└── src/
    ├── index.tsx           ← 감사 추적 시스템
    ├── types.ts            ← AuditLogEntry, AuditAction, TrackedWorkflow
    └── components/
        ├── audit-tabs.tsx        ← 3개 탭 (로그/추적워크플로우/타임라인)
        ├── audit-log-table.tsx   ← 감사 로그 테이블
        ├── tracked-workflows.tsx ← 추적 워크플로우 목록
        └── audit-timeline.tsx    ← 타임라인 뷰
```

---

## 마이그레이션 체크리스트

### 각 Feature 공통 작업:
- [ ] `types.ts` 작성 (원본 인터페이스 → TypeScript strict 변환)
- [ ] `components/*.tsx` 작성 (SCSS → Tailwind, fetch → @xgen/api-client)
- [ ] `index.tsx` 작성 (AdminFeatureModule + 메인 페이지 컴포넌트)
- [ ] i18n 키 활용 (`useTranslation()`)
- [ ] `@xgen/ui` 컴포넌트 활용 (ContentArea, DataTable, StatusBadge, Modal 등)

### API 작업 (packages/api-client):
- [ ] `admin-system.ts` 추가
- [ ] `admin-database.ts` 추가
- [ ] `admin-crawler.ts` 추가
- [ ] `admin-mcp.ts` 추가
- [ ] `admin-models.ts` 추가
- [ ] `admin-governance.ts` 추가
- [ ] `index.ts`에 re-export 추가

### 마이그레이션 변환 규칙:
| 원본 (xgen-frontend) | 새 버전 (monorepo) |
|---|---|
| `import styles from './xxx.module.scss'` | Tailwind `className="..."` |
| `import { apiClient } from '...'` | `import { createApiClient } from '@xgen/api-client'` |
| `import { useTranslations } from 'next-intl'` | `import { useTranslation } from '@xgen/i18n'` |
| `styles.container` | `"flex flex-col gap-6 p-6"` |
| `<AdminContentArea>` | `<ContentArea>` from `@xgen/ui` |
| `new EventSource(url)` | SSE 함수 in `@xgen/api-client` |
| inline state management | React hooks (useState, useCallback, useMemo) |

---

## 실행 순서

1. **Phase 0** → API 모듈 6개 추가 (모든 feature의 기반)
2. **Phase 1** → System Status 3개 (SSE 실시간 모니터링 패턴 확립)
3. **Phase 2** → Data Management 4개 (SQL, 크롤러, placeholder)
4. **Phase 3** → Security & Audit 3개 (설정 관리 패턴)
5. **Phase 4** → MCP Management 2개 (마켓 + 스테이션)
6. **Phase 5** → MLOps 1개 (모델 관리)
7. **Phase 6** → AI Governance 6개 (가장 복잡한 비즈니스 로직)
