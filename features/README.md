# `features/` — Feature 패키지 디렉토리

> **역할:** XGEN 프로덕트의 각 **독립된 기능 단위.**
> 각 Feature는 하나의 화면 또는 위젯을 담당하며, **플러그인 방식**으로 앱에 등록된다.

---

## 패키지 명명 규칙

```
features/
├── main-*         ← 메인 앱 기능 (대시보드, 문서, 프롬프트 등)
├── canvas-*       ← 캔버스(워크플로우 에디터) 기능
├── root-*         ← 랜딩(비로그인) 기능
└── auth-*         ← 인증 관련 기능
```

폴더 이름 = npm 패키지 이름에서 `@xgen/feature-` 접두사를 뺀 것.
**kebab-case**가 필수이며, 카멜 케이스(`ChatHistory`)는 사용하지 않는다.

---

## 절대 규칙

### 1. Feature 독립성 (가장 중요)

```
❌ Feature → Feature 직접 import 절대 금지
   import { something } from '@xgen/feature-main-dashboard';  // NEVER

⭕ Feature 간 통신은 반드시 FeatureRegistry를 통한다
   const feature = registry.getFeature('main-dashboard');
```

**이유:** Feature는 플러그인이다. 어떤 Feature가 빠져도 앱은 동작해야 한다.

### 2. 의존성 방향

```
                ┌──────────────────────┐
                │   apps/web (조립만)   │
                └────────┬─────────────┘
                         │ imports
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼─────┐   ┌─────▼──────┐  ┌─────▼──────┐
   │ Feature A │   │ Feature B  │  │ Feature C  │
   └────┬──────┘   └─────┬──────┘  └──────┬─────┘
        │                │                 │
        └────────────────┼─────────────────┘
                         │ imports
                ┌────────▼─────────────┐
                │   packages/* (공유)   │
                └──────────────────────┘
```

```
⭕ Feature가 import할 수 있는 것:
   - @xgen/ui (모든 UI는 여기서)
   - @xgen/types (타입, FeatureRegistry)
   - @xgen/i18n (다국어)
   - @xgen/icons (아이콘)
   - @xgen/api-client (API 호출)
   - @xgen/auth-provider (인증 상태)
   - @xgen/config (환경 설정)

❌ Feature가 import하면 안 되는 것:
   - 다른 Feature 패키지
   - apps/web의 코드
```

### 3. 스타일링 규칙 (전환기)

```
기존 코드:
  ⭕ .module.scss 유지 (기존 파일에 한해)
  ⭕ 점진적으로 Tailwind + cn()으로 전환

신규 코드:
  ⭕ Tailwind 유틸리티 클래스 + cn()
  ⭕ @xgen/ui의 프리미티브/컴포넌트 사용
  ❌ 새 .module.scss 파일 생성 금지
  ❌ 하드코딩 색상 (#hex) 금지
  ❌ CSS-in-JS 금지
```

### 4. Feature 등록 패턴

모든 Feature는 `index.ts`에서 FeatureModule을 export해야 한다:

```ts
// features/main-example/src/index.ts
import type { MainFeatureModule } from '@xgen/types';

const feature: MainFeatureModule = {
  id: 'main-example',
  name: 'Example',
  path: '/example',
  component: lazy(() => import('./ExamplePage')),
  sidebar: {
    icon: ExampleIcon,
    label: 'example.sidebar.label',
    order: 10,
  },
};

export default feature;
```

### 5. 컴포넌트 구현 패턴

```tsx
// ⭕ 올바른 패턴
import { cn, Button, Card } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';

export function ExamplePanel({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <Card className={cn('p-4', className)}>
      <Button>{t('example.action')}</Button>
    </Card>
  );
}
```

```tsx
// ❌ 잘못된 패턴
import styles from './example.module.scss';  // 신규 SCSS 금지
import { Button } from '@radix-ui/react-button'; // @xgen/ui를 통해야 함
```

---

## 새 Feature 생성 체크리스트

1. `features/<prefix>-<name>/` 폴더 생성
2. `package.json` 작성 (`"name": "@xgen/feature-<prefix>-<name>"`)
3. `src/index.ts` — FeatureModule export
4. `src/<Name>Page.tsx` — 메인 컴포넌트
5. `pnpm-workspace.yaml`에 이미 `features/*` 글로브 등록됨 (추가 작업 불필요)
6. `apps/web`의 feature registry에 등록
7. 다국어 키 `@xgen/i18n`에 추가
