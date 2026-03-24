'use client';

import { useTranslation } from '@xgen/i18n';
import {
  FiGrid,
  FiMessageCircle,
  FiTrendingUp,
  FiCpu,
  FiShield,
  FiGlobe,
} from '@xgen/icons';
import { FeatureCard } from './feature-card';
import styles from '../styles/introduction.module.scss';

export function FeaturesSection() {
  const { t } = useTranslation();

  const featureData = [
    {
      icon: <FiGrid />,
      titleKey: 'features.visualCanvas',
      colorClass: 'blue' as const,
    },
    {
      icon: <FiMessageCircle />,
      titleKey: 'features.realtimeChat',
      colorClass: 'purple' as const,
    },
    {
      icon: <FiTrendingUp />,
      titleKey: 'features.smartManagement',
      colorClass: 'green' as const,
    },
    {
      icon: <FiCpu />,
      titleKey: 'features.highPerformance',
      colorClass: 'orange' as const,
    },
    {
      icon: <FiShield />,
      titleKey: 'features.security',
      colorClass: 'pink' as const,
    },
    {
      icon: <FiGlobe />,
      titleKey: 'features.openEcosystem',
      colorClass: 'indigo' as const,
    },
  ];

  return (
    <section id="features" className={styles.featuresSection}>
      {/* Header */}
      <div className={styles.featuresHeader}>
        <h2>{t('features.title')}</h2>
        <p>{t('features.subtitle')}</p>
      </div>

      {/* Grid */}
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
