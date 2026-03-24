'use client';

import type { ReactNode } from 'react';
import styles from '../styles/introduction.module.scss';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  features: string[];
  colorClass: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'indigo';
}

export function FeatureCard({ icon, title, description, features, colorClass }: FeatureCardProps) {
  return (
    <div className={styles.featureCard}>
      {/* Background gradient */}
      <div className={`${styles.cardBackground} ${styles[colorClass]}`} />
      {/* Card Content */}
      <div className={styles.cardContent}>
        {/* Header */}
        <div className={styles.cardHeader}>
          <span className={styles[colorClass]}>{icon}</span>
          <h3>{title}</h3>
        </div>
        {/* Description */}
        <p className={styles.cardDescription}>{description}</p>
        {/* Features */}
        <div className={styles.cardFeatures}>
          {features.map((feature, index) => (
            <span key={index}>{feature}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
