/**
 * Feature Registry
 *
 * 설계 원칙:
 * - 이 파일은 Feature를 import하고 등록만 한다
 * - 비즈니스 로직을 넣지 않는다
 * - import 한 줄 주석처리로 기능 ON/OFF 가능
 */
import { FeatureRegistry } from '@xgen/types';

// Feature Modules
import authIntroduction from '@xgen/feature-auth-Introduction';

// Introduction Section Plugins
import authIntroHeaderPlugin from '@xgen/feature-auth-intro-header';
import authIntroHeroPlugin from '@xgen/feature-auth-intro-hero';
import authIntroFeaturesPlugin from '@xgen/feature-auth-intro-features';
import authIntroCtaPlugin from '@xgen/feature-auth-intro-cta';
import authIntroFooterPlugin from '@xgen/feature-auth-intro-footer';

// Register Feature Modules
const features = [
  authIntroduction,
];

features.forEach((f) => FeatureRegistry.register(f));

// Register Introduction Section Plugins (순서 = 렌더링 순서)
FeatureRegistry.registerIntroductionPlugin(authIntroHeaderPlugin);
FeatureRegistry.registerIntroductionPlugin(authIntroHeroPlugin);
FeatureRegistry.registerIntroductionPlugin(authIntroFeaturesPlugin);
FeatureRegistry.registerIntroductionPlugin(authIntroCtaPlugin);
FeatureRegistry.registerIntroductionPlugin(authIntroFooterPlugin);

export { FeatureRegistry };
