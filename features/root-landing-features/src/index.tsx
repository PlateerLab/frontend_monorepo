'use client';

import type { ReactNode } from 'react';
import { useTranslation } from '@xgen/i18n';
import './locales';
import {
  FiGrid,
  FiMessageCircle,
  FiTrendingUp,
  FiCpu,
  FiShield,
  FiGlobe,
} from '@xgen/icons';
import type { IntroductionSectionPlugin } from '@xgen/types';
import styles from './styles/features.module.scss';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  features: string[];
  colorClass: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'indigo';
}

function FeatureCard({ icon, title, description, features, colorClass }: FeatureCardProps) {
  return (
    <div className={styles.featureCard}>
      <div className={`${styles.cardBackground} ${styles[colorClass]}`} />
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <span className={styles[colorClass]}>{icon}</span>
          <h3>{title}</h3>
        </div>
        <p className={styles.cardDescription}>{description}</p>
        <div className={styles.cardFeatures}>
          {features.map((feature, index) => (
            <span key={index}>{feature}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function LandingFeatures() {
  const { t } = useTranslation();

  const featureData = [
    { icon: <FiGrid />,          titleKey: 'features.visualCanvas',    colorClass: 'blue'   as const },
    { icon: <FiMessageCircle />, titleKey: 'features.realtimeChat',    colorClass: 'purple' as const },
    { icon: <FiTrendingUp />,    titleKey: 'features.smartManagement', colorClass: 'green'  as const },
    { icon: <FiCpu />,           titleKey: 'features.highPerformance', colorClass: 'orange' as const },
    { icon: <FiShield />,        titleKey: 'features.security',        colorClass: 'pink'   as const },
    { icon: <FiGlobe />,         titleKey: 'features.openEcosystem',   colorClass: 'indigo' as const },
  ];

  return (
    <section id="features" className={styles.featuresSection}>
      <div className={styles.featuresHeader}>
        <h2>{t('features.title')}</h2>
        <p>{t('features.subtitle')}</p>
      </div>
      <div className={styles.featuresGrid}>
        {featureData.map((feature) => (
          <FeatureCard
            key={feature.titleKey}
            icon={feature.icon}
            title={t(`${feature.titleKey}.title`)}
            description={t(`${feature.titleKey}.description`)}
            features={[
              t(`${feature.titleKey}.feature1`),
              t(`${feature.titleKey}.feature2`),
              t(`${feature.titleKey}.feature3`),
            ]}
            colorClass={feature.colorClass}
          />
        ))}
      </div>
    </section>
  );
}

export const rootLandingFeaturesPlugin: IntroductionSectionPlugin = {
  id: 'root-landing-features',
  name: 'Landing Features',
  featuresComponent: LandingFeatures,
};

export default rootLandingFeaturesPlugin;
