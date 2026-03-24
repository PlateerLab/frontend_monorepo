'use client';

import React, { useState } from 'react';
import type { FeatureModule, IntroductionSectionPlugin } from '@xgen/types';
import styles from './styles/introduction.module.scss';

export interface IntroductionPageProps {
  plugins: IntroductionSectionPlugin[];
}

export const IntroductionPage: React.FC<IntroductionPageProps> = ({ plugins }) => {
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

/**
 * auth-Introduction Feature Module
 *
 * 설계 원칙에 따라:
 * - id는 디렉토리명과 동일 (auth-Introduction)
 * - default export는 FeatureModule 객체
 * - 페이지 컴포넌트는 named export
 */
export const authIntroductionFeature: FeatureModule = {
  id: 'auth-Introduction',
  name: 'Introduction Page',
};

export default authIntroductionFeature;
