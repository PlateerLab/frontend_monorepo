'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '@xgen/i18n';
import './locales';
import { FiPlay, FiLayers, FiCpu, FiZap } from '@xgen/icons';
import type { IntroductionSectionPlugin } from '@xgen/types';
import styles from './styles/hero.module.scss';

function IntroHero() {
  const { t } = useTranslation();

  return (
    <div className={styles.heroSection}>
      <div className={styles.heroContent}>
        <div className={styles.heroLabel}>
          <span>{t('hero.label')}</span>
        </div>

        <h1 className={styles.heroTitle}>
          {t('hero.title')} <br />
          <i className="not-italic">{t('hero.titleHighlight')}</i>
          <span className={styles.highlight}>
            {t('hero.titleWith')}
          </span>
        </h1>

        <p className={styles.heroDescription}>
          <Image
            src="/simbol.png"
            alt="XGEN"
            height={15}
            width={15}
          />{' '}
          <b>{t('header.title')}</b> {t('hero.description')}
        </p>

        <div className={styles.heroStats}>
          <div className={styles.statItem}>
            <strong>{t('hero.stat1Value')}</strong>
            <span>{t('hero.stat1Label')}</span>
          </div>
          <div className={styles.statItem}>
            <strong>{t('hero.stat2Value')}</strong>
            <span>{t('hero.stat2Label')}</span>
          </div>
          <div className={styles.statItem}>
            <strong>{t('hero.stat3Value')}</strong>
            <span>{t('hero.stat3Label')}</span>
          </div>
        </div>

        <div className={styles.heroActions}>
          <Link href="/main" className={styles.primaryBtn}>
            <FiPlay />
            {t('hero.cta')}
          </Link>
        </div>
      </div>

      <div className={styles.heroVisual}>
        <div className={styles.heroImage}>
          <div className={styles.mockupScreen}>
            <div className={styles.mockupHeader}>
              <div className={styles.mockupDots}>
                <span />
                <span />
                <span />
              </div>
              <span>{t('mockup.title')}</span>
            </div>
            <div className={styles.mockupContent}>
              <div className={styles.mockupNodes}>
                <div className={`${styles.mockupNode} ${styles.input}`}>
                  <FiLayers />
                  <span>{t('mockup.input')}</span>
                </div>
                <div className={styles.mockupFlow} />
                <div className={`${styles.mockupNode} ${styles.ai}`}>
                  <FiCpu />
                  <span>{t('mockup.aiProcess')}</span>
                </div>
                <div className={styles.mockupFlow} />
                <div className={`${styles.mockupNode} ${styles.output}`}>
                  <FiZap />
                  <span>{t('mockup.output')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const authIntroHeroPlugin: IntroductionSectionPlugin = {
  id: 'auth-intro-hero',
  name: 'Introduction Hero',
  heroComponent: IntroHero,
};

export default authIntroHeroPlugin;
