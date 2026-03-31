'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@xgen/i18n';
import './locales';
import { FiArrowRight, FiLogOut } from '@xgen/icons';
import type { IntroductionSectionPlugin, IntroductionHeaderProps } from '@xgen/types';
import styles from './styles/header.module.scss';

function LanguageSelector() {
  const { locale, setLocale } = useTranslation();
  return (
    <div className={styles.languageSelector}>
      <button
        className={locale === 'ko' ? styles.langActive : styles.langInactive}
        onClick={() => setLocale('ko')}
        aria-label="한국어로 변경"
      >
        KOR
      </button>
      <button
        className={locale === 'en' ? styles.langActive : styles.langInactive}
        onClick={() => setLocale('en')}
        aria-label="Change to English"
      >
        ENG
      </button>
    </div>
  );
}

export function LandingHeader({ user, onLogout }: IntroductionHeaderProps) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          <div className={styles.logo}>
            <Image src="/simbol.png" alt="XGEN" height={24} width={24} />
            <h1>{t('header.title').replace(/ /g, '\u00A0')}</h1>
          </div>

          <div className={styles.navActions}>
            {user ? (
              <div className={styles.userSection}>
                <span
                  className={styles.welcomeMessage}
                  onClick={() => router.push('/mypage')}
                  title={t('common.mypage')}
                >
                  {t('common.welcome').replace('{username}', user.username)}
                </span>
                <button
                  onClick={onLogout}
                  className={styles.logoutBtn}
                  title={t('common.logout')}
                >
                  <FiLogOut />
                </button>
              </div>
            ) : (
              <Link href="/login?redirect=%2F" className={styles.loginBtn}>
                {t('common.login')}
                <FiArrowRight />
              </Link>
            )}
            <Link href="/main" className={styles.getStartedBtn}>
              {t('common.getStarted')}
              <FiArrowRight />
            </Link>
            <LanguageSelector />
          </div>
        </div>
      </nav>
    </header>
  );
}

export const rootLandingHeaderPlugin: IntroductionSectionPlugin = {
  id: 'root-landing-header',
  name: 'Landing Header',
  headerComponent: LandingHeader,
};

export default rootLandingHeaderPlugin;
