/**
 * Main Page Route Configuration
 *
 * 내부 매핑 로직 제거 — itemId를 그대로 route path로 사용.
 * 인터페이스(함수 시그니처)는 유지하여 하위 호환성 보장.
 * 향후 itemId ≠ routePath 매핑이 필요하면 routeMappings에 추가.
 */

// ─────────────────────────────────────────────────────────────
// Route Mappings (현재 비어있음 — itemId === routePath)
// 향후 itemId와 URL path가 다른 경우만 여기에 추가
// ─────────────────────────────────────────────────────────────

export const routeMappings: Record<string, string> = {};

// ─────────────────────────────────────────────────────────────
// Navigation Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Get route path from sidebar item ID.
 * routeMappings에 등록된 것이 있으면 사용, 없으면 itemId 그대로 반환.
 */
export function getRoutePath(itemId: string): string {
  return routeMappings[itemId] || itemId;
}

/**
 * Get sidebar item ID from route path.
 * routeMappings에 등록된 역매핑이 있으면 사용, 없으면 routePath 그대로 반환.
 */
export function getSidebarItemId(routePath: string): string {
  const found = Object.entries(routeMappings).find(([, path]) => path === routePath);
  return found ? found[0] : routePath;
}

/**
 * Get full URL path for main section
 */
export function getMainSectionPath(itemId: string): string {
  const routePath = getRoutePath(itemId);
  return `/main/${routePath}`;
}

// ─────────────────────────────────────────────────────────────
// Default Route
// ─────────────────────────────────────────────────────────────

export const DEFAULT_ROUTE = 'dashboard';
export const DEFAULT_PATH = `/main/${DEFAULT_ROUTE}`;

export default routeMappings;
