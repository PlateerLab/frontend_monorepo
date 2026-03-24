'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '@xgen/i18n';
import { FiPlay, FiLayers, FiCpu, FiZap } from '@xgen/icons';
import styles from '../styles/introduction.module.scss';

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <div className={styles.heroSection}>
      {/* Content */}
      <div className={styles.heroContent}>
        {/* Label */}
        <div className={styles.heroLabel}>
          <span>{t('hero.label')}</span>
        </div>

        {/* Title */}
        <h1 className={styles.heroTitle}>
          {t('hero.title')} <br />
          <i className="not-italic">{t('hero.titleHighlight')}</i>
          <span className={styles.highlight}>
            {t('hero.titleWith')}
          </span>
        </h1>

        {/* Description */}
        <p className={styles.heroDescription}>
          <Image
            src="/simbol.png"
            alt="XGEN"
            height={15}
            width={15}
          />{' '}
          <b>{t('header.title')}</b> {t('hero.description')}
        </p>

        {/* Stats */}
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

        {/* CTA */}
        <div className={styles.heroActions}>
          <Link href="/main" className={styles.primaryBtn}>
            <FiPlay />
            {t('hero.cta')}
          </Link>
        </div>
      </div>

      {/* Visual - Hidden on mobile */}
      <div className={styles.heroVisual}>
        <div className={styles.heroImage}>
          {/* Mockup Screen */}
          <div className={styles.mockupScreen}>
            {/* Header */}
            <div className={styles.mockupHeader}>
              <div className={styles.mockupDots}>
                <span />
                <span />
                <span />
              </div>
              <span>{t('mockup.title')}</span>
            </div>
            {/* Content */}
            <div className={styles.mockupContent}>
              <div className={styles.mockupNodes}>
                {/* Input Node */}
                <div className={`${styles.mockupNode} ${styles.input}`}>
                  <FiLayers />
                  <span>{t('mockup.input')}</span>
                </div>
                {/* Flow */}
                <div className={styles.mockupFlow} />
                {/* AI Node */}
                <div className={`${styles.mockupNode} ${styles.ai}`}>
                  <FiCpu />
                  <span>{t('mockup.aiProcess')}</span>
                </div>
                {/* Flow */}
                <div className={styles.mockupFlow} />
                {/* Output Node */}
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
