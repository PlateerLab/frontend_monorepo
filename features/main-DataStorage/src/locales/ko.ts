import type { TranslationData } from '@xgen/i18n';

export const ko: TranslationData = {
  dataStorage: {
    title: '데이터 저장소',
    searchPlaceholder: '데이터셋 검색...',
    uploadDataset: '데이터셋 업로드',
    exportAll: '전체 내보내기',
    tabs: { all: '전체', tabular: '테이블', text: '텍스트', image: '이미지', audio: '오디오' },
    summary: {
      datasets: '데이터셋',
      totalRows: '총 행',
      totalSize: '총 크기',
      ready: '준비됨'
    },
    rows: '행',
    columns: '열',
    size: '크기',
    format: '형식',
    preview: '미리보기',
    download: '다운로드',
    empty: { title: '데이터셋이 없습니다', description: '데이터셋을 업로드하세요' }
  }
};
