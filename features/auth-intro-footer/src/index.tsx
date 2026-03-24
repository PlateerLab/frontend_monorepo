'use client';

import { useTranslation } from '@xgen/i18n';
import type { IntroductionSectionPlugin } from '@xgen/types';
import styles from './styles/footer.module.scss';

function IntroFooter() {
  const { t } = useTranslation();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <h3>{t('footer.brand')}</h3>
            <p>{t('footer.tagline')}</p>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
}

export const authIntroFooterPlugin: IntroductionSectionPlugin = {
  id: 'auth-intro-footer',
  name: 'Introduction Footer',
  footerComponent: IntroFooter,
};

export default authIntroFooterPlugin;
