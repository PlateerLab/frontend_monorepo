'use client';

import React, { useState } from 'react';
import type { FeatureModule, IntroductionSectionPlugin } from '@xgen/types';
import styles from './styles/landing.module.scss';

export interface LandingPageProps {
  plugins: IntroductionSectionPlugin[];
}

export const LandingPage: React.FC<LandingPageProps> = ({ plugins }) => {
  const [user, setUser] = useState<{ username: string } | null>(null);

  const handleLogout = async () => {
    setUser(null);
  };

  const HeaderComp   = plugins.find((p) => p.headerComponent)?.headerComponent;
  const HeroComp     = plugins.find((p) => p.heroComponent)?.heroComponent;
  const FeaturesComp = plugins.find((p) => p.featuresComponent)?.featuresComponent;
  const CtaComp      = plugins.find((p) => p.ctaComponent)?.ctaComponent;
  const FooterComp   = plugins.find((p) => p.footerComponent)?.footerComponent;

  return (
    <div className={styles.container}>
      {HeaderComp && <HeaderComp user={user} onLogout={handleLogout} />}
      <main className={styles.main}>
        {HeroComp     && <HeroComp />}
        {FeaturesComp && <FeaturesComp />}
        {CtaComp      && <CtaComp />}
      </main>
      {FooterComp && <FooterComp />}
    </div>
  );
};

export const rootLandingFeature: FeatureModule = {
  id: 'root-Landing',
  name: 'Landing Page',
};

export default rootLandingFeature;
