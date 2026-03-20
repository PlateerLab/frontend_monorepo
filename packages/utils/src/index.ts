// @xgen/utils
export function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : undefined;
}
export function setCookie(name: string, value: string, days = 7): void {
  const d = new Date(); d.setTime(d.getTime() + days * 86400000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/`;
}
export function deleteCookie(name: string): void { document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/`; }
export function getAuthCookie(key: string): string | undefined { return getCookie(`xgen_${key}`); }
export function setCookieAuth(key: string, value: string): void { setCookie(`xgen_${key}`, value, 7); }
export function removeAuthCookie(key: string): void { deleteCookie(`xgen_${key}`); }
export function clearAllAuth(): void { ['user_id','username','access_token'].forEach(k => removeAuthCookie(k)); }
export function clearAllUserData(clearCookies = true): void {
  if (clearCookies) clearAllAuth();
  try { localStorage.removeItem('xgen-locale'); } catch {}
}

export const devLog = {
  log: (...args: unknown[]) => { if (process.env.NODE_ENV === 'development') console.log('[XGEN]', ...args); },
  warn: (...args: unknown[]) => { if (process.env.NODE_ENV === 'development') console.warn('[XGEN]', ...args); },
  error: (...args: unknown[]) => console.error('[XGEN]', ...args),
};
