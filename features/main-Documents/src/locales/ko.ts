import type { TranslationData } from '@xgen/i18n';

export const ko: TranslationData = {
  documents: {
    title: '문서',
    searchPlaceholder: '문서 검색...',
    upload: '업로드',
    empty: { title: '문서가 없습니다', description: '문서를 업로드하세요' },
    status: {
      processing: '처리 중',
      indexed: '인덱싱됨',
      failed: '실패'
    },
    types: {
      pdf: 'PDF',
      doc: 'Word',
      txt: '텍스트',
      md: '마크다운',
      html: 'HTML',
      csv: 'CSV',
      xlsx: 'Excel'
    }
  }
};
