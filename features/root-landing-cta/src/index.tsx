'use client';

import Link from 'next/link';
import { useTranslation } from '@xgen/i18n';
import './locales';
import { FiPlay, FiTrendingUp } from '@xgen/icons';
import type { IntroductionSectionPlugin } from '@xgen/types';
import styles from './styles/cta.module.scss';

function LandingCta() {
  const { t } = useTranslation();

  return (
    <section className={styles.ctaSection}>
      <div className={styles.ctaContent}>
        <div className={styles.ctaLabel}>
          <span>{t('cta.label')}</span>
        </div>
        <h2>{t('cta.title')}</h2>
        <p>{t('cta.description')}</p>
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
        <div className={styles.ctaNote}>
          <span>{t('cta.note')}</span>
        </div>
      </div>
    </section>
  );
}

export const rootLandingCtaPlugin: IntroductionSectionPlugin = {
  id: 'root-landing-cta',
  name: 'Landing CTA',
  ctaComponent: LandingCta,
};

export default rootLandingCtaPlugin;
