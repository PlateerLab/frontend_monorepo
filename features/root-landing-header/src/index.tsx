'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@xgen/i18n';
import './locales';
import { FiArrowRight, FiLogOut } from '@xgen/icons';
import { Button, LanguageToggle } from '@xgen/ui';
import type { IntroductionSectionPlugin, IntroductionHeaderProps } from '@xgen/types';

const LANGUAGE_OPTIONS = [
  { value: 'ko', label: 'KOR', ariaLabel: '한국어로 변경' },
  { value: 'en', label: 'ENG', ariaLabel: 'Change to English' },
];

export function LandingHeader({ user, onLogout }: IntroductionHeaderProps) {
  const router = useRouter();
  const { t, locale, setLocale } = useTranslation();

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] bg-white/85 backdrop-blur-[20px] border-b border-slate-400/10 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-300">
      <nav className="max-w-[1400px] mx-auto px-8 sm:px-12 lg:px-16 xl:px-20">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center shrink-0 cursor-pointer transition-opacity duration-200 hover:opacity-80">
            <Image src="/simbol.png" alt="XGEN" height={24} width={24} />
            <h1 className="text-2xl font-bold ml-[3px] bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight translate-y-px -translate-x-[3.1px]">{t('header.title').replace(/ /g, '\u00A0')}</h1>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center py-2 px-4 rounded-lg text-gray-700 text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-black/[0.04] hover:-translate-y-px"
                  onClick={() => router.push('/mypage')}
                  title={t('common.mypage')}
                >
                  {t('common.welcome').replace('{username}', user.username)}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onLogout}
                  title={t('common.logout')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <FiLogOut />
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="md" asChild className="[&_svg]:w-4 [&_svg]:h-4">
                <Link href="/login?redirect=%2F">
                  {t('common.login')}
                  <FiArrowRight />
                </Link>
              </Button>
            )}
            <Button variant="gradient" size="md" asChild className="font-semibold [&_svg]:ml-1 [&_svg]:w-4 [&_svg]:h-4 [&_svg]:transition-transform [&_svg]:duration-200 hover:[&_svg]:translate-x-0.5">
              <Link href="/main">
                {t('common.getStarted')}
                <FiArrowRight />
              </Link>
            </Button>
            <LanguageToggle options={LANGUAGE_OPTIONS} value={locale} onChange={setLocale} />
          </div>
        </div>
      </nav>
    </header>
  );
}

export const rootLandingHeaderPlugin: IntroductionSectionPlugin = {
  id: 'root-landing-header',
  name: 'Landing Header',
  headerComponent: LandingHeader,
};

export default rootLandingHeaderPlugin;
