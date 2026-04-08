'use client';

import './locales';

import React, { useState, useCallback, useMemo } from 'react';
import type { FeatureModule } from '@xgen/types';
import { signup, signupGuest, type SignupData } from '@xgen/api-client';
import { useTranslation } from '@xgen/i18n';
import { FiEye, FiEyeOff, FiCheck, FiX } from '@xgen/icons';

// ─────────────────────────────────────────────────────────────
// Signup Form Props
// ─────────────────────────────────────────────────────────────

export interface SignupFormProps {
  /** 회원가입 성공 시 리다이렉트 URL (기본: /login) */
  loginHref?: string;
  /** 회원가입 성공 시 콜백 */
  onSuccess?: () => void;
}

// ─────────────────────────────────────────────────────────────
// Validation Utilities
// ─────────────────────────────────────────────────────────────

type SignupMode = 'general' | 'guest';

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string): boolean {
  if (!phone) return true; // optional
  const digits = phone.replace(/[^\d]/g, '');
  return /^(010|011|016|017|018|019)\d{7,8}$/.test(digits);
}

interface PasswordStrength {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  categoriesCount: number;
  isValid: boolean;
}

function checkPasswordStrength(password: string): PasswordStrength {
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const minLength = password.length >= 8;
  const categoriesCount = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  return {
    minLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
    categoriesCount,
    isValid: minLength && categoriesCount >= 2,
  };
}

