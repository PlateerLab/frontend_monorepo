# @xgen/i18n 사용 가이드

## 목차

1. [기본 사용법](#1-기본-사용법)
2. [필수 Provider 설정](#2-필수-provider-설정)
3. [Translation Key 규칙](#3-translation-key-규칙)
4. [변수 보간 (Interpolation)](#4-변수-보간-interpolation)
5. [새 Feature 추가 시 i18n 작업 절차](#5-새-feature-추가-시-i18n-작업-절차)
6. [자주 발생하는 에러](#6-자주-발생하는-에러)
7. [체크리스트](#7-체크리스트)

---

## 1. 기본 사용법

### 올바른 사용

```typescript
import { useTranslation } from '@xgen/i18n';

const MyComponent: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('chatHistory.title')}</h1>
      <p>{t('chatHistory.empty.description')}</p>
    </div>
  );
};
```

### 잘못된 사용

```typescript
// ❌ 한국어 하드코딩
return <h1>채팅 기록</h1>;

// ❌ 존재하지 않는 키 사용 (키가 그대로 렌더링됨)
return <h1>{t('chatHistory.nonExistentKey')}</h1>;
```

---

## 2. 필수 Provider 설정

`useTranslation()`은 반드시 `LanguageProvider` 내부에서 사용해야 한다.

### 에러 메시지

```
Error: useTranslation must be used within a LanguageProvider
```

### 해결 방법

App 레벨에서 `LanguageProvider`가 적용되어 있어야 한다:

```typescript
// apps/web/src/app/layout.tsx
import { LanguageProvider } from '@xgen/i18n';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
```

**주의:** Feature 내부에서는 Provider를 설정하지 않는다. App에서 한 번만 설정한다.

---

## 3. Translation Key 규칙

### Key 네이밍 컨벤션

```
{domain}.{section}.{item}
```

| 레벨 | 설명 | 예시 |
|------|------|------|
| domain | Feature 또는 공통 영역 | `chatHistory`, `chatNew`, `common` |
| section | 기능 섹션 | `filter`, `empty`, `error` |
| item | 개별 항목 | `title`, `description`, `action` |

### 예시

```json
{
  "chatHistory": {
    "title": "채팅 기록",
    "filter": {
      "all": "전체",
      "active": "활성",
      "deleted": "삭제됨"
    },
    "empty": {
      "title": "채팅 기록이 없습니다",
      "description": "새로운 대화를 시작해보세요"
    },
    "error": {
      "loadFailed": "채팅 기록을 불러오지 못했습니다"
    }
  }
}
```

### 공통 키 (common)

자주 사용되는 범용 텍스트는 `common` 아래에 정의한다:

```json
{
  "common": {
    "loading": "로딩 중...",
    "retry": "다시 시도",
    "refresh": "새로 고침",
    "cancel": "취소",
    "save": "저장",
    "delete": "삭제",
    "confirm": "확인",
    "error": "오류가 발생했습니다"
  }
}
```

---

## 4. 변수 보간 (Interpolation)

동적 값을 포함해야 할 때는 `{{variable}}` 문법을 사용한다.

### JSON 정의

```json
{
  "chat": {
    "interactionCount": "대화 {{count}}개",
    "sessionStarted": "{{workflowName}} 워크플로우가 시작되었습니다"
  }
}
```

### 사용법

```typescript
const { t } = useTranslation();

// 변수 전달
t('chat.interactionCount', { count: 5 });
// 결과: "대화 5개"

t('chat.sessionStarted', { workflowName: '고객 상담' });
// 결과: "고객 상담 워크플로우가 시작되었습니다"
```

---

## 5. 새 Feature 추가 시 i18n 작업 절차

### Step 1: 필요한 키 목록 정리

Feature 코드 작성 전에 필요한 모든 텍스트를 정리한다:

```
myFeature
├── title: "내 기능"
├── description: "기능 설명입니다"
├── filter
│   ├── all: "전체"
│   └── active: "활성"
├── empty
│   ├── title: "데이터가 없습니다"
│   └── description: "새 항목을 추가하세요"
└── error
    └── loadFailed: "불러오기 실패"
```

### Step 2: ko.json에 추가

```json
// packages/i18n/src/locales/ko.json
{
  "myFeature": {
    "title": "내 기능",
    "description": "기능 설명입니다",
    "filter": {
      "all": "전체",
      "active": "활성"
    },
    "empty": {
      "title": "데이터가 없습니다",
      "description": "새 항목을 추가하세요"
    },
    "error": {
      "loadFailed": "불러오기 실패"
    }
  }
}
```

### Step 3: en.json에 추가

```json
// packages/i18n/src/locales/en.json
{
  "myFeature": {
    "title": "My Feature",
    "description": "Feature description",
    "filter": {
      "all": "All",
      "active": "Active"
    },
    "empty": {
      "title": "No data",
      "description": "Add a new item"
    },
    "error": {
      "loadFailed": "Failed to load"
    }
  }
}
```

### Step 4: Feature 코드에서 사용

```typescript
const { t } = useTranslation();
return <h1>{t('myFeature.title')}</h1>;
```

---

## 6. 자주 발생하는 에러

### 에러 1: Key가 그대로 렌더링됨

**증상:** 화면에 `chatNew.error.loadFailed` 같은 키 문자열이 그대로 표시됨

**원인:** 해당 키가 locale JSON 파일에 존재하지 않음

**해결:**
1. `ko.json`과 `en.json`에 해당 키를 추가
2. 키 경로가 올바른지 확인 (오타 체크)

### 에러 2: useTranslation must be used within a LanguageProvider

**원인:** `LanguageProvider`가 컴포넌트 트리에 없음

**해결:**
1. App 레벨에서 `LanguageProvider`가 설정되어 있는지 확인
2. Storybook이나 테스트 환경에서는 별도로 Provider 설정 필요

### 에러 3: Hydration Mismatch

**원인:** 서버와 클라이언트의 초기 렌더링 불일치

**해결:**
- `@xgen/i18n`은 기본 locale('en')로 SSR을 수행하고, 클라이언트에서 localStorage 값으로 전환
- `isHydrated` 상태를 활용하여 hydration 완료 후 locale 의존 UI 표시

```typescript
const { t, isHydrated } = useTranslation();

if (!isHydrated) {
  return <Skeleton />;
}

return <h1>{t('myFeature.title')}</h1>;
```

---

## 7. 체크리스트

### PR 전 확인사항

- [ ] 모든 UI 텍스트가 `t()` 함수를 통해 렌더링되는가?
- [ ] 한국어 하드코딩이 없는가?
- [ ] 사용한 모든 키가 `ko.json`에 존재하는가?
- [ ] 사용한 모든 키가 `en.json`에 존재하는가?
- [ ] 변수 보간 문법이 올바른가? (`{{variable}}`)
- [ ] 새로 추가한 키가 `common`에 이미 있는 것과 중복되지 않는가?

### 키 존재 확인 방법

```bash
# ko.json에서 키 검색
grep -r "loadFailed" packages/i18n/src/locales/ko.json

# 모든 t() 호출에서 사용된 키 추출 (Feature 폴더에서)
grep -oP "t\('([^']+)'\)" features/main-chat-history/src/index.tsx
```

---

## 부록: Chat Features 누락 키 목록

현재 Chat Features에서 사용하지만 locale 파일에 없는 키 목록:

### chatHistory 누락 키

```json
{
  "chatHistory": {
    "yesterday": "어제",
    "error": {
      "loadFailed": "채팅 기록을 불러오지 못했습니다",
      "workflowDeleted": "삭제된 워크플로우입니다",
      "saveFailed": "저장에 실패했습니다",
      "deleteFailed": "삭제에 실패했습니다"
    }
  }
}
```

### chatNew 누락 키

```json
{
  "chatNew": {
    "sections": {
      "all": "전체 워크플로우"
    },
    "filter": {
      "all": "전체",
      "active": "활성",
      "draft": "초안"
    },
    "owner": {
      "all": "전체",
      "personal": "개인",
      "shared": "공유"
    },
    "status": {
      "active": "활성",
      "draft": "초안",
      "archived": "보관됨"
    },
    "startChat": "채팅 시작",
    "personal": "개인",
    "shared": "공유",
    "error": {
      "loadFailed": "워크플로우를 불러오지 못했습니다",
      "draftWorkflow": "초안 상태의 워크플로우는 사용할 수 없습니다",
      "saveFailed": "저장에 실패했습니다"
    }
  }
}
```

### chat 누락 키

```json
{
  "chat": {
    "currentChat": "현재 채팅",
    "newChat": "새 채팅",
    "startNewChat": "새 채팅 시작",
    "stop": "중지",
    "cancelled": "취소됨",
    "sessionStarted": "{{workflowName}} 워크플로우가 시작되었습니다",
    "error": {
      "noSession": "진행 중인 채팅이 없습니다",
      "executionFailed": "실행 중 오류가 발생했습니다"
    }
  }
}
```

### common 누락 키

```json
{
  "common": {
    "refresh": "새로 고침",
    "retry": "다시 시도",
    "loading": "로딩 중..."
  }
}
```

**주의:** `common.loading`은 현재 "앱을 시작하는 중..."으로 되어 있어 범용적으로 사용하기 어려움. 별도 키 추가 권장.
