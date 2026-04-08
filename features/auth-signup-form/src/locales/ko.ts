import type { TranslationData } from '@xgen/i18n';

export const ko: TranslationData = {
  title: 'XGEN',
  subtitle: '기업의 AX 혁신을 돕는 Agentic AI Platform',
  // Tabs
  tabGeneral: '회원가입',
  tabGuest: '게스트 가입',
  // General mode notice
  generalNotice: '계정을 생성합니다. 가입 후 관리자 승인이 필요할 수 있습니다.',
  guestNotice: '게스트 계정으로 빠르게 이용하세요. 관리자 승인이 필요 없습니다.',
  // Fields
  usernamePlaceholder: '사용자명',
  emailPlaceholder: '이메일',
  passwordPlaceholder: '비밀번호',
  passwordConfirmPlaceholder: '비밀번호 확인',
  fullNamePlaceholder: '이름 (선택)',
  phonePlaceholder: '전화번호 (선택)',
  // Guest fields
  guestFullNamePlaceholder: '이름',
  guestPhonePlaceholder: '전화번호 (예: 010-1234-5678)',
  // Buttons
  signupButton: '회원가입',
  signupLoading: '가입 중...',
  // Links
  alreadyHaveAccount: '이미 계정이 있으신가요?',
  login: '로그인',
  // Password validation
  passwordRequirements: '비밀번호 요구사항',
  passwordMinLength: '8자 이상',
  passwordCategories: '다음 중 2가지 이상 포함:',
  passwordUppercase: '영문 대문자',
  passwordLowercase: '영문 소문자',
  passwordNumber: '숫자',
  passwordSpecial: '특수문자',
  // Show/hide password
  showPassword: '비밀번호 보기',
  hidePassword: '비밀번호 숨기기',
  // Errors
  errors: {
    allFieldsRequired: '필수 항목을 모두 입력해주세요.',
    invalidEmail: '올바른 이메일 주소를 입력해주세요.',
    passwordTooShort: '비밀번호는 8자 이상이어야 합니다.',
    passwordTooWeak: '비밀번호에 대문자, 소문자, 숫자, 특수문자 중 2가지 이상을 포함해주세요.',
    passwordMismatch: '비밀번호가 일치하지 않습니다.',
    invalidPhone: '올바른 전화번호를 입력해주세요.',
    signupFailed: '회원가입에 실패했습니다.',
    signupError: '회원가입 중 오류가 발생했습니다.',
    emailAlreadyExists: '이미 등록된 이메일입니다.',
    usernameAlreadyExists: '이미 사용 중인 사용자명입니다.',
  },
  // Success
  signupSuccess: '회원가입이 완료되었습니다!',
  guestSignupSuccess: '게스트 계정이 생성되었습니다! 로그인 페이지로 이동합니다...',
};
