/**
 * Main Page Route Configuration
 *
 * Maps sidebar item IDs to route paths for navigation.
 */

// ─────────────────────────────────────────────────────────────
// Route Mappings
// ─────────────────────────────────────────────────────────────

export const routeMappings: Record<string, string> = {
  // Dashboard
  'dashboard': 'dashboard',

  // Chat Section
  'chat-intro': 'chat-intro',
  'chat-history': 'chat-history',
  'chat-new': 'chat-new',
  'chat-current': 'chat-current',

  // Workflow Section
  'workflow-intro': 'workflow-intro',
  'canvas-intro': 'canvas-intro',
  'workflows': 'workflows',
  'documents': 'documents',
  'tool-storage': 'tool-storage',
  'prompt-storage': 'prompt-storage',
  'auth-profile': 'auth-profile',

  // Model Section
  'model-intro': 'model-intro',
  'model-train': 'model-train',
  'model-eval': 'model-eval',
  'model-storage': 'model-storage',
  'model-metrics': 'model-metrics',

  // ML Section
  'ml-intro': 'ml-intro',
  'ml-train': 'ml-train',
  'ml-hub': 'ml-hub',

  // Data Section
  'data-intro': 'data-intro',
  'data-station': 'data-station',
  'data-storage': 'data-storage',

  // Support Section
  'service-request': 'service-request',
  'faq': 'faq',
};

// ─────────────────────────────────────────────────────────────
// Navigation Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Get route path from sidebar item ID
 */
export function getRoutePath(itemId: string): string {
  return routeMappings[itemId] || itemId;
}

/**
 * Get sidebar item ID from route path
 */
export function getSidebarItemId(routePath: string): string | undefined {
  return Object.entries(routeMappings).find(([, path]) => path === routePath)?.[0];
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
