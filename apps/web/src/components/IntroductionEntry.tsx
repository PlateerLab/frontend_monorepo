'use client';

import { IntroductionPage } from '@xgen/feature-auth-Introduction';
import authIntroHeaderPlugin from '@xgen/feature-auth-intro-header';
import authIntroHeroPlugin from '@xgen/feature-auth-intro-hero';
import authIntroFeaturesPlugin from '@xgen/feature-auth-intro-features';
import authIntroCtaPlugin from '@xgen/feature-auth-intro-cta';
import authIntroFooterPlugin from '@xgen/feature-auth-intro-footer';

const plugins = [
  authIntroHeaderPlugin,
  authIntroHeroPlugin,
  authIntroFeaturesPlugin,
  authIntroCtaPlugin,
  authIntroFooterPlugin,
];

export default function IntroductionEntry() {
  return <IntroductionPage plugins={plugins} />;
}
