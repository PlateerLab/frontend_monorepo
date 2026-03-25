# @xgen/ui 공통 컴포넌트 상세 설계

> packages/ui에 추가할 공통 컴포넌트의 상세 API 명세

---

## 목차

1. [디자인 시스템 토큰](#1-디자인-시스템-토큰)
2. [Layout 컴포넌트](#2-layout-컴포넌트)
3. [Feedback 컴포넌트](#3-feedback-컴포넌트)
4. [Data Display 컴포넌트](#4-data-display-컴포넌트)
5. [Input 컴포넌트](#5-input-컴포넌트)
6. [Navigation 컴포넌트](#6-navigation-컴포넌트)

---

## 1. 디자인 시스템 토큰

### _variables.scss

```scss
// ─────────────────────────────────────────────────────────────
// Colors (Figma 기반)
// ─────────────────────────────────────────────────────────────

// Gray Scale
$figma-gray-50: #f8f9fa;
$figma-gray-100: #f1f3f5;
$figma-gray-200: #e9ecef;
$figma-gray-300: #dee2e6;
$figma-gray-400: #ced4da;
$figma-gray-500: #7a7f89;
$figma-gray-600: #495057;
$figma-gray-700: #40444d;
$figma-gray-800: #1d1f23;
$figma-gray-900: #212529;

// Primary (Gradient)
$figma-primary-start: #305eeb;
$figma-primary-end: #783ced;
$figma-primary-gradient: linear-gradient(135deg, $figma-primary-start, $figma-primary-end);

// Semantic Colors
$color-success: #2eb146;
$color-warning: #f59f00;
$color-error: #e03131;
$color-info: #305eeb;

// Background
$bg-primary: #ffffff;
$bg-secondary: #f8f9fa;
$bg-card: #ffffff;
$bg-overlay: rgba(0, 0, 0, 0.5);

// ─────────────────────────────────────────────────────────────
// Typography
// ─────────────────────────────────────────────────────────────

$font-family-base: 'Pretendard', system-ui, sans-serif;
$font-family-mono: 'Fira Code', monospace;

$font-size-xs: 0.75rem;   // 12px
$font-size-sm: 0.875rem;  // 14px
$font-size-base: 1rem;    // 16px
$font-size-lg: 1.125rem;  // 18px
$font-size-xl: 1.25rem;   // 20px
$font-size-2xl: 1.5rem;   // 24px
$font-size-3xl: 1.875rem; // 30px

$font-weight-regular: 400;
$font-weight-medium: 500;
$font-weight-semibold: 600;
$font-weight-bold: 700;

$line-height-tight: 1.25;
$line-height-base: 1.5;
$line-height-relaxed: 1.75;

// ─────────────────────────────────────────────────────────────
// Spacing
// ─────────────────────────────────────────────────────────────

$spacing-0: 0;
$spacing-1: 0.25rem;  // 4px
$spacing-2: 0.5rem;   // 8px
$spacing-3: 0.75rem;  // 12px
$spacing-4: 1rem;     // 16px
$spacing-5: 1.25rem;  // 20px
$spacing-6: 1.5rem;   // 24px
$spacing-8: 2rem;     // 32px
$spacing-10: 2.5rem;  // 40px
$spacing-12: 3rem;    // 48px

// ─────────────────────────────────────────────────────────────
// Borders & Shadows
// ─────────────────────────────────────────────────────────────

$border-radius-sm: 4px;
$border-radius-md: 8px;
$border-radius-lg: 12px;
$border-radius-xl: 16px;
$border-radius-full: 9999px;

$shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
$shadow-md: 0 2px 8px rgba(0, 0, 0, 0.1);
$shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.12);
$shadow-xl: 0 8px 24px rgba(0, 0, 0, 0.16);

// ─────────────────────────────────────────────────────────────
// Transitions
// ─────────────────────────────────────────────────────────────

$transition-fast: 0.15s ease-out;
$transition-base: 0.25s ease-out;
$transition-slow: 0.35s ease-out;

// ─────────────────────────────────────────────────────────────
// Z-Index
// ─────────────────────────────────────────────────────────────

$z-dropdown: 100;
$z-sticky: 200;
$z-modal: 300;
$z-popover: 400;
$z-tooltip: 500;
$z-toast: 600;
```

---

## 2. Layout 컴포넌트

### 2.1 ContentArea

페이지 콘텐츠를 감싸는 카드형 래퍼. 헤더(제목+설명)와 바디로 구성.

```typescript
// packages/ui/src/layout/ContentArea.tsx

interface ContentAreaProps {
  /** 페이지/섹션 제목 */
  title?: string;
  /** 페이지/섹션 설명 */
  description?: string;
  /** 헤더 표시 여부 (기본 true) */
  showHeader?: boolean;
  /** 레이아웃 변형 */
  variant?: 'card' | 'page' | 'fullWidth';
  /** 콘텐츠 영역 */
  children: React.ReactNode;
  /** 추가 클래스 */
  className?: string;
  /** 헤더 우측 액션 버튼 슬롯 */
  headerActions?: React.ReactNode;
}

export const ContentArea: React.FC<ContentAreaProps> = ({
  title,
  description,
  showHeader = true,
  variant = 'card',
  children,
  className,
  headerActions,
}) => {
  return (
    <div className={classNames(styles.container, styles[variant], className)}>
      {showHeader && (title || description) && (
        <header className={styles.header}>
          <div className={styles.headerText}>
            {title && <h1 className={styles.title}>{title}</h1>}
            {description && <p className={styles.description}>{description}</p>}
          </div>
          {headerActions && (
            <div className={styles.headerActions}>{headerActions}</div>
          )}
        </header>
      )}
      <div className={styles.body}>{children}</div>
    </div>
  );
};
```

**사용 예시:**
```tsx
<ContentArea
  title="워크플로우 목록"
  description="생성된 워크플로우를 관리합니다."
  headerActions={<Button onClick={onCreate}>새 워크플로우</Button>}
>
  <WorkflowList />
</ContentArea>
```

### 2.2 ResizablePanel

드래그로 크기 조절 가능한 분할 패널.

```typescript
// packages/ui/src/layout/ResizablePanel.tsx

interface ResizablePanelProps {
  /** 왼쪽/상단 패널 */
  leftPanel: React.ReactNode;
  /** 오른쪽/하단 패널 */
  rightPanel: React.ReactNode;
  /** 분할 방향 */
  direction?: 'horizontal' | 'vertical';
  /** 기본 분할 비율 (0-100) */
  defaultSplit?: number;
  /** 최소 크기 (0-100) */
  minSize?: number;
  /** 최대 크기 (0-100) */
  maxSize?: number;
  /** 크기 변경 콜백 */
  onResize?: (size: number) => void;
  /** 추가 클래스 */
  className?: string;
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  leftPanel,
  rightPanel,
  direction = 'horizontal',
  defaultSplit = 50,
  minSize = 20,
  maxSize = 80,
  onResize,
  className,
}) => {
  const [split, setSplit] = useState(defaultSplit);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    let newSplit: number;

    if (direction === 'horizontal') {
      newSplit = ((e.clientX - rect.left) / rect.width) * 100;
    } else {
      newSplit = ((e.clientY - rect.top) / rect.height) * 100;
    }

    newSplit = Math.max(minSize, Math.min(maxSize, newSplit));
    setSplit(newSplit);
    onResize?.(newSplit);
  }, [direction, minSize, maxSize, onResize]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  return (
    <div
      ref={containerRef}
      className={classNames(styles.container, styles[direction], className)}
    >
      <div className={styles.leftPanel} style={{ flexBasis: `${split}%` }}>
        {leftPanel}
      </div>
      <div
        className={styles.divider}
        onMouseDown={handleMouseDown}
        role="separator"
        aria-orientation={direction}
      />
      <div className={styles.rightPanel} style={{ flexBasis: `${100 - split}%` }}>
        {rightPanel}
      </div>
    </div>
  );
};
```

**사용 예시:**
```tsx
<ResizablePanel
  direction="horizontal"
  defaultSplit={60}
  minSize={30}
  leftPanel={<ChatArea />}
  rightPanel={<PDFViewer />}
/>
```

---

## 3. Feedback 컴포넌트

### 3.1 Modal

포털 기반 범용 모달.

```typescript
// packages/ui/src/feedback/Modal.tsx

interface ModalProps {
  /** 모달 표시 여부 */
  isOpen: boolean;
  /** 닫기 콜백 */
  onClose: () => void;
  /** 모달 제목 */
  title?: string;
  /** 모달 크기 */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** ESC 키로 닫기 (기본 true) */
  closeOnEsc?: boolean;
  /** 오버레이 클릭으로 닫기 (기본 true) */
  closeOnOverlay?: boolean;
  /** 닫기 버튼 표시 (기본 true) */
  showCloseButton?: boolean;
  /** 모달 콘텐츠 */
  children: React.ReactNode;
  /** 푸터 영역 */
  footer?: React.ReactNode;
  /** 추가 클래스 */
  className?: string;
}

const MODAL_SIZES = {
  sm: '400px',
  md: '560px',
  lg: '720px',
  xl: '960px',
  full: '100vw',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  closeOnEsc = true,
  closeOnOverlay = true,
  showCloseButton = true,
  children,
  footer,
  className,
}) => {
  // ESC 키 핸들링
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, closeOnEsc, onClose]);

  // body 스크롤 잠금
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.overlay} onClick={closeOnOverlay ? onClose : undefined}>
      <div
        className={classNames(styles.modal, styles[size], className)}
        style={{ maxWidth: MODAL_SIZES[size] }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {(title || showCloseButton) && (
          <header className={styles.header}>
            {title && <h2 id="modal-title" className={styles.title}>{title}</h2>}
            {showCloseButton && (
              <button
                className={styles.closeButton}
                onClick={onClose}
                aria-label="닫기"
              >
                <FiX />
              </button>
            )}
          </header>
        )}
        <div className={styles.body}>{children}</div>
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </div>,
    document.body
  );
};
```

**사용 예시:**
```tsx
<Modal
  isOpen={isEditOpen}
  onClose={handleClose}
  title="워크플로우 편집"
  size="lg"
  footer={
    <div className={styles.footerButtons}>
      <Button variant="secondary" onClick={handleClose}>취소</Button>
      <Button variant="primary" onClick={handleSave}>저장</Button>
    </div>
  }
>
  <WorkflowEditForm workflow={selectedWorkflow} />
</Modal>
```

### 3.2 EmptyState

목록이 비어있을 때 표시하는 컴포넌트.

```typescript
// packages/ui/src/feedback/EmptyState.tsx

interface EmptyStateProps {
  /** 아이콘 */
  icon?: React.ReactNode;
  /** 제목 */
  title: string;
  /** 설명 */
  description?: string;
  /** 액션 버튼 */
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  /** 추천 항목 (SuggestionChips와 연동) */
  suggestions?: string[];
  /** 추천 항목 클릭 콜백 */
  onSuggestionClick?: (text: string) => void;
  /** 추가 클래스 */
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  suggestions,
  onSuggestionClick,
  className,
}) => {
  return (
    <div className={classNames(styles.container, className)}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && (
        <Button
          variant="primary"
          onClick={action.onClick}
          className={styles.actionButton}
        >
          {action.icon}
          {action.label}
        </Button>
      )}
      {suggestions && suggestions.length > 0 && (
        <SuggestionChips
          suggestions={suggestions}
          onClick={onSuggestionClick}
          className={styles.suggestions}
        />
      )}
    </div>
  );
};
```

**사용 예시:**
```tsx
<EmptyState
  icon={<FiMessageCircle size={48} />}
  title="대화를 시작해보세요"
  description="AI와 대화하여 업무를 자동화할 수 있습니다."
  action={{
    label: '새 대화 시작',
    onClick: handleNewChat,
    icon: <FiPlus />,
  }}
  suggestions={['오늘 일정 알려줘', '이메일 요약해줘', '보고서 작성 도와줘']}
  onSuggestionClick={handleSuggestionClick}
/>
```

### 3.3 Toast

토스트 알림 시스템.

```typescript
// packages/ui/src/feedback/Toast.tsx

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

interface ToastContextValue {
  toast: {
    success: (message: string, options?: ToastOptions) => void;
    error: (message: string, options?: ToastOptions) => void;
    warning: (message: string, options?: ToastOptions) => void;
    info: (message: string, options?: ToastOptions) => void;
  };
}

interface ToastOptions {
  duration?: number;
}

// ToastProvider
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = useCallback((type: ToastType, message: string, options?: ToastOptions) => {
    const id = Date.now().toString();
    const duration = options?.duration ?? 3000;

    setToasts((prev) => [...prev, { id, type, message, duration, onClose: removeToast }]);

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useMemo(() => ({
    success: (message: string, options?: ToastOptions) => addToast('success', message, options),
    error: (message: string, options?: ToastOptions) => addToast('error', message, options),
    warning: (message: string, options?: ToastOptions) => addToast('warning', message, options),
    info: (message: string, options?: ToastOptions) => addToast('info', message, options),
  }), [addToast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {createPortal(
        <div className={styles.toastContainer}>
          {toasts.map((t) => (
            <Toast key={t.id} {...t} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
```

**사용 예시:**
```tsx
const { toast } = useToast();

// 성공 토스트
toast.success('저장되었습니다.');

// 에러 토스트
toast.error('저장에 실패했습니다.');

// 커스텀 duration
toast.info('업로드 중입니다...', { duration: 0 }); // 자동 닫힘 없음
```

---

## 4. Data Display 컴포넌트

### 4.1 Card

범용 카드 컴포넌트.

```typescript
// packages/ui/src/data-display/Card.tsx

interface CardProps {
  /** 카드 ID */
  id: string;
  /** 카드 제목 */
  title: string;
  /** 카드 설명 */
  description?: string;
  /** 썸네일 (이미지 URL 또는 컴포넌트) */
  thumbnail?: string | React.ReactNode;
  /** 메타데이터 목록 */
  metadata?: CardMetadata[];
  /** 상태 배지 */
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'error' | 'info' | 'default';
  };
  /** 드롭다운 메뉴 액션 */
  actions?: CardAction[];
  /** 선택 가능 여부 */
  selectable?: boolean;
  /** 선택 상태 */
  selected?: boolean;
  /** 카드 클릭 콜백 */
  onClick?: () => void;
  /** 선택 변경 콜백 */
  onSelect?: (id: string, selected: boolean) => void;
  /** 추가 클래스 */
  className?: string;
}

interface CardMetadata {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
}

interface CardAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({
  id,
  title,
  description,
  thumbnail,
  metadata,
  badge,
  actions,
  selectable,
  selected,
  onClick,
  onSelect,
  className,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (selectable && onSelect) {
      e.stopPropagation();
      onSelect(id, !selected);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className={classNames(
        styles.card,
        { [styles.selected]: selected, [styles.clickable]: onClick || selectable },
        className
      )}
      onClick={handleClick}
    >
      {/* Thumbnail */}
      {thumbnail && (
        <div className={styles.thumbnail}>
          {typeof thumbnail === 'string' ? (
            <img src={thumbnail} alt={title} />
          ) : (
            thumbnail
          )}
        </div>
      )}

      {/* Body */}
      <div className={styles.body}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          {badge && (
            <Badge variant={badge.variant}>{badge.text}</Badge>
          )}
        </div>
        {description && <p className={styles.description}>{description}</p>}
        {metadata && metadata.length > 0 && (
          <div className={styles.metadata}>
            {metadata.map((meta, idx) => (
              <div key={idx} className={styles.metaItem}>
                {meta.icon}
                <span className={styles.metaLabel}>{meta.label}:</span>
                <span className={styles.metaValue}>{meta.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions Dropdown */}
      {actions && actions.length > 0 && (
        <DropdownMenu
          trigger={
            <button className={styles.moreButton} aria-label="더보기">
              <FiMoreVertical />
            </button>
          }
          items={actions}
          onOpenChange={setMenuOpen}
        />
      )}

      {/* Selection Checkbox */}
      {selectable && (
        <div className={styles.checkbox}>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect?.(id, !selected)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
```

**사용 예시:**
```tsx
<Card
  id="workflow-1"
  title="이커머스 법률챗"
  description="고객 법률 상담 자동화 워크플로우"
  thumbnail={<WorkflowPreview nodes={workflow.nodes} />}
  metadata={[
    { icon: <FiClock />, label: '수정일', value: '2025.01.28' },
    { icon: <FiPlay />, label: '실행', value: 1234 },
  ]}
  badge={{ text: 'Active', variant: 'success' }}
  actions={[
    { id: 'edit', label: '수정', icon: <FiEdit />, onClick: () => handleEdit(workflow) },
    { id: 'copy', label: '복사', icon: <FiCopy />, onClick: () => handleCopy(workflow) },
    { id: 'delete', label: '삭제', icon: <FiTrash />, onClick: () => handleDelete(workflow), danger: true },
  ]}
  onClick={() => handleOpenDetail(workflow)}
/>
```

### 4.2 CardGrid

카드 그리드 레이아웃.

```typescript
// packages/ui/src/data-display/CardGrid.tsx

interface CardGridProps {
  /** 카드 컴포넌트 목록 */
  children: React.ReactNode;
  /** 열 수 (반응형) */
  columns?: {
    sm?: number;  // 640px 이상
    md?: number;  // 768px 이상
    lg?: number;  // 1024px 이상
    xl?: number;  // 1280px 이상
  };
  /** 카드 간격 */
  gap?: 'sm' | 'md' | 'lg';
  /** 추가 클래스 */
  className?: string;
}

export const CardGrid: React.FC<CardGridProps> = ({
  children,
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 'md',
  className,
}) => {
  return (
    <div
      className={classNames(styles.grid, styles[`gap-${gap}`], className)}
      style={{
        '--columns-sm': columns.sm,
        '--columns-md': columns.md,
        '--columns-lg': columns.lg,
        '--columns-xl': columns.xl,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
};
```

### 4.3 KpiCard

대시보드용 KPI 카드.

```typescript
// packages/ui/src/data-display/KpiCard.tsx

interface KpiCardProps {
  /** KPI 레이블 */
  label: string;
  /** KPI 값 */
  value?: number | string;
  /** 빈 상태 메시지 */
  emptyText?: string;
  /** 아이콘 */
  icon?: React.ReactNode;
  /** 값 색상 */
  valueColor?: string;
  /** 트렌드 표시 */
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  /** 카드 클릭 콜백 */
  onClick?: () => void;
  /** 추가 클래스 */
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  emptyText = '데이터 없음',
  icon,
  valueColor,
  trend,
  onClick,
  className,
}) => {
  const hasValue = value !== undefined && value !== null && value !== '';

  return (
    <div
      className={classNames(styles.kpiCard, { [styles.clickable]: onClick }, className)}
      onClick={onClick}
    >
      <p className={styles.label}>{label}</p>
      <div className={styles.valueRow}>
        {hasValue ? (
          <p className={styles.value} style={{ color: valueColor }}>
            {value}
          </p>
        ) : (
          <p className={styles.emptyText}>{emptyText}</p>
        )}
        {icon && <div className={styles.iconWrap}>{icon}</div>}
      </div>
      {trend && (
        <div className={classNames(styles.trend, styles[trend.direction])}>
          {trend.direction === 'up' && <FiArrowUp />}
          {trend.direction === 'down' && <FiArrowDown />}
          <span>{trend.value}</span>
        </div>
      )}
    </div>
  );
};
```

**사용 예시:**
```tsx
<div className={styles.kpiRow}>
  <KpiCard
    label="전체 워크플로우"
    value={124}
    icon={<FiLayers />}
    valueColor="#40444d"
  />
  <KpiCard
    label="정상 운영"
    value={80}
    icon={<FiCheck />}
    valueColor="#2eb146"
    trend={{ direction: 'up', value: '+5%' }}
  />
  <KpiCard
    label="일시 중지"
    value={10}
    icon={<FiPause />}
    valueColor="#f59f00"
  />
  <KpiCard
    label="오류"
    value={4}
    icon={<FiAlertTriangle />}
    valueColor="#e03131"
    onClick={handleNavigateToErrors}
  />
</div>
```

### 4.4 Badge

상태 배지.

```typescript
// packages/ui/src/data-display/Badge.tsx

interface BadgeProps {
  /** 배지 변형 */
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  /** 배지 크기 */
  size?: 'sm' | 'md';
  /** 배지 내용 */
  children: React.ReactNode;
  /** 추가 클래스 */
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'sm',
  children,
  className,
}) => {
  return (
    <span className={classNames(styles.badge, styles[variant], styles[size], className)}>
      {children}
    </span>
  );
};
```

### 4.5 DataTable

정렬/필터/선택 기능이 있는 데이터 테이블.

```typescript
// packages/ui/src/data-display/DataTable.tsx

interface Column<T> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  /** 데이터 */
  data: T[];
  /** 컬럼 정의 */
  columns: Column<T>[];
  /** 로딩 상태 */
  loading?: boolean;
  /** 빈 상태 텍스트 */
  emptyText?: string;
  /** 행 선택 가능 여부 */
  selectable?: boolean;
  /** 선택된 행 ID 목록 */
  selectedIds?: string[];
  /** 행 키 추출 함수 */
  getRowId: (row: T) => string;
  /** 정렬 상태 */
  sortState?: { column: string; direction: 'asc' | 'desc' };
  /** 정렬 변경 콜백 */
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  /** 선택 변경 콜백 */
  onSelectionChange?: (ids: string[]) => void;
  /** 행 클릭 콜백 */
  onRowClick?: (row: T) => void;
  /** 추가 클래스 */
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  loading,
  emptyText = '데이터가 없습니다',
  selectable,
  selectedIds = [],
  getRowId,
  sortState,
  onSort,
  onSelectionChange,
  onRowClick,
  className,
}: DataTableProps<T>) {
  // ... 구현
}
```

---

## 5. Input 컴포넌트

### 5.1 SearchInput

검색 입력 필드.

```typescript
// packages/ui/src/inputs/SearchInput.tsx

interface SearchInputProps {
  /** 입력 값 */
  value: string;
  /** 값 변경 콜백 */
  onChange: (value: string) => void;
  /** 플레이스홀더 */
  placeholder?: string;
  /** 검색 실행 콜백 (Enter 또는 버튼 클릭) */
  onSearch?: (value: string) => void;
  /** 클리어 버튼 표시 */
  clearable?: boolean;
  /** 로딩 상태 */
  loading?: boolean;
  /** 비활성화 */
  disabled?: boolean;
  /** 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 추가 클래스 */
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = '검색...',
  onSearch,
  clearable = true,
  loading,
  disabled,
  size = 'md',
  className,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className={classNames(styles.container, styles[size], className)}>
      <FiSearch className={styles.icon} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || loading}
        className={styles.input}
      />
      {loading && <Spinner size="sm" className={styles.spinner} />}
      {clearable && value && !loading && (
        <button
          className={styles.clearButton}
          onClick={() => onChange('')}
          aria-label="검색어 지우기"
        >
          <FiX />
        </button>
      )}
    </div>
  );
};
```

### 5.2 FilterTabs

필터 탭.

```typescript
// packages/ui/src/inputs/FilterTabs.tsx

interface FilterTab {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface FilterTabsProps {
  /** 탭 목록 */
  tabs: FilterTab[];
  /** 활성 탭 ID */
  activeTab: string;
  /** 탭 변경 콜백 */
  onChange: (tabId: string) => void;
  /** 크기 */
  size?: 'sm' | 'md';
  /** 추가 클래스 */
  className?: string;
}

export const FilterTabs: React.FC<FilterTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  size = 'md',
  className,
}) => {
  return (
    <div className={classNames(styles.tabs, styles[size], className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={classNames(styles.tab, { [styles.active]: tab.id === activeTab })}
          onClick={() => onChange(tab.id)}
          role="tab"
          aria-selected={tab.id === activeTab}
        >
          {tab.icon}
          <span>{tab.label}</span>
          {tab.count !== undefined && (
            <span className={styles.count}>{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
};
```

**사용 예시:**
```tsx
<FilterTabs
  tabs={[
    { id: 'all', label: '전체', count: 124 },
    { id: 'personal', label: '개인', count: 45 },
    { id: 'shared', label: '공유', count: 79 },
    { id: 'active', label: '활성', count: 98, icon: <FiCheck /> },
    { id: 'inactive', label: '비활성', count: 26, icon: <FiPause /> },
  ]}
  activeTab={filter}
  onChange={setFilter}
/>
```

### 5.3 FormField

폼 필드 래퍼.

```typescript
// packages/ui/src/inputs/FormField.tsx

interface FormFieldProps {
  /** 필드 라벨 */
  label: string;
  /** 필수 여부 */
  required?: boolean;
  /** 에러 메시지 */
  error?: string;
  /** 도움말 텍스트 */
  helpText?: string;
  /** 입력 필드 */
  children: React.ReactNode;
  /** 추가 클래스 */
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  helpText,
  children,
  className,
}) => {
  return (
    <div className={classNames(styles.field, { [styles.hasError]: error }, className)}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      <div className={styles.inputWrapper}>{children}</div>
      {error && <p className={styles.error}>{error}</p>}
      {helpText && !error && <p className={styles.helpText}>{helpText}</p>}
    </div>
  );
};
```

### 5.4 Toggle

토글 스위치.

```typescript
// packages/ui/src/inputs/Toggle.tsx

interface ToggleProps {
  /** 활성 상태 */
  checked: boolean;
  /** 상태 변경 콜백 */
  onChange: (checked: boolean) => void;
  /** 라벨 */
  label?: string;
  /** 비활성화 */
  disabled?: boolean;
  /** 크기 */
  size?: 'sm' | 'md';
  /** 추가 클래스 */
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  disabled,
  size = 'md',
  className,
}) => {
  return (
    <label className={classNames(styles.toggle, styles[size], { [styles.disabled]: disabled }, className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className={styles.input}
      />
      <span className={styles.switch} />
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
};
```

---

## 6. Navigation 컴포넌트

### 6.1 DropdownMenu

드롭다운 메뉴.

```typescript
// packages/ui/src/navigation/DropdownMenu.tsx

interface DropdownMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

interface DropdownMenuProps {
  /** 트리거 요소 */
  trigger: React.ReactNode;
  /** 메뉴 아이템 */
  items: DropdownMenuItem[];
  /** 메뉴 위치 */
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
  /** 열림/닫힘 상태 변경 콜백 */
  onOpenChange?: (open: boolean) => void;
  /** 추가 클래스 */
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  items,
  placement = 'bottom-end',
  onOpenChange,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 감지
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
        onOpenChange?.(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onOpenChange]);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onOpenChange?.(newState);
  };

  const handleItemClick = (item: DropdownMenuItem) => {
    if (item.disabled) return;
    item.onClick();
    setIsOpen(false);
    onOpenChange?.(false);
  };

  return (
    <div className={classNames(styles.dropdown, className)}>
      <div ref={triggerRef} onClick={handleToggle}>
        {trigger}
      </div>
      {isOpen && createPortal(
        <div
          ref={menuRef}
          className={classNames(styles.menu, styles[placement])}
          style={calculatePosition(triggerRef.current, placement)}
        >
          {items.map((item, idx) =>
            item.divider ? (
              <div key={idx} className={styles.divider} />
            ) : (
              <button
                key={item.id}
                className={classNames(styles.item, {
                  [styles.danger]: item.danger,
                  [styles.disabled]: item.disabled,
                })}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            )
          )}
        </div>,
        document.body
      )}
    </div>
  );
};
```

### 6.2 SuggestionChips

클릭 가능한 추천 칩.

```typescript
// packages/ui/src/navigation/SuggestionChips.tsx

interface SuggestionChipsProps {
  /** 추천 텍스트 목록 */
  suggestions: string[];
  /** 칩 클릭 콜백 */
  onClick?: (text: string) => void;
  /** 정렬 */
  alignment?: 'left' | 'center' | 'right';
  /** 최대 표시 개수 */
  maxVisible?: number;
  /** 추가 클래스 */
  className?: string;
}

export const SuggestionChips: React.FC<SuggestionChipsProps> = ({
  suggestions,
  onClick,
  alignment = 'center',
  maxVisible,
  className,
}) => {
  const visibleSuggestions = maxVisible
    ? suggestions.slice(0, maxVisible)
    : suggestions;

  return (
    <div className={classNames(styles.chips, styles[alignment], className)}>
      {visibleSuggestions.map((text, idx) => (
        <button
          key={idx}
          className={styles.chip}
          onClick={() => onClick?.(text)}
        >
          {text}
        </button>
      ))}
    </div>
  );
};
```

---

## 패키지 Export 정리

```typescript
// packages/ui/src/index.ts

// Layout
export { ContentArea } from './layout/ContentArea';
export type { ContentAreaProps } from './layout/ContentArea';
export { ResizablePanel } from './layout/ResizablePanel';
export type { ResizablePanelProps } from './layout/ResizablePanel';

// Feedback
export { Modal } from './feedback/Modal';
export type { ModalProps } from './feedback/Modal';
export { EmptyState } from './feedback/EmptyState';
export type { EmptyStateProps } from './feedback/EmptyState';
export { Toast, ToastProvider, useToast } from './feedback/Toast';
export type { ToastType, ToastOptions } from './feedback/Toast';

// Data Display
export { Card } from './data-display/Card';
export type { CardProps, CardMetadata, CardAction } from './data-display/Card';
export { CardGrid } from './data-display/CardGrid';
export type { CardGridProps } from './data-display/CardGrid';
export { KpiCard } from './data-display/KpiCard';
export type { KpiCardProps } from './data-display/KpiCard';
export { Badge } from './data-display/Badge';
export type { BadgeProps } from './data-display/Badge';
export { DataTable } from './data-display/DataTable';
export type { DataTableProps, Column } from './data-display/DataTable';

// Inputs
export { SearchInput } from './inputs/SearchInput';
export type { SearchInputProps } from './inputs/SearchInput';
export { FilterTabs } from './inputs/FilterTabs';
export type { FilterTabsProps, FilterTab } from './inputs/FilterTabs';
export { FormField } from './inputs/FormField';
export type { FormFieldProps } from './inputs/FormField';
export { Toggle } from './inputs/Toggle';
export type { ToggleProps } from './inputs/Toggle';

// Navigation
export { DropdownMenu } from './navigation/DropdownMenu';
export type { DropdownMenuProps, DropdownMenuItem } from './navigation/DropdownMenu';
export { SuggestionChips } from './navigation/SuggestionChips';
export type { SuggestionChipsProps } from './navigation/SuggestionChips';
```
