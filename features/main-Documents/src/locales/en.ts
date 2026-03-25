import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  documents: {
    title: 'Documents',
    searchPlaceholder: 'Search documents...',
    upload: 'Upload',
    empty: { title: 'No documents', description: 'Upload your documents' },
    status: {
      processing: 'Processing',
      indexed: 'Indexed',
      failed: 'Failed'
    },
    types: {
      pdf: 'PDF',
      doc: 'Word',
      txt: 'Text',
      md: 'Markdown',
      html: 'HTML',
      csv: 'CSV',
      xlsx: 'Excel'
    }
  }
};
