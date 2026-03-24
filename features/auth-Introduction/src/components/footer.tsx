'use client';

import { useTranslation } from '@xgen/i18n';
import styles from '../styles/introduction.module.scss';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        {/* Top */}
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <h3>{t('footer.brand')}</h3>
            <p>{t('footer.tagline')}</p>
          </div>
        </div>
        {/* Bottom */}
        <div className={styles.footerBottom}>
          <p>{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
