'use client';

import Link from 'next/link';
import { useTranslation } from '@xgen/i18n';
import { FiPlay, FiTrendingUp } from '@xgen/icons';
import styles from '../styles/introduction.module.scss';

export function CtaSection() {
  const { t } = useTranslation();

  return (
    <section className={styles.ctaSection}>
      {/* Content */}
      <div className={styles.ctaContent}>
        {/* Label */}
        <div className={styles.ctaLabel}>
          <span>{t('cta.label')}</span>
        </div>
        {/* Title */}
        <h2>{t('cta.title')}</h2>
        {/* Description */}
        <p>{t('cta.description')}</p>
        {/* Actions */}
        <div className={styles.ctaActions}>
          <Link href="/canvas" className={styles.ctaBtn}>
            <FiPlay />
            {t('cta.startFree')}
          </Link>
          <Link href="/main" className={styles.ctaSecondaryBtn}>
            <FiTrendingUp />
            {t('cta.exploreManagement')}
          </Link>
        </div>
        {/* Note */}
        <div className={styles.ctaNote}>
          <span>{t('cta.note')}</span>
        </div>
      </div>
    </section>
  );
}
