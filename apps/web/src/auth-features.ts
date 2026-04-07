/**
 * Feature Registry — Root Landing
 *
 * 설계 원칙:
 * - 이 파일은 Feature를 import하고 등록만 한다
 * - 비즈니스 로직을 넣지 않는다
 * - import 한 줄 주석처리로 기능 ON/OFF 가능
 */
import { FeatureRegistry } from '@xgen/types';

// Feature Modules
import rootLanding from '@xgen/feature-root-landing';

// Landing Section Plugins
import rootLandingHeaderPlugin from '@xgen/feature-root-landing-header';
import rootLandingHeroPlugin from '@xgen/feature-root-landing-hero';
import rootLandingFeaturesPlugin from '@xgen/feature-root-landing-features';
import rootLandingCtaPlugin from '@xgen/feature-root-landing-cta';
import rootLandingFooterPlugin from '@xgen/feature-root-landing-footer';

// Register Feature Modules
const features = [
  rootLanding,
];

features.forEach((f) => FeatureRegistry.register(f));

// Register Landing Section Plugins (순서 = 렌더링 순서)
FeatureRegistry.registerIntroductionPlugin(rootLandingHeaderPlugin);
FeatureRegistry.registerIntroductionPlugin(rootLandingHeroPlugin);
FeatureRegistry.registerIntroductionPlugin(rootLandingFeaturesPlugin);
FeatureRegistry.registerIntroductionPlugin(rootLandingCtaPlugin);
FeatureRegistry.registerIntroductionPlugin(rootLandingFooterPlugin);

export { FeatureRegistry };
