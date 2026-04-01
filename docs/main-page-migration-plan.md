# Main 페이지 마이그레이션 계획

> xgen-frontend `/main` 페이지를 frontend_monorepo로 완전히 마이그레이션하는 상세 계획

---

## 목차

1. [현황 분석 요약](#1-현황-분석-요약)
2. [packages 확장 계획](#2-packages-확장-계획)
3. [Feature 세분화 설계](#3-feature-세분화-설계)
4. [공통 컴포넌트 분리 계획](#4-공통-컴포넌트-분리-계획)
5. [마이그레이션 실행 순서](#5-마이그레이션-실행-순서)
6. [파일 구조 명세](#6-파일-구조-명세)
7. [의존성 관계도](#7-의존성-관계도)

---

## 1. 현황 분석 요약

### 1.1 xgen-frontend /main 페이지 구조

```
xgen-frontend/src/app/main/
├── page.tsx                    # 진입점 (AuthGuard + XgenLayoutContent)
├── components/                 # 레이아웃 + 대시보드
│   ├── XgenLayoutContent.tsx   # 메인 레이아웃 컨트롤러
│   ├── XgenPageContent.tsx     # 섹션별 라우터
│   └── MainDashboard.tsx       # 메인 대시보드
├── sidebar/                    # 사이드바 (18개 아이콘 포함)
├── chatSection/                # 채팅 기능 (30+ 파일)
├── workflowSection/            # 워크플로우/문서/도구 (20+ 파일)
├── modelSection/               # LLM 훈련/평가 (15+ 파일)
├── mlSection/                  # ML 모델 훈련 (10+ 파일)
└── dataSection/                # 데이터 처리 (20+ 파일)
```

### 1.2 섹션별 라우팅 맵 (총 25개 섹션)

| 섹션 ID | 컴포넌트 | 카테고리 |
|---------|----------|----------|
| `main-dashboard` | MainDashboard | Workspace |
| `chat-intro` | ChatIntroduction | Chat |
| `new-chat` | ChatContent | Chat |
| `current-chat` | CurrentChatInterface | Chat |
| `chat-history` | ChatHistory | Chat |
| `workflow-intro` | WorkflowIntroduction | Workflow |
| `canvas` | CanvasIntroduction | Workflow |
| `workflows` | CompletedWorkflows | Workflow |
| `documents` | Documents | Workflow |
| `tool-storage` | ToolStorage | Workflow |
| `prompt-store` | PromptStorage | Workflow |
| `auth-profile` | AuthProfile | Workflow |
| `model-intro` | ModelIntroduction | Model |
| `train` | TrainPageContent | Model |
| `train-monitor` | MetricsPageContent | Model |
| `eval` | EvalPageContent | Model |
| `model-storage` | StoragePageContent | Model |
| `ml-model-intro` | MlModelIntroduction | ML |
| `ml-train` | MLTrainPage | ML |
| `model-hub` | MlModelWorkspacePage | ML |
| `data-intro` | DataIntroduction | Data |
| `data-station` | DataStation | Data |
| `data-storage` | DataStorage | Data |
| `service-request` | ServiceRequestForm | Support |
| `support-faq` | FAQ | Support |

### 1.3 발견된 공통 패턴

1. **모달 패턴** - 10개 이상의 모달이 동일한 구조 사용
2. **카드 그리드 패턴** - 5개 이상의 목록 페이지가 동일 패턴
3. **ContentArea 래퍼** - 모든 섹션이 동일한 레이아웃 래퍼 사용
4. **필터 탭 패턴** - all/personal/shared 필터 반복
5. **Introduction 페이지 패턴** - 5개 섹션이 Hero+Features+QuickStart 구조

---

## 2. packages 확장 계획

### 2.1 기존 packages 확장

#### @xgen/ui (대폭 확장)

```
packages/ui/src/
├── index.ts                 # 모든 컴포넌트 re-export
├── styles/
│   ├── _variables.scss      # 디자인 토큰
│   └── _mixins.scss         # 공통 믹스인
│
├── layout/
│   ├── ContentArea.tsx      # 페이지 레이아웃 래퍼
│   ├── ContentArea.module.scss
│   ├── ResizablePanel.tsx   # 분할 패널
│   └── ResizablePanel.module.scss
│
├── feedback/
│   ├── Modal.tsx            # 범용 모달
│   ├── Modal.module.scss
│   ├── Toast.tsx            # 토스트 알림
│   ├── ToastProvider.tsx
│   ├── EmptyState.tsx       # 빈 상태 UI
│   └── EmptyState.module.scss
│
├── data-display/
│   ├── Card.tsx             # 기본 카드
│   ├── Card.module.scss
│   ├── CardGrid.tsx         # 카드 그리드 레이아웃
│   ├── KpiCard.tsx          # 대시보드 KPI 카드
│   ├── Badge.tsx            # 상태 배지
│   ├── DataTable.tsx        # 데이터 테이블
│   └── DirectoryTree.tsx    # 트리 네비게이션
│
├── inputs/
│   ├── SearchInput.tsx      # 검색 입력
│   ├── FormField.tsx        # 폼 필드 래퍼
│   ├── Toggle.tsx           # 토글 버튼
│   └── FilterTabs.tsx       # 필터 탭
│
├── navigation/
│   ├── DropdownMenu.tsx     # 드롭다운 메뉴
│   └── SuggestionChips.tsx  # 추천 칩 버튼
│
└── composite/
    ├── IntroductionPage.tsx # 소개 페이지 템플릿
    └── StorageListPage.tsx  # 저장소 목록 템플릿
```

#### @xgen/icons (확장)

```
packages/icons/src/
├── index.ts
├── sidebar/                 # 사이드바 아이콘 (18개)
├── alert/                   # 알림 아이콘
├── action/                  # 액션 아이콘
└── status/                  # 상태 아이콘
```

#### @xgen/types (확장)

```
packages/types/src/
├── index.ts
├── feature.ts               # FeatureModule 등 기존
├── api.ts                   # ApiResponse, GenerateOptions 등
├── dashboard.ts             # 대시보드 관련 타입
├── workflow.ts              # 워크플로우 관련 타입
├── chat.ts                  # 채팅 관련 타입
├── document.ts              # 문서 관련 타입
└── model.ts                 # 모델 훈련 관련 타입
```

### 2.2 신규 packages 생성

#### @xgen/api-client (신규)

```
packages/api-client/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── createApiClient.ts     # 클라이언트 팩토리
    ├── WebApiClient.ts        # 웹 환경 클라이언트
    ├── TauriApiClient.ts      # Tauri 환경 (optional)
    ├── types.ts               # API 타입
    └── domains/               # 도메인별 API 모듈
        ├── auth.ts
        ├── workflow.ts
        ├── document.ts
        ├── model.ts
        └── chat.ts
```

#### @xgen/auth-provider (신규)

```
packages/auth-provider/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── AuthProvider.tsx       # Context Provider
    ├── useAuth.ts             # useAuth 훅
    ├── AuthGuard.tsx          # 인증 가드
    ├── SectionGuard.tsx       # 섹션 권한 가드
    └── types.ts               # 인증 타입
```

#### @xgen/config (신규)

```
packages/config/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── environment.ts         # 환경변수 관리
    ├── getBackendUrl.ts       # 백엔드 URL 헬퍼
    └── types.ts
```

#### @xgen/utils (신규)

```
packages/utils/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── logger.ts              # 로깅 유틸
    ├── storage.ts             # localStorage/sessionStorage
    ├── cookie.ts              # 쿠키 유틸
    ├── string.ts              # 문자열 파싱
    └── hash.ts                # 해시 생성
```

---

## 3. Feature 세분화 설계

### 3.1 설계 원칙 적용

README 원칙에 따라:
- Feature는 독립적으로 존재 (자체 package.json, src/)
- Feature 간 import 금지
- 삭제/추가해도 앱 깨지지 않음
- @xgen/types 인터페이스 구현

### 3.2 Feature 목록 (총 24개)

#### Workspace (1개)
| Feature ID | 디렉토리 | 역할 |
|------------|----------|------|
| `main-Dashboard` | `features/main-Dashboard/` | 메인 대시보드 (KPI, 업데이트, 에러) |

#### Chat (4개)
| Feature ID | 디렉토리 | 역할 |
|------------|----------|------|
| `main-ChatIntro` | `features/main-ChatIntro/` | 채팅 소개 페이지 |
| `main-ChatNew` | `features/main-ChatNew/` | 새 채팅 시작 |
| `main-ChatCurrent` | `features/main-ChatCurrent/` | 현재 채팅 인터페이스 |
| `main-ChatHistory` | `features/main-ChatHistory/` | 채팅 히스토리 |

#### Workflow (7개)
| Feature ID | 디렉토리 | 역할 |
|------------|----------|------|
| `main-WorkflowIntro` | `features/main-WorkflowIntro/` | 워크플로우 소개 |
| `main-CanvasIntro` | `features/main-CanvasIntro/` | 캔버스 소개 |
| `main-Workflows` | `features/main-Workflows/` | 워크플로우 목록/관리 |
| `main-Documents` | `features/main-Documents/` | 문서/컬렉션 관리 |
| `main-ToolStorage` | `features/main-ToolStorage/` | 도구 저장소 |
| `main-PromptStorage` | `features/main-PromptStorage/` | 프롬프트 저장소 |
| `main-AuthProfile` | `features/main-AuthProfile/` | 인증 프로필 |

#### Model (5개)
| Feature ID | 디렉토리 | 역할 |
|------------|----------|------|
| `main-ModelIntro` | `features/main-ModelIntro/` | 모델 섹션 소개 |
| `main-ModelTrain` | `features/main-ModelTrain/` | LLM 훈련 설정 |
| `main-ModelEval` | `features/main-ModelEval/` | 모델 평가 |
| `main-ModelStorage` | `features/main-ModelStorage/` | 모델 허브 |
| `main-ModelMetrics` | `features/main-ModelMetrics/` | 훈련 메트릭 |

#### ML Model (3개)
| Feature ID | 디렉토리 | 역할 |
|------------|----------|------|
| `main-MlModelIntro` | `features/main-MlModelIntro/` | ML 모델 소개 |
| `main-MlTrain` | `features/main-MlTrain/` | ML 모델 훈련 |
| `main-MlModelHub` | `features/main-MlModelHub/` | ML 모델 허브 |

#### Data (3개)
| Feature ID | 디렉토리 | 역할 |
|------------|----------|------|
| `main-DataIntro` | `features/main-DataIntro/` | 데이터 섹션 소개 |
| `main-DataStation` | `features/main-DataStation/` | 데이터 스테이션 |
| `main-DataStorage` | `features/main-DataStorage/` | 데이터 저장소 |

#### Support (2개)
| Feature ID | 디렉토리 | 역할 |
|------------|----------|------|
| `main-ServiceRequest` | `features/main-ServiceRequest/` | 서비스 요청 |
| `main-FAQ` | `features/main-FAQ/` | FAQ |

### 3.3 Feature 인터페이스 정의

```typescript
// @xgen/types에 추가

// 메인 레이아웃에 등록되는 Feature
interface MainFeatureModule {
  id: string;
  name: string;
  sidebarSection: 'workspace' | 'chat' | 'workflow' | 'data' | 'model' | 'ml-model' | 'support';
  sidebarItems: MainSidebarItem[];
  routes: Record<string, ComponentType<RouteComponentProps>>;
  requiresAuth?: boolean;
  permissions?: string[];
}

interface MainSidebarItem {
  id: string;
  titleKey: string;
  descriptionKey?: string;
  iconComponent?: ComponentType;
}

// Registry 확장
class FeatureRegistry {
  private mainFeatures: Map<string, MainFeatureModule> = new Map();

  registerMainFeature(feature: MainFeatureModule): void;
  getMainFeatures(): MainFeatureModule[];
  getMainFeaturesBySidebar(section: string): MainFeatureModule[];
}
```

---

## 4. 공통 컴포넌트 분리 계획

### 4.1 우선순위별 분류

#### 🔴 높음 (Phase 1에서 구현)

| 컴포넌트 | 현재 위치 | 사용처 | 설명 |
|----------|----------|--------|------|
| `Modal` | 각 섹션에 중복 | 10+ 모달 | 포털 기반, ESC/배경 클릭 닫기, 애니메이션 |
| `ContentArea` | workflowSection/components/ | 모든 섹션 | 헤더+바디 레이아웃 래퍼 |
| `ResizablePanel` | chatSection/components/ | 채팅, 문서 | 드래그로 크기 조절 가능한 분할 패널 |
| `Card` | workflowSection/components/ | 5+ 목록 | 썸네일, 제목, 메타, 드롭다운 포함 |
| `CardGrid` | 각 목록 페이지 | 5+ 목록 | 반응형 그리드 레이아웃 |
| `EmptyState` | chatSection/components/ | 모든 목록 | 빈 상태 UI + 추천 액션 |

#### 🟡 중간 (Phase 2에서 구현)

| 컴포넌트 | 현재 위치 | 사용처 | 설명 |
|----------|----------|--------|------|
| `FilterTabs` | 각 목록 페이지 | 5+ 목록 | all/personal/shared 등 필터 탭 |
| `SearchInput` | _common/components/ | 모든 목록 | 아이콘 포함 검색 입력 |
| `DropdownMenu` | 각 카드 컴포넌트 | 모든 카드 | 더보기 메뉴 (포탈) |
| `FormField` | 각 모달/폼 | 모든 폼 | 라벨+입력+에러 래퍼 |
| `KpiCard` | MainDashboard | 대시보드 | KPI 표시 카드 |
| `DataTable` | EvalPageContent 등 | 테이블 페이지 | 정렬/필터/선택 기능 |
| `SuggestionChips` | chatSection/components/ | 채팅, 검색 | 클릭 가능한 추천 칩 |

#### 🟢 낮음 (Phase 3에서 구현)

| 컴포넌트 | 현재 위치 | 사용처 | 설명 |
|----------|----------|--------|------|
| `Badge` | 각 카드/목록 | 상태 표시 | active/inactive/template 등 |
| `Toggle` | 각 폼 | 설정 폼 | 공유/비공개 토글 |
| `DirectoryTree` | dataSection/components/ | 문서/파일 | 트리 네비게이션 |
| `VersionHistoryModal` | 각 섹션 | 버전 관리 | 버전 히스토리 표시 |

### 4.2 Modal 컴포넌트 상세 설계

```typescript
// packages/ui/src/feedback/Modal.tsx

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnEsc?: boolean;        // 기본 true
  closeOnOverlay?: boolean;    // 기본 true
  showCloseButton?: boolean;   // 기본 true
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

// 사용 예시
<Modal
  isOpen={isDetailOpen}
  onClose={handleClose}
  title="워크플로우 상세"
  size="lg"
  footer={
    <div>
      <Button variant="secondary" onClick={handleClose}>취소</Button>
      <Button variant="primary" onClick={handleSave}>저장</Button>
    </div>
  }
>
  <WorkflowDetailContent />
</Modal>
```

### 4.3 Card 컴포넌트 상세 설계

```typescript
// packages/ui/src/data-display/Card.tsx

interface CardProps {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string | ReactNode;
  metadata?: CardMetadata[];
  badge?: { text: string; variant: 'success' | 'warning' | 'error' | 'info' };
  actions?: CardAction[];
  selectable?: boolean;
  selected?: boolean;
  onClick?: () => void;
  onSelect?: (id: string) => void;
  className?: string;
}

interface CardMetadata {
  icon?: ReactNode;
  label: string;
  value: string | number;
}

interface CardAction {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
}

// 사용 예시
<Card
  id="workflow-1"
  title="이커머스 법률챗"
  description="고객 법률 상담 워크플로우"
  thumbnail={<WorkflowPreview />}
  metadata={[
    { icon: <FiClock />, label: '수정일', value: '2025.01.28' },
    { icon: <FiPlay />, label: '실행 횟수', value: 1234 },
  ]}
  badge={{ text: 'Active', variant: 'success' }}
  actions={[
    { id: 'edit', label: '수정', icon: <FiEdit />, onClick: handleEdit },
    { id: 'delete', label: '삭제', icon: <FiTrash />, onClick: handleDelete, danger: true },
  ]}
  onClick={handleOpenDetail}
/>
```

---

## 5. 마이그레이션 실행 순서

### Phase 1: 기반 인프라 구축 (1주)

**목표:** 모든 Feature가 사용할 공통 패키지 완성

| 순서 | 작업 | 담당 | 예상 시간 |
|------|------|------|----------|
| 1.1 | @xgen/ui - Modal, ContentArea, EmptyState | UI팀 | 2일 |
| 1.2 | @xgen/ui - Card, CardGrid, ResizablePanel | UI팀 | 2일 |
| 1.3 | @xgen/api-client 생성 | API팀 | 1일 |
| 1.4 | @xgen/auth-provider 생성 | API팀 | 1일 |
| 1.5 | @xgen/config, @xgen/utils 생성 | 공통팀 | 1일 |
| 1.6 | @xgen/types 확장 (MainFeatureModule) | 공통팀 | 0.5일 |
| 1.7 | @xgen/icons 사이드바 아이콘 마이그레이션 | UI팀 | 0.5일 |

### Phase 2: 독립 Feature 마이그레이션 (1주)

**목표:** 의존성 낮은 소개 페이지 및 대시보드 마이그레이션

| 순서 | Feature | 복잡도 | 예상 시간 |
|------|---------|--------|----------|
| 2.1 | main-Dashboard | 중 | 1일 |
| 2.2 | main-ChatIntro | 저 | 0.5일 |
| 2.3 | main-WorkflowIntro | 저 | 0.5일 |
| 2.4 | main-CanvasIntro | 저 | 0.5일 |
| 2.5 | main-ModelIntro | 저 | 0.5일 |
| 2.6 | main-MlModelIntro | 저 | 0.5일 |
| 2.7 | main-DataIntro | 저 | 0.5일 |
| 2.8 | main-FAQ | 저 | 0.5일 |

### Phase 3: 목록 Feature 마이그레이션 (2주)

**목표:** 카드 그리드 목록 페이지 마이그레이션

| 순서 | Feature | 복잡도 | 예상 시간 |
|------|---------|--------|----------|
| 3.1 | @xgen/ui - FilterTabs, SearchInput, DropdownMenu | 중 | 1일 |
| 3.2 | main-Workflows | 고 | 2일 |
| 3.3 | main-ToolStorage | 중 | 1일 |
| 3.4 | main-PromptStorage | 중 | 1일 |
| 3.5 | main-ModelStorage | 중 | 1일 |
| 3.6 | main-DataStorage | 중 | 1일 |
| 3.7 | main-ChatHistory | 중 | 1일 |
| 3.8 | main-ServiceRequest | 중 | 1일 |

### Phase 4: 복잡 Feature 마이그레이션 (3주)

**목표:** 고복잡도 Feature 마이그레이션

| 순서 | Feature | 복잡도 | 예상 시간 |
|------|---------|--------|----------|
| 4.1 | main-Documents | 매우 높음 | 3일 |
| 4.2 | main-ChatNew | 고 | 2일 |
| 4.3 | main-ChatCurrent | 매우 높음 | 3일 |
| 4.4 | main-ModelTrain | 고 | 2일 |
| 4.5 | main-ModelEval | 고 | 2일 |
| 4.6 | main-ModelMetrics | 중 | 1일 |
| 4.7 | main-MlTrain | 고 | 2일 |
| 4.8 | main-MlModelHub | 고 | 2일 |
| 4.9 | main-DataStation | 고 | 2일 |
| 4.10 | main-AuthProfile | 중 | 1일 |

### Phase 5: 통합 및 검증 (1주)

| 순서 | 작업 | 예상 시간 |
|------|------|----------|
| 5.1 | apps/web에서 전체 Feature 등록 및 라우팅 | 1일 |
| 5.2 | 사이드바 레이아웃 마이그레이션 | 1일 |
| 5.3 | E2E 테스트 | 2일 |
| 5.4 | 버그 수정 및 최적화 | 1일 |

---

## 6. 파일 구조 명세

### 6.1 최종 monorepo 구조

```
frontend_monorepo/
├── apps/
│   └── web/
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx
│       │   │   └── main/
│       │   │       └── page.tsx    # AuthGuard + MainLayout
│       │   ├── components/
│       │   │   ├── MainLayout.tsx  # 사이드바 + 콘텐츠 레이아웃
│       │   │   └── MainSidebar.tsx # 사이드바 컴포넌트
│       │   └── features.ts         # Feature 등록
│       └── package.json
│
├── features/
│   ├── main-Dashboard/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.tsx
│   │       ├── components/
│   │       │   ├── KpiSection.tsx
│   │       │   ├── LatestUpdates.tsx
│   │       │   ├── TopWorkflows.tsx
│   │       │   └── ErrorList.tsx
│   │       └── styles/
│   │           └── dashboard.module.scss
│   │
│   ├── main-ChatNew/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.tsx
│   │       ├── components/
│   │       │   ├── ChatInput.tsx
│   │       │   ├── ChatArea.tsx
│   │       │   ├── MessageList.tsx
│   │       │   └── ...
│   │       ├── hooks/
│   │       │   ├── useChatState.ts
│   │       │   ├── useInputHandling.ts
│   │       │   └── ...
│   │       └── styles/
│   │
│   ├── main-Workflows/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.tsx
│   │       ├── components/
│   │       │   ├── WorkflowCard.tsx
│   │       │   ├── WorkflowEditModal.tsx
│   │       │   ├── WorkflowVersionModal.tsx
│   │       │   └── ...
│   │       └── styles/
│   │
│   └── ... (나머지 24개 Feature)
│
├── packages/
│   ├── ui/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── styles/
│   │       ├── layout/
│   │       ├── feedback/
│   │       ├── data-display/
│   │       ├── inputs/
│   │       └── navigation/
│   │
│   ├── api-client/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── createApiClient.ts
│   │       └── domains/
│   │
│   ├── auth-provider/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── AuthProvider.tsx
│   │       └── useAuth.ts
│   │
│   ├── config/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │
│   ├── utils/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │
│   ├── types/
│   ├── icons/
│   └── i18n/
│
└── docs/
    ├── README.md
    ├── migration-plan.md
    └── main-page-migration-plan.md  (이 문서)
```

### 6.2 Feature 표준 구조

```
features/main-{FeatureName}/
├── package.json
├── tsconfig.json
└── src/
    ├── index.tsx              # Feature 진입점 + FeatureModule export
    ├── components/            # Feature 전용 컴포넌트
    │   ├── {Component}.tsx
    │   └── ...
    ├── hooks/                  # Feature 전용 훅 (있을 경우)
    │   ├── use{Hook}.ts
    │   └── ...
    ├── utils/                  # Feature 전용 유틸리티 (있을 경우)
    │   └── ...
    └── styles/                 # Feature 전용 스타일
        └── *.module.scss
```

---

## 7. 의존성 관계도

### 7.1 패키지 의존성

```
┌─────────────────────────────────────────────────────────────┐
│                        apps/web                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        features/*                           │
│  (main-Dashboard, main-ChatNew, main-Workflows, ...)       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        packages/*                           │
│  ┌─────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │  @xgen/ │ │   @xgen/    │ │   @xgen/    │ │  @xgen/   │ │
│  │   ui    │ │ api-client  │ │auth-provider│ │   i18n    │ │
│  └────┬────┘ └──────┬──────┘ └──────┬──────┘ └─────┬─────┘ │
│       │             │               │               │       │
│       ▼             ▼               ▼               │       │
│  ┌─────────┐ ┌─────────────┐ ┌─────────────┐        │       │
│  │ @xgen/  │ │   @xgen/    │ │   @xgen/    │        │       │
│  │ icons   │ │   config    │ │    utils    │        │       │
│  └────┬────┘ └──────┬──────┘ └──────┬──────┘        │       │
│       │             │               │               │       │
│       └─────────────┼───────────────┼───────────────┘       │
│                     ▼               ▼                       │
│               ┌─────────────────────────┐                   │
│               │       @xgen/types       │                   │
│               └─────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Feature 독립성 보장

```
❌ 금지된 의존:
features/main-ChatNew → features/main-ChatHistory  (Feature 간 직접 import)

⭕ 허용된 의존:
features/main-ChatNew → @xgen/ui                   (공유 UI)
features/main-ChatNew → @xgen/api-client           (공유 API)
features/main-ChatNew → @xgen/types                (공유 타입)
features/main-ChatNew → @xgen/i18n                 (다국어)
```

### 7.3 Registry를 통한 Feature 조합

```typescript
// apps/web/src/features.ts
import mainDashboard from '@xgen/feature-main-Dashboard';
import mainChatNew from '@xgen/feature-main-ChatNew';
import mainChatCurrent from '@xgen/feature-main-ChatCurrent';
import mainChatHistory from '@xgen/feature-main-ChatHistory';
import mainWorkflows from '@xgen/feature-main-Workflows';
// ... 모든 Feature import

import { FeatureRegistry } from '@xgen/types';

// 모든 Feature를 Registry에 등록
const features = [
  mainDashboard,
  mainChatNew,
  mainChatCurrent,
  mainChatHistory,
  mainWorkflows,
  // ...
];

features.forEach((f) => FeatureRegistry.registerMainFeature(f));

export { features };
```

---

## 부록: 마이그레이션 체크리스트

### Feature 마이그레이션 체크리스트

- [ ] Feature 디렉토리 생성 (`features/main-{Name}/`)
- [ ] package.json 작성 (`@xgen/feature-main-{Name}`)
- [ ] tsconfig.json 작성
- [ ] src/index.tsx에 MainFeatureModule export
- [ ] 컴포넌트 마이그레이션
- [ ] 스타일 마이그레이션 (SCSS modules)
- [ ] 훅 마이그레이션 (있을 경우)
- [ ] @xgen/ui 공통 컴포넌트 사용 확인
- [ ] @xgen/api-client 사용 확인
- [ ] @xgen/auth-provider 사용 확인
- [ ] @xgen/i18n 사용 확인
- [ ] Feature 간 직접 import 없음 확인
- [ ] apps/web/src/features.ts에 등록
- [ ] apps/web/package.json에 의존성 추가
- [ ] 빌드 테스트 (`pnpm build`)
- [ ] 기능 테스트

### PR 전 자가 점검

- [ ] 파일명이 kebab-case인가?
- [ ] Feature id가 디렉토리명과 일치하는가?
- [ ] default export가 MainFeatureModule인가?
- [ ] 'use client' 선언이 있는가?
- [ ] 다른 Feature를 import하지 않는가?
- [ ] 모든 텍스트가 i18n을 통하는가?
- [ ] @xgen/ui 컴포넌트를 최대한 사용했는가?
