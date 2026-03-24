'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@xgen/i18n';
import { FiArrowRight, FiLogOut } from '@xgen/icons';
import { LanguageSelector } from './language-selector';
import styles from '../styles/introduction.module.scss';

interface HeaderProps {
  user: { username: string } | null;
  onLogout: () => void;
}

export function Header({ user, onLogout }: HeaderProps) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          {/* Logo */}
          <div className={styles.logo}>
            <Image src="/simbol.png" alt="XGEN" height={26} width={26} />
            <h1>{t('header.title').replace(/ /g, '\u00A0')}</h1>
          </div>

          {/* Actions */}
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
