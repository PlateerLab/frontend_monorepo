import type { TranslationData } from '@xgen/i18n';

export const ko: TranslationData = {
  title: 'XGEN',
  subtitle: '기업의 AX 혁신을 돕는 Agentic AI Platform',
  emailPlaceholder: '이메일을 입력해 주세요',
  passwordPlaceholder: '패스워드를 입력해 주세요',
  loginButton: '로그인',
  loginLoading: '로그인 중...',
  forgotPassword: '비밀번호 초기화',
  noAccount: '계정이 없으신가요?',
  signup: '회원가입',
  showPassword: '비밀번호 보기',
  hidePassword: '비밀번호 숨기기',
  errors: {
    emailAndPasswordRequired: '이메일과 비밀번호를 모두 입력해주세요.',
    invalidCredentials: '이메일 또는 비밀번호가 올바르지 않습니다.',
    databaseError: '데이터베이스 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    tokenCreationFailed: '토큰 생성에 실패했습니다. 잠시 후 다시 시도해주세요.',
    loginFailed: '로그인에 실패했습니다.',
    loginError: '로그인 중 오류가 발생했습니다.',
  },
};
