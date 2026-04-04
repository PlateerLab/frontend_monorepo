# ContentArea 통합 개선안

## 1. 현재 상태 진단

### 1-1. 현재 ContentArea 문제점

```tsx
// 현재 구조 — 단순 래퍼 + 자체 스타일링
<div className="bg-card border-b border-border p-6">
  <header className="flex items-start justify-between mb-6">
    <h1>Title</h1>
    <div>{headerActions}</div>
  </header>
  <div>{children}</div>
</div>
```

| 문제 | 설명 |
|------|------|
| **100vh 미지원** | 고정 높이 없음. MainPage의 `.content`(overflow-y: auto)에 의존하여 페이지 전체가 스크롤됨 |
| **헤더 높이 불일치** | 사이드바 헤더 `h-14`(56px)와 다른 높이. `items-start` + `mb-6`로 구성 |
| **보더 불일치** | `border-border`(#e4e7ec) 사용. 사이드바의 `border-[var(--color-line-50)]`과 다름 |
| **스크롤 구조 부재** | 내부 스크롤 영역이 없어, 헤더/탭 등이 함께 스크롤됨 |
| **toolbar 영역 없음** | FilterTabs, SearchInput 등을 children 안에서 수동 배치해야 함 |
| **footer 영역 없음** | 하단 고정 영역 미지원 |
| **variant 미사용** | `fullWidth`, `toolStorage` variant가 단 한 곳에서도 사용되지 않음 |

### 1-2. 현재 사용 현황

| 패턴 | 사용 피처 수 | 설명 |
|------|------------|------|
| **`<ContentArea>` bare (props 없음)** | **41개** | props 안 쓰고 children 안에서 수동 `<h1>` 배치 |
| **`<ContentArea title={..}>` 등** | **9개** | title/headerActions props 사용 |
| **`<ContentHeader>` + h-screen 수동** | **2개** | ChatNew, ChatCurrent |
| **자체 레이아웃** | **~15개** | Canvas 계열, 탭 플러그인, 랜딩 등 |

→ **82%의 피처가 ContentArea의 title/headerActions를 무시**하고 자체 헤더를 만듦.

### 1-3. ContentHeader 문제점

ContentHeader는 올바른 디자인(h-14, sidebar border)이지만 별도 컴포넌트로 분리되어 있어서:
- ContentArea와 중복 역할
- 사용하는 피처가 `h-screen`, `flex-col`, `overflow-hidden`, 스크롤 영역을 매번 수동 구성해야 함
- ContentArea를 쓰는 피처와 레이아웃이 통일되지 않음

---

## 2. 개선 목표

ContentArea 하나로 **모든 콘텐츠 페이지의 레이아웃을 완전히 통일**한다.

```
┌─────────────────────────────────────────────┐
│  Header (h-14, 56px)                  [Act]  │  ← 고정, 사이드바와 동일 높이/보더
├─────────────────────────────────────────────┤
│  Toolbar (선택적)                             │  ← 고정, FilterTabs/SearchInput 등
├─────────────────────────────────────────────┤
│                                             │
│  Main Content (스크롤 영역)                    │  ← flex-1, overflow-y: auto
│                                             │
├─────────────────────────────────────────────┤
│  Footer (선택적)                              │  ← 고정, 하단 액션 바
└─────────────────────────────────────────────┘

전체: h-screen (100vh), flex-col, overflow-hidden
```

---

## 3. 새 ContentArea API 설계

```tsx
interface ContentAreaProps {
  /** ── 헤더 영역 ── */
  title?: string;                    // 헤더 좌측 제목
  description?: string;              // 헤더 좌측 부제 (선택)
  headerActions?: ReactNode;         // 헤더 우측 액션 버튼들
  headerContent?: ReactNode;         // 헤더 전체를 커스텀으로 대체 (title/headerActions 무시)
  showHeader?: boolean;              // false면 헤더 영역 전체 숨김 (default: true)

  /** ── 툴바 영역 (헤더 아래, 메인 위) ── */
  toolbar?: ReactNode;               // FilterTabs, SearchInput 등

  /** ── 메인 컨텐츠 ── */
  children: ReactNode;               // 스크롤 가능 메인 영역

  /** ── 푸터 영역 (선택) ── */
  footer?: ReactNode;                // 하단 고정 영역

  /** ── 레이아웃 옵션 ── */
  contentPadding?: boolean;          // 메인 영역 기본 패딩 적용 (default: true, p-6)
  className?: string;                // 루트 컨테이너 추가 클래스
  contentClassName?: string;         // 스크롤 영역 추가 클래스
}
```

### 제거 항목
- `variant` prop → 사용률 0%인 `fullWidth`/`toolStorage` 삭제. `card`/`page` 패턴은 `className`으로 대체
- `ContentHeader` 컴포넌트 → ContentArea 내부에 흡수. 파일 삭제

---

## 4. 구현 구조

```tsx
export const ContentArea: React.FC<ContentAreaProps> = ({
  title, description, headerActions, headerContent,
  showHeader = true,
  toolbar, children, footer,
  contentPadding = true,
  className, contentClassName,
}) => {
  const hasHeader = showHeader && (title || headerActions || headerContent);

  return (
    <div className={cn('flex flex-col h-screen overflow-hidden bg-[#f8f9fa]', className)}>

      {/* ── Header: h-14, 사이드바와 동일 ── */}
      {hasHeader && (
        <header className="flex items-center justify-between h-14 min-h-14 max-h-14 px-[22px] bg-white border-b border-[var(--color-line-50)] shrink-0">
          {headerContent ?? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                {title && <h1 className="text-base font-bold text-foreground m-0 truncate">{title}</h1>}
                {description && <p className="text-sm text-muted-foreground m-0 truncate hidden sm:block">{description}</p>}
              </div>
              {headerActions && <div className="flex items-center gap-2 shrink-0">{headerActions}</div>}
            </>
          )}
        </header>
      )}

      {/* ── Toolbar: 고정 영역 ── */}
      {toolbar && (
        <div className="px-6 py-3 bg-white border-b border-[var(--color-line-50)] shrink-0">
          {toolbar}
        </div>
      )}

      {/* ── Main: 스크롤 영역 ── */}
      <div className={cn(
        'flex-1 overflow-y-auto min-h-0',
        contentPadding && 'p-6',
        contentClassName,
      )}>
        {children}
      </div>

      {/* ── Footer: 고정 영역 ── */}
      {footer && (
        <div className="px-6 py-3 bg-white border-t border-[var(--color-line-50)] shrink-0">
          {footer}
        </div>
      )}
    </div>
  );
};
```

---

## 5. 마이그레이션 예시

### 5-1. 기존 bare ContentArea (admin 피처 41개)

**Before:**
```tsx
<ContentArea>
  <div className="flex items-start justify-between mb-6">
    <div><h1>Users</h1><p>Manage users</p></div>
    <Button>Create</Button>
  </div>
  <div className="flex items-center gap-4 mb-4">
    <FilterTabs ... />
    <SearchInput ... />
  </div>
  <DataTable ... />
</ContentArea>
```

**After:**
```tsx
<ContentArea
  title="Users"
  description="Manage users"
  headerActions={<Button>Create</Button>}
  toolbar={
    <div className="flex items-center justify-between gap-4">
      <FilterTabs ... />
      <SearchInput ... />
    </div>
  }
>
  <DataTable ... />
</ContentArea>
```

### 5-2. ChatNew (ContentHeader 사용)

**Before:**
```tsx
<div className="flex flex-col h-screen overflow-hidden bg-[#f8f9fa]">
  <ContentHeader>
    <h1>New Chat</h1>
    <button>Refresh</button>
  </ContentHeader>
  <div className="flex-1 overflow-y-auto min-h-0">
    <div className="flex flex-col gap-5 p-6">
      <FilterTabs ... />
      <Cards ... />
    </div>
  </div>
</div>
```

**After:**
```tsx
<ContentArea
  title="New Chat"
  headerActions={<button>Refresh</button>}
  toolbar={<FilterTabs ... />}
>
  <Cards ... />
</ContentArea>
```

### 5-3. ChatCurrent (headerContent 커스텀)

**Before:**
```tsx
<div className="flex flex-col h-screen overflow-hidden bg-[#f8f9fa]">
  <ContentHeader>
    <div className="flex items-center gap-3">
      <WorkflowIcon />
      <div>
        <h1>Workflow Name</h1>
        <p>3 interactions</p>
      </div>
    </div>
    <div>
      <button>New</button>
      <button>History</button>
    </div>
  </ContentHeader>
  <WorkflowInfoPanel ... />
  <ChatPanel ... />
</div>
```

**After:**
```tsx
<ContentArea
  headerContent={
    <>
      <div className="flex items-center gap-3">
        <WorkflowIcon />
        <div>
          <h1>Workflow Name</h1>
          <p>3 interactions</p>
        </div>
      </div>
      <div>
        <button>New</button>
        <button>History</button>
      </div>
    </>
  }
  contentPadding={false}
>
  <WorkflowInfoPanel ... />
  <ChatPanel ... />
</ContentArea>
```

### 5-4. variant="page" 사용하던 곳 (admin-chat-monitoring)

**Before:**
```tsx
<ContentArea title="Chat Monitoring" variant="page" headerActions={...}>
  ...
</ContentArea>
```

**After:**
```tsx
<ContentArea
  title="Chat Monitoring"
  headerActions={...}
  contentClassName="max-w-7xl mx-auto"
>
  ...
</ContentArea>
```

---

## 6. 삭제 대상

| 파일 | 이유 |
|------|------|
| `packages/ui/src/layout/content-header.tsx` | ContentArea에 흡수됨 |
| `ContentHeaderProps` export in `packages/ui/src/index.ts` | 삭제 |

---

## 7. 마이그레이션 우선순위

| 순위 | 피처 | 이유 |
|------|------|------|
| **1** | ContentArea 컴포넌트 자체 재작성 | 핵심 변경 |
| **2** | ChatNew, ChatCurrent, ChatHistory | 현재 ContentHeader 사용 중 → ContentArea로 전환 |
| **3** | title/headerActions 사용 피처 9개 | API 호환이라 props만 유지하면 자동 적용 |
| **4** | bare ContentArea 41개 (admin 계열) | 수동 헤더를 props로 이관. 기능은 그대로 작동하므로 점진적 전환 가능 |
| **5** | ContentHeader 파일 삭제 | 모든 전환 완료 후 |

### 주의: 100vh와 MainPage `.content`의 관계

현재 MainPage의 `.content` 영역이 `overflow-y: auto`로 되어 있어 각 피처가 자체적으로 페이지 크기를 결정함.
새 ContentArea가 `h-screen`을 사용하면, `.content`의 `overflow-y: auto`는 불필요해지지만
미마이그레이션 피처와의 호환을 위해 `.content`의 스타일은 유지하되, 새 ContentArea 내부에서 `h-screen`으로 자체 뷰포트를 확보.

→ 점진적 마이그레이션 완료 후 `.content`에서 `overflow-y: auto` 제거 검토.

---

## 8. 최종 정리

| 항목 | Before | After |
|------|--------|-------|
| 헤더 높이 | 불일치 (variant별 다름) | h-14 (56px) 고정, 사이드바와 동일 |
| 헤더 보더 | `border-border` (#e4e7ec) | `border-[var(--color-line-50)]` 사이드바와 동일 |
| 뷰포트 | `.content`의 overflow-y에 의존 | h-screen, 자체 뷰포트 확보 |
| 스크롤 | 페이지 전체 스크롤 | 헤더/툴바 고정, 메인만 스크롤 |
| 툴바 | children 내부에서 수동 배치 | `toolbar` prop으로 고정 영역 |
| 푸터 | 미지원 | `footer` prop으로 고정 영역 |
| 커스텀 헤더 | ContentHeader 별도 사용 | `headerContent` prop으로 통합 |
| 사용 컴포넌트 수 | ContentArea + ContentHeader 2개 | **ContentArea 1개** |
