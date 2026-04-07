'use client';

import { LandingPage } from '@xgen/feature-root-landing';
import rootLandingHeaderPlugin from '@xgen/feature-root-landing-header';
import rootLandingHeroPlugin from '@xgen/feature-root-landing-hero';
import rootLandingFeaturesPlugin from '@xgen/feature-root-landing-features';
import rootLandingCtaPlugin from '@xgen/feature-root-landing-cta';
import rootLandingFooterPlugin from '@xgen/feature-root-landing-footer';

const plugins = [
  rootLandingHeaderPlugin,
  rootLandingHeroPlugin,
  rootLandingFeaturesPlugin,
  rootLandingCtaPlugin,
  rootLandingFooterPlugin,
];

export default function IntroductionEntry() {
  return <LandingPage plugins={plugins} />;
}
