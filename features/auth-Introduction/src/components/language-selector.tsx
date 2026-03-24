'use client';

import { useTranslation } from '@xgen/i18n';
import styles from '../styles/language-selector.module.scss';

export function LanguageSelector() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className={styles.languageSelector}>
      <button
        className={locale === 'ko' ? styles.active : styles.inactive}
        onClick={() => setLocale('ko')}
        aria-label="한국어로 변경"
      >
        KOR
      </button>
      <button
        className={locale === 'en' ? styles.active : styles.inactive}
        onClick={() => setLocale('en')}
        aria-label="Change to English"
      >
        ENG
      </button>
    </div>
  );
}
