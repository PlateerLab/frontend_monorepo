# CSS 글로벌 리셋 오버라이팅 분석 리포트

## 1. 현상

브라우저 DevTools에서 `* { box-sizing: border-box; margin: 0; padding: 0; }` 규칙이 **모든 요소**에 적용되고 있다.  
이 규칙을 해제하면 정상적인 디자인이 렌더링되지만, 체크(활성화)하면 전체 레이아웃이 훼손된다.

---

## 2. 원인 위치

**파일**: `apps/web/src/app/globals.css` (39~42행)

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
```

이 규칙이 **유일한 원인**이다.

---

## 3. 상세 분석

### 3.1 Tailwind v4 Preflight와의 중복

Tailwind v4는 `@import 'tailwindcss'`를 통해 자체 Preflight(CSS 리셋)를 자동으로 주입한다.  
Tailwind v4 Preflight가 이미 처리하는 항목:

| 속성 | Tailwind Preflight | 우리 커스텀 `*` 규칙 |
|---|---|---|
| `box-sizing: border-box` | ✅ `*, *::before, *::after`에 적용 | ❌ 중복 |
| `margin: 0` | ✅ `h1~h6, p, figure, blockquote, dl, dd, hr` 등 선택적 적용 | ❌ **모든 요소**에 무차별 적용 |
| `padding: 0` | ✅ `ol, ul, menu, fieldset, legend` 등 선택적 적용 | ❌ **모든 요소**에 무차별 적용 |

**핵심 차이**: Tailwind Preflight는 **필요한 요소에만 선택적**으로 리셋하지만, 우리 `*` 규칙은 **모든 요소에 무차별적**으로 적용한다.

### 3.2 어떤 요소들이 영향을 받는가

`margin: 0; padding: 0`이 `*`로 걸리면:

- **`<button>`**: 브라우저 기본 padding이 제거되어 텍스트가 테두리에 붙음
- **`<input>`, `<select>`, `<textarea>`**: 내부 여백이 사라져 입력 필드가 비정상적으로 좁아짐
- **`<th>`, `<td>`**: 테이블 셀 패딩이 사라져 내용이 밀착
- **`<summary>`, `<details>`**: 네이티브 UI 패딩이 훼손
- **`<dialog>`**: 모달 기본 패딩 제거
- **`<fieldset>`**: 기본 padding/margin이 사라져 폼 그룹 레이아웃 훼손
- **shadcn/ui 컴포넌트**: Radix UI 기반 컴포넌트들이 내부적으로 기대하는 기본 spacing이 깨짐

### 3.3 원본(xgen-frontend)과의 비교

```css
/* xgen-frontend/src/app/globals.css — 원본 */
* {
  box-sizing: border-box;
}
```

원본에는 **`box-sizing: border-box`만 있었다**. `margin: 0; padding: 0`은 **마이그레이션 과정에서 잘못 추가된 규칙**이다.

### 3.4 영향 범위

이 규칙은 `globals.css`에 있으므로:
- 랜딩 페이지 (`/`)
- 메인 페이지 (`/main`)
- 캔버스 페이지 (`/canvas`)
- 로그인 페이지 (`/login`)

**모든 라우트의 모든 요소**에 영향을 준다.

---

## 4. 개선 방안

### 방안 A: 해당 규칙 제거 (권장 ✅)

```css
/* 변경 전 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* 변경 후 — Tailwind Preflight에 위임 */
/* (삭제 — Tailwind v4의 @import 'tailwindcss'가 이미 적절한 리셋을 포함) */
```

**이유**:
- `@import 'tailwindcss'`가 이미 Preflight를 포함하며, `box-sizing: border-box`도 적용됨
- Tailwind Preflight의 선택적 리셋이 더 안전하고 표준적
- 원본(xgen-frontend)도 `margin: 0; padding: 0`을 사용하지 않았음

**리스크**: 
- Tailwind Preflight에 의존하지 않고 `* { margin: 0; padding: 0 }`에 의존하던 컴포넌트가 있다면 간격이 달라질 수 있음
- 하지만 Tailwind Preflight가 `h1~h6, p, blockquote` 등에 이미 `margin: 0`을 적용하므로, 실질적 차이는 `<button>`, `<input>` 등 폼 요소의 padding 복원 정도

### 방안 B: `box-sizing`만 유지

```css
* {
  box-sizing: border-box;
}
```

원본(xgen-frontend)과 동일한 형태. Tailwind와 중복이지만 무해하며, 명시적이다.

### 방안 C: Tailwind Preflight 무효화 후 커스텀 리셋 (비권장 ❌)

```css
@import 'tailwindcss' preflight(none);
/* 자체 리셋 작성 */
```

복잡도만 증가하고 이점이 없다.

---

## 5. 결론

| 항목 | 내용 |
|---|---|
| **원인** | `globals.css`의 `* { margin: 0; padding: 0; }` — 모든 요소에 무차별 적용 |
| **원본 대비** | 원본에는 없었던 규칙 (마이그레이션 중 잘못 추가) |
| **Tailwind 중복** | Tailwind v4 Preflight가 이미 적절한 리셋을 포함 |
| **권장 조치** | `* { ... }` 블록 전체 삭제 (방안 A) 또는 `box-sizing`만 유지 (방안 B) |
| **예상 결과** | 버튼·폼 요소의 기본 padding 복원, 전체 레이아웃 정상화 |
