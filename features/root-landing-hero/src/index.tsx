'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '@xgen/i18n';
import './locales';
import { FiPlay, FiLayers, FiCpu, FiZap } from '@xgen/icons';
import { Button } from '@xgen/ui';
import type { IntroductionSectionPlugin } from '@xgen/types';

function LandingHero() {
  const { t } = useTranslation();

  return (
    <div className="w-[90vw] sm:w-[88vw] lg:w-[85vw] xl:w-[80vw] max-w-[1400px] mx-auto mt-24 lg:mt-28 mb-8 lg:mb-12 p-8 sm:p-12 lg:p-16 xl:py-20 xl:px-16 relative z-[1] bg-white/[0.92] backdrop-blur-[24px] rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] border border-white/60 lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center lg:text-left">
      <div className="max-lg:text-center">
        <div className="inline-block mb-6">
          <span className="bg-gradient-to-br from-blue-600/[0.08] to-purple-600/[0.06] border border-blue-600/[0.15] rounded-full py-2 px-5 text-blue-600 text-[0.8125rem] font-semibold tracking-wider uppercase">{t('hero.label')}</span>
        </div>

        <h1 className="text-[2.5rem] sm:text-[2.75rem] lg:text-[3.25rem] font-extrabold leading-[1.15] text-gray-900 mb-6 tracking-tight">
          {t('hero.title')} <br />
          <span className="block font-normal">{t('hero.titleHighlight')}</span>
          <span className="block bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent mt-1 font-bold">
            {t('hero.titleWith')}
          </span>
        </h1>

        <p className="text-[1.0625rem] leading-relaxed text-gray-600 mb-8 lg:mb-10 max-w-[560px] [&_img]:inline [&_img]:align-baseline [&_img]:mr-[-0.35rem] [&_img]:translate-y-[0.8px]">
          <Image src="/simbol.png" alt="XGEN" height={15} width={15} />{' '}
          <b>{t('header.title')}</b> {t('hero.description')}
        </p>

        <div className="flex gap-4 mb-10 justify-center lg:justify-start flex-wrap">
          <div className="text-center py-4 px-5 bg-white rounded-[14px] border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all duration-[250ms] min-w-[120px] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
            <strong className="block text-[1.375rem] font-extrabold text-gray-900 mb-1">{t('hero.stat1Value')}</strong>
            <span className="text-[0.8125rem] text-gray-500 font-medium">{t('hero.stat1Label')}</span>
          </div>
          <div className="text-center py-4 px-5 bg-white rounded-[14px] border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all duration-[250ms] min-w-[120px] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
            <strong className="block text-[1.375rem] font-extrabold text-gray-900 mb-1">{t('hero.stat2Value')}</strong>
            <span className="text-[0.8125rem] text-gray-500 font-medium">{t('hero.stat2Label')}</span>
          </div>
          <div className="text-center py-4 px-5 bg-white rounded-[14px] border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all duration-[250ms] min-w-[120px] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
            <strong className="block text-[1.375rem] font-extrabold text-gray-900 mb-1">{t('hero.stat3Value')}</strong>
            <span className="text-[0.8125rem] text-gray-500 font-medium">{t('hero.stat3Label')}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap justify-center lg:justify-start">
          <Button variant="gradient" size="lg" asChild className="rounded-xl shadow-[0_8px_24px_rgba(37,99,235,0.25)] hover:shadow-[0_12px_32px_rgba(37,99,235,0.35)] [&_svg]:mr-1 [&_svg]:w-[1.125rem] [&_svg]:h-[1.125rem]">
            <Link href="/main">
              <FiPlay />
              {t('hero.cta')}
            </Link>
          </Button>
        </div>
      </div>

      <div className="hidden lg:block relative">
        <div className="relative [perspective:1000px]">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden [transform:rotateY(-5deg)_rotateX(2deg)] shadow-[0_25px_50px_rgba(0,0,0,0.12),0_0_0_1px_rgba(255,255,255,0.2)] transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:[transform:rotateY(-2deg)_rotateX(1deg)_scale(1.02)]">
            <div className="py-3.5 px-5 bg-gray-50 border-b border-gray-100 flex items-center gap-3.5 [&>span]:text-gray-700 [&>span]:text-[0.8125rem] [&>span]:font-semibold">
              <div className="flex gap-1.5 [&_span]:w-2.5 [&_span]:h-2.5 [&_span]:rounded-full [&_span:nth-child(1)]:bg-[#ff5f57] [&_span:nth-child(2)]:bg-[#ffbd2e] [&_span:nth-child(3)]:bg-[#28ca42]">
                <span />
                <span />
                <span />
              </div>
              <span>{t('mockup.title')}</span>
            </div>
            <div className="p-8 min-h-[200px] bg-gray-50">
              <div className="flex items-center gap-4 justify-center">
                <div className="flex flex-col items-center gap-2 py-5 px-4 rounded-[14px] border border-blue-600/20 bg-white text-blue-600 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:-translate-y-[3px] hover:shadow-[0_8px_20px_rgba(37,99,235,0.12)] [&_svg]:w-6 [&_svg]:h-6">
                  <FiLayers />
                  <span className="text-[0.6875rem] font-semibold text-gray-600 tracking-wide">{t('mockup.input')}</span>
                </div>
                <div className="w-9 h-0.5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 relative after:content-[''] after:absolute after:-right-[3px] after:-top-[2px] after:w-0 after:h-0 after:border-l-[5px] after:border-l-gray-300 after:border-y-[3px] after:border-y-transparent" />
                <div className="flex flex-col items-center gap-2 py-5 px-4 rounded-[14px] border border-purple-600/20 bg-white text-purple-600 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:-translate-y-[3px] hover:shadow-[0_8px_20px_rgba(124,58,237,0.12)] [&_svg]:w-6 [&_svg]:h-6">
                  <FiCpu />
                  <span className="text-[0.6875rem] font-semibold text-gray-600 tracking-wide">{t('mockup.aiProcess')}</span>
                </div>
                <div className="w-9 h-0.5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 relative after:content-[''] after:absolute after:-right-[3px] after:-top-[2px] after:w-0 after:h-0 after:border-l-[5px] after:border-l-gray-300 after:border-y-[3px] after:border-y-transparent" />
                <div className="flex flex-col items-center gap-2 py-5 px-4 rounded-[14px] border border-emerald-600/20 bg-white text-emerald-600 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:-translate-y-[3px] hover:shadow-[0_8px_20px_rgba(5,150,105,0.12)] [&_svg]:w-6 [&_svg]:h-6">
                  <FiZap />
                  <span className="text-[0.6875rem] font-semibold text-gray-600 tracking-wide">{t('mockup.output')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const rootLandingHeroPlugin: IntroductionSectionPlugin = {
  id: 'root-landing-hero',
  name: 'Landing Hero',
  heroComponent: LandingHero,
};

export default rootLandingHeroPlugin;
