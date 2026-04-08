'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@xgen/auth-provider';
import { getCookie, validateToken } from '@xgen/api-client';
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
  const { user, isInitialized } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;

    // 로그인된 사용자라면 메인 페이지로 리다이렉트
    if (user) {
      const token = getCookie('access_token');
      if (token) {
        validateToken(token)
          .then((result) => {
            if (result.valid) {
              window.location.href = '/main?section=main-dashboard';
            } else {
              setChecked(true);
            }
          })
          .catch(() => {
            setChecked(true);
          });
        return;
      }
    }

    setChecked(true);
  }, [isInitialized, user]);

  // 인증 확인 전에는 빈 화면 (깜빡임 방지)
  if (!isInitialized || !checked) {
    return null;
  }

  return <LandingPage plugins={plugins} />;
}