function generateGuestUsername(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let hash = '';
  for (let i = 0; i < 8; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `GUEST_${hash}`;
}

// ─────────────────────────────────────────────────────────────
// Error Message Mapping
// ─────────────────────────────────────────────────────────────

function getSignupErrorKey(error: string): string {
  const lower = error.toLowerCase();
  if (lower.includes('email') && (lower.includes('exist') || lower.includes('already') || lower.includes('registered'))) {
    return 'signupForm.errors.emailAlreadyExists';
  }
  if (lower.includes('username') && (lower.includes('exist') || lower.includes('already') || lower.includes('taken'))) {
    return 'signupForm.errors.usernameAlreadyExists';
  }
  return 'signupForm.errors.signupFailed';
}

// ─────────────────────────────────────────────────────────────
// Signup Form Component
// ─────────────────────────────────────────────────────────────

export const SignupForm: React.FC<SignupFormProps> = ({
  loginHref = '/login',
  onSuccess,
}) => {
  const [mode, setMode] = useState<SignupMode>('general');

  // General fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [showPasswordHints, setShowPasswordHints] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { t } = useTranslation();

  // ── Validation Memos ──
  const passwordStrength = useMemo(() => checkPasswordStrength(password), [password]);
  const emailValid = useMemo(() => email ? validateEmail(email) : null, [email]);
  const phoneValid = useMemo(() => phone ? validatePhone(phone) : null, [phone]);
  const passwordsMatch = useMemo(
    () => passwordConfirm ? password === passwordConfirm : null,
    [password, passwordConfirm],
  );

  // ── Reset form on mode change ──
  const handleModeChange = useCallback((newMode: SignupMode) => {
    setMode(newMode);
    setError(null);
    setSuccess(null);
  }, []);

  // ── Submit: General Signup ──
  const handleGeneralSubmit = useCallback(async () => {
    if (!username || !email || !password || !passwordConfirm) {
      setError(t('signupForm.errors.allFieldsRequired'));
      return;
    }
    if (!validateEmail(email)) {
      setError(t('signupForm.errors.invalidEmail'));
      return;
    }
    if (!passwordStrength.isValid) {
      if (!passwordStrength.minLength) {
        setError(t('signupForm.errors.passwordTooShort'));
      } else {
        setError(t('signupForm.errors.passwordTooWeak'));
      }
      return;
    }
    if (password !== passwordConfirm) {
      setError(t('signupForm.errors.passwordMismatch'));
      return;
    }
    if (phone && !validatePhone(phone)) {
      setError(t('signupForm.errors.invalidPhone'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data: SignupData = {
        username,
        email,
        password,
        full_name: fullName || undefined,
        mobile_phone_number: phone || undefined,
      };

      await signup(data);
      setSuccess(t('signupForm.signupSuccess'));

      // 2초 후 로그인 페이지로
      setTimeout(() => {
        onSuccess?.();
        if (typeof window !== 'undefined') {
          window.location.href = loginHref;
        }
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'signupFailed';
      setError(t(getSignupErrorKey(message)));
    } finally {
      setIsLoading(false);
    }
  }, [username, email, password, passwordConfirm, fullName, phone, passwordStrength, loginHref, onSuccess, t]);

  // ── Submit: Guest Signup ──
  const handleGuestSubmit = useCallback(async () => {
    if (!email || !password || !fullName || !phone) {
      setError(t('signupForm.errors.allFieldsRequired'));
      return;
    }
    if (!validateEmail(email)) {
      setError(t('signupForm.errors.invalidEmail'));
      return;
    }
    if (!passwordStrength.isValid) {
      if (!passwordStrength.minLength) {
        setError(t('signupForm.errors.passwordTooShort'));
      } else {
        setError(t('signupForm.errors.passwordTooWeak'));
      }
      return;
    }
    if (!validatePhone(phone)) {
      setError(t('signupForm.errors.invalidPhone'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data: SignupData = {
        username: generateGuestUsername(),
        email,
        password,
        full_name: fullName,
        mobile_phone_number: phone,
      };

      await signupGuest(data);
      setSuccess(t('signupForm.guestSignupSuccess'));

      setTimeout(() => {
        onSuccess?.();
        if (typeof window !== 'undefined') {
          window.location.href = loginHref;
        }
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'signupFailed';
      setError(t(getSignupErrorKey(message)));
    } finally {
      setIsLoading(false);
    }
  }, [email, password, fullName, phone, passwordStrength, loginHref, onSuccess, t]);

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (mode === 'general') {
      handleGeneralSubmit();
    } else {
      handleGuestSubmit();
    }
  }, [mode, handleGeneralSubmit, handleGuestSubmit]);

  // ── Validation indicator ──
  const ValidationIcon: React.FC<{ valid: boolean | null }> = ({ valid }) => {
    if (valid === null) return null;
    return valid
      ? <FiCheck size={16} className="text-emerald-500" />
      : <FiX size={16} className="text-red-400" />;
  };

  // ── Shared input style ──
  const inputClass = 'w-full py-3.5 px-4 text-[15px] border border-gray-200 rounded-lg outline-none transition-all duration-200 bg-gray-50 box-border focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] focus:bg-white placeholder:text-gray-400';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-5">
      <div className="w-full max-w-[480px] bg-white rounded-2xl py-10 px-10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#1a1a2e] m-0 mb-2 tracking-tight">{t('signupForm.title')}</h1>
          <p className="text-sm text-gray-500 m-0">{t('signupForm.subtitle')}</p>
        </div>

        {/* Mode Tabs */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-4">
          <button
            type="button"
            onClick={() => handleModeChange('general')}
            className={`flex-1 py-2.5 text-sm font-medium border-none cursor-pointer transition-all duration-200 ${
              mode === 'general'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('signupForm.tabGeneral')}
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('guest')}
            className={`flex-1 py-2.5 text-sm font-medium border-none border-l border-l-gray-200 cursor-pointer transition-all duration-200 ${
              mode === 'guest'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('signupForm.tabGuest')}
          </button>
        </div>

        {/* Mode Notice */}
        <div className="mb-5 py-2.5 px-4 bg-blue-50 border-l-3 border-l-blue-400 rounded-r-lg text-xs text-blue-700 leading-relaxed">
          {mode === 'general' ? t('signupForm.generalNotice') : t('signupForm.guestNotice')}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Username — general only */}
          {mode === 'general' && (
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('signupForm.usernamePlaceholder')}
              autoComplete="username"
              required
              className={inputClass}
            />
          )}

          {/* Full Name — guest required, general optional */}
          {mode === 'guest' ? (
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('signupForm.guestFullNamePlaceholder')}
              autoComplete="name"
              required
              className={inputClass}
            />
          ) : (
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('signupForm.fullNamePlaceholder')}
              autoComplete="name"
              className={inputClass}
            />
          )}

          {/* Email */}
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('signupForm.emailPlaceholder')}
              autoComplete="email"
              required
              className={`${inputClass} pr-10`}
            />
            {email && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                <ValidationIcon valid={emailValid} />
              </span>
            )}
          </div>

          {/* Password */}
          <div className="relative">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setShowPasswordHints(true)}
                onBlur={() => setTimeout(() => setShowPasswordHints(false), 200)}
                placeholder={t('signupForm.passwordPlaceholder')}
                autoComplete="new-password"
                required
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-1 flex items-center justify-center text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? t('signupForm.hidePassword') : t('signupForm.showPassword')}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>

            {/* Password Strength Hints */}
            {showPasswordHints && password && (
              <div className="absolute top-full left-0 right-0 mt-1 p-3 bg-white rounded-lg border border-gray-200 shadow-lg z-10 text-xs">
                <p className="font-medium text-gray-700 mb-1.5 text-[11px]">{t('signupForm.passwordRequirements')}</p>
                <div className="flex flex-col gap-1">
                  <div className={`flex items-center gap-1.5 ${passwordStrength.minLength ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {passwordStrength.minLength ? <FiCheck size={12} /> : <FiX size={12} />}
                    <span>{t('signupForm.passwordMinLength')}</span>
                  </div>
                  <p className="text-gray-500 mt-1 mb-0.5 text-[11px]">{t('signupForm.passwordCategories')}</p>
                  <div className={`flex items-center gap-1.5 ml-2 ${passwordStrength.hasUpper ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {passwordStrength.hasUpper ? <FiCheck size={12} /> : <FiX size={12} />}
                    <span>{t('signupForm.passwordUppercase')}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ml-2 ${passwordStrength.hasLower ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {passwordStrength.hasLower ? <FiCheck size={12} /> : <FiX size={12} />}
                    <span>{t('signupForm.passwordLowercase')}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ml-2 ${passwordStrength.hasNumber ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {passwordStrength.hasNumber ? <FiCheck size={12} /> : <FiX size={12} />}
                    <span>{t('signupForm.passwordNumber')}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ml-2 ${passwordStrength.hasSpecial ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {passwordStrength.hasSpecial ? <FiCheck size={12} /> : <FiX size={12} />}
                    <span>{t('signupForm.passwordSpecial')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Password Confirm — general only */}
          {mode === 'general' && (
            <div className="relative">
              <input
                type={showPasswordConfirm ? 'text' : 'password'}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder={t('signupForm.passwordConfirmPlaceholder')}
                autoComplete="new-password"
                required
                className={`${inputClass} pr-12`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {passwordConfirm && <ValidationIcon valid={passwordsMatch} />}
                <button
                  type="button"
                  className="bg-transparent border-none cursor-pointer p-1 flex items-center justify-center text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  tabIndex={-1}
                >
                  {showPasswordConfirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Phone — guest required, general optional */}
          <div className="relative">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={mode === 'guest' ? t('signupForm.guestPhonePlaceholder') : t('signupForm.phonePlaceholder')}
              autoComplete="tel"
              required={mode === 'guest'}
              className={`${inputClass} pr-10`}
            />
            {phone && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                <ValidationIcon valid={phoneValid} />
              </span>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 py-3 px-4 bg-red-50 rounded-lg border border-red-200" role="alert">
              <span className="text-lg shrink-0">⚠️</span>
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 py-3 px-4 bg-emerald-50 rounded-lg border border-emerald-200" role="status">
              <span className="text-lg shrink-0">✅</span>
              <span className="text-sm text-emerald-700">{success}</span>
            </div>
          )}

          {/* Submit */}
          <div className="mt-1">
            <button
              type="submit"
              disabled={isLoading || !!success}
              className="w-full py-3.5 px-6 text-base font-semibold text-white bg-gradient-to-br from-blue-500 to-blue-600 border-none rounded-lg cursor-pointer transition-all duration-200 hover:not-disabled:from-blue-600 hover:not-disabled:to-blue-700 hover:not-disabled:-translate-y-px hover:not-disabled:shadow-[0_4px_12px_rgba(37,99,235,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? t('signupForm.signupLoading') : t('signupForm.signupButton')}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            <span>{t('signupForm.alreadyHaveAccount')} </span>
            <a href={loginHref} className="text-blue-500 no-underline font-medium hover:underline">
              {t('signupForm.login')}
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

export const authSignupFormFeature: FeatureModule = {
  id: 'auth-signup-form',
  name: 'Signup Form',
};

export default authSignupFormFeature;
