# `apps/` — 애플리케이션 디렉토리

> **역할:** Feature들을 **조립만** 하는 최종 빌드 대상.
> 비즈니스 로직은 Feature에, UI 컴포넌트는 `@xgen/ui`에 둔다.

---

## 현재 앱

| 앱 | 경로 | 프레임워크 | 설명 |
|---|---|---|---|
| `web` | `apps/web/` | Next.js 16.2.1 + Turbopack | 메인 프로덕션 앱 |

---

## 절대 규칙

### 1. "조립만" 원칙

```
⭕ App에 있어야 하는 것:
   - Feature 등록/라우팅 (featureRegistry, auth-features 등)
   - 글로벌 레이아웃 (RootLayout, CanvasLayout)
   - 글로벌 스타일 진입점 (globals.css → @xgen/ui/styles 임포트)
   - 환경 설정 (next.config.ts, postcss.config.mjs)
   - middleware.ts (인증/리다이렉트)

❌ App에 있으면 안 되는 것:
   - UI 컴포넌트 정의 (→ @xgen/ui로)
   - 비즈니스 로직 (→ Feature로)
   - API 호출 로직 (→ @xgen/api-client로)
   - 유틸리티 함수 (→ 적절한 packages/*로)
```

### 2. Feature 등록 패턴

```ts
// apps/web/src/app/featureRegistry.ts
import dashboard from '@xgen/feature-main-dashboard';
import documents from '@xgen/feature-main-Documents';

registry.registerMainFeature(dashboard);
registry.registerMainFeature(documents);
```

**새 Feature 추가 = 이 파일에 등록 한 줄 추가.** App 코드 수정은 이것뿐이어야 한다.

### 3. 스타일 체인

```
apps/web/src/app/globals.css
  ├── @import 'tailwindcss'              ← Tailwind 런타임 (앱에서 import)
  └── @import '../../packages/ui/src/styles/globals.css'
       └── @theme { /* 모든 디자인 토큰 */ }
```

- `globals.css`에서 추가 토큰 정의 **금지** → `@xgen/ui/styles/globals.css`에 추가
- 레거시 호환 CSS 변수 매핑만 `apps/web/globals.css`에 유지 (전환기 한정)

### 4. PostCSS 설정

```js
// apps/web/postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

다른 PostCSS 플러그인 추가 시 반드시 팀 리뷰 필요.

### 5. shadcn CLI 사용

```bash
# 앱 레벨 블록/템플릿 설치 (드물게 사용)
cd apps/web
pnpm dlx shadcn@latest add <block-name>

# ⚠️ 프리미티브 컴포넌트는 apps/web이 아니라 packages/ui에서 설치
cd packages/ui
pnpm dlx shadcn@latest add <component-name>
```

### 6. 의존성 규칙

```
⭕ App이 의존할 수 있는 것:
   - 모든 @xgen/* 패키지 (packages/*)
   - 모든 @xgen/feature-* 패키지 (features/*)
   - next, react, react-dom

❌ App이 의존하면 안 되는 것:
   - @radix-ui/* 직접 의존 (→ @xgen/ui를 통해야 함)
   - 어떤 UI 라이브러리도 직접 (→ @xgen/ui를 통해야 함)
```

---

## 빌드 & 개발

```bash
# 개발 서버
pnpm dev:web

# 프로덕션 빌드
pnpm build:web

# 린트
pnpm lint:web
```
