'use client';

import './locales';

import React, { useState, useCallback } from 'react';
import type { FeatureModule } from '@xgen/types';
import { useAuth } from '@xgen/auth-provider';
import { useTranslation } from '@xgen/i18n';
import { FiEye, FiEyeOff } from '@xgen/icons';
import styles from './styles/login-form.module.css';

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
    <div className={styles.loginPage}>
      <div className={styles.loginBox}>
        <div className={styles.logoArea}>
          <h1 className={styles.logoText}>{t('loginForm.title')}</h1>
          <p className={styles.subtitle}>{t('loginForm.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <div className={styles.inputGroup}>
            <input
              type="email"
              id="login-email"
              aria-label={t('loginForm.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('loginForm.emailPlaceholder')}
              autoComplete="email"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="login-password"
                aria-label={t('loginForm.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('loginForm.passwordPlaceholder')}
                autoComplete="current-password"
                required
                className={styles.input}
              />
              <button
                type="button"
                className={styles.eyeToggle}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? t('loginForm.hidePassword') : t('loginForm.showPassword')}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className={styles.errorRow} role="alert">
              <span className={styles.errorIcon}>⚠️</span>
              <span className={styles.errorText}>{error}</span>
            </div>
          )}

          <div className={styles.buttons}>
            <button type="submit" className={styles.loginButton} disabled={isLoading}>
              {isLoading ? t('loginForm.loginLoading') : t('loginForm.loginButton')}
            </button>
          </div>
        </form>

        <div className={styles.links}>
          <a href={forgotPasswordHref} className={styles.link}>
            {t('loginForm.forgotPassword')}
          </a>
          <p className={styles.signupText}>
            <span>{t('loginForm.noAccount')} </span>
            <a href={signupHref} className={styles.link}>
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
  id: 'auth-LoginForm',
  name: 'Login Form',
};

export default authLoginFormFeature;
