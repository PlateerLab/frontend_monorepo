'use client';

import './locales';

import React, { useState, useCallback } from 'react';
import type { FeatureModule } from '@xgen/types';
import { useAuth } from '@xgen/auth-provider';
import { useTranslation } from '@xgen/i18n';
import { FiEye, FiEyeOff } from '@xgen/icons';

// ─────────────────────────────────────────────────────────────
// Login Form Props
// ─────────────────────────────────────────────────────────────

export interface LoginFormProps {
  /** 로그인 성공 시 리다이렉트 URL (기본: /main?section=main-dashboard) */
  redirectUrl?: string;
  /** 로그인 성공 시 콜백 */
  onSuccess?: (user: { user_id: number; username: string }) => void;
  /** 비밀번호 초기화 링크 URL */
  forgotPasswordHref?: string;
  /** 회원가입 링크 URL */
  signupHref?: string;
}

// ─────────────────────────────────────────────────────────────
// Error Message Mapping
// ─────────────────────────────────────────────────────────────

function getErrorMessageKey(error: string): string {
  const errorKeyMap: Record<string, string> = {
    'Email and password are required': 'loginForm.errors.emailAndPasswordRequired',
    'Invalid email or password': 'loginForm.errors.invalidCredentials',
    'Database error': 'loginForm.errors.databaseError',
    'Failed to create token': 'loginForm.errors.tokenCreationFailed',
    'LOGIN_FAILED': 'loginForm.errors.loginFailed',
  };

  return errorKeyMap[error] || 'loginForm.errors.loginFailed';
}

// ─────────────────────────────────────────────────────────────
// Login Form Component
// ─────────────────────────────────────────────────────────────

export const LoginForm: React.FC<LoginFormProps> = ({
  redirectUrl,
  onSuccess,
  forgotPasswordHref = '/forgot-password',
  signupHref = '/signup',
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { loginWithCredentials, isLoading } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError(t('loginForm.errors.emailAndPasswordRequired'));
      return;
    }

    try {
      const result = await loginWithCredentials({ email, password });

      if (result.success) {
        onSuccess?.({ user_id: 0, username: '' });

        // 리다이렉트
        if (typeof window !== 'undefined') {
          const targetUrl = redirectUrl || '/main?section=main-dashboard';
          window.location.href = targetUrl;
        }
      } else {
        const errorKey = result.error ? getErrorMessageKey(result.error) : 'loginForm.errors.loginFailed';
        setError(t(errorKey));
      }
    } catch {
      setError(t('loginForm.errors.loginError'));
    }
  }, [email, password, loginWithCredentials, redirectUrl, onSuccess, t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-5">
      <div className="w-full max-w-[420px] bg-white rounded-2xl py-12 px-10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-[#1a1a2e] m-0 mb-2 tracking-tight">{t('loginForm.title')}</h1>
          <p className="text-sm text-gray-500 m-0">{t('loginForm.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="w-full">
            <input
              type="email"
              id="login-email"
              aria-label={t('loginForm.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('loginForm.emailPlaceholder')}
              autoComplete="email"
              required
              className="w-full py-3.5 px-4 text-[15px] border border-gray-200 rounded-lg outline-none transition-all duration-200 bg-gray-50 box-border focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] focus:bg-white placeholder:text-gray-400"
            />
          </div>

          <div className="w-full">
            <div className="relative w-full">
              <input
                type={showPassword ? 'text' : 'password'}
                id="login-password"
                aria-label={t('loginForm.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('loginForm.passwordPlaceholder')}
                autoComplete="current-password"
                required
                className="w-full py-3.5 px-4 pr-12 text-[15px] border border-gray-200 rounded-lg outline-none transition-all duration-200 bg-gray-50 box-border focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] focus:bg-white placeholder:text-gray-400"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer text-lg p-1 flex items-center justify-center"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? t('loginForm.hidePassword') : t('loginForm.showPassword')}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 py-3 px-4 bg-red-50 rounded-lg border border-red-200" role="alert">
              <span className="text-lg shrink-0">⚠️</span>
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          <div className="mt-2">
            <button type="submit" className="w-full py-3.5 px-6 text-base font-semibold text-white bg-gradient-to-br from-blue-500 to-blue-600 border-none rounded-lg cursor-pointer transition-all duration-200 hover:not-disabled:bg-gradient-to-br hover:not-disabled:from-blue-600 hover:not-disabled:to-blue-700 hover:not-disabled:-translate-y-px hover:not-disabled:shadow-[0_4px_12px_rgba(37,99,235,0.4)] disabled:opacity-60 disabled:cursor-not-allowed" disabled={isLoading}>
              {isLoading ? t('loginForm.loginLoading') : t('loginForm.loginButton')}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <a href={forgotPasswordHref} className="text-blue-500 no-underline text-sm font-medium hover:underline">
            {t('loginForm.forgotPassword')}
          </a>
          <p className="mt-4 text-sm text-gray-500">
            <span>{t('loginForm.noAccount')} </span>
            <a href={signupHref} className="text-blue-500 no-underline text-sm font-medium hover:underline">
              {t('loginForm.signup')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Module
// ─────────────────────────────────────────────────────────────

export const authLoginFormFeature: FeatureModule = {
  id: 'auth-login-form',
  name: 'Login Form',
};

export default authLoginFormFeature;
