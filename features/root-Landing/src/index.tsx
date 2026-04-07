'use client';

import React, { useState } from 'react';
import type { FeatureModule, IntroductionSectionPlugin } from '@xgen/types';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 relative overflow-x-hidden before:content-[''] before:fixed before:inset-0 before:bg-[radial-gradient(ellipse_at_15%_25%,rgba(37,99,235,0.04)_0%,transparent_50%),radial-gradient(ellipse_at_85%_75%,rgba(124,58,237,0.03)_0%,transparent_50%),radial-gradient(ellipse_at_50%_0%,rgba(148,163,184,0.06)_0%,transparent_40%)] before:pointer-events-none before:z-0">
      {HeaderComp && <HeaderComp user={user} onLogout={handleLogout} />}
      <main className="relative flex flex-col items-center w-full max-w-[100vw] z-[1]">
        {HeroComp     && <HeroComp />}
        {FeaturesComp && <FeaturesComp />}
        {CtaComp      && <CtaComp />}
      </main>
      {FooterComp && <FooterComp />}
    </div>
  );
};

export const rootLandingFeature: FeatureModule = {
  id: 'root-landing',
  name: 'Landing Page',
};

export default rootLandingFeature;
