import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  title: 'XGEN',
  subtitle: 'Agentic AI Platform for Enterprise AX Innovation',
  // Tabs
  tabGeneral: 'Sign Up',
  tabGuest: 'Guest Sign Up',
  // General mode notice
  generalNotice: 'Create your account. Admin approval may be required after registration.',
  guestNotice: 'Quick access with guest account. No admin approval needed.',
  // Fields
  usernamePlaceholder: 'Username',
  emailPlaceholder: 'Email',
  passwordPlaceholder: 'Password',
  passwordConfirmPlaceholder: 'Confirm password',
  fullNamePlaceholder: 'Full name (optional)',
  phonePlaceholder: 'Phone number (optional)',
  // Guest fields
  guestFullNamePlaceholder: 'Full name',
  guestPhonePlaceholder: 'Phone number (e.g. 010-1234-5678)',
  // Buttons
  signupButton: 'Sign Up',
  signupLoading: 'Signing up...',
  // Links
  alreadyHaveAccount: 'Already have an account?',
  login: 'Login',
  // Password validation
  passwordRequirements: 'Password requirements',
  passwordMinLength: 'At least 8 characters',
  passwordCategories: 'Include 2 or more of the following:',
  passwordUppercase: 'Uppercase letter',
  passwordLowercase: 'Lowercase letter',
  passwordNumber: 'Number',
  passwordSpecial: 'Special character',
  // Show/hide password
  showPassword: 'Show password',
  hidePassword: 'Hide password',
  // Errors
  errors: {
    allFieldsRequired: 'Please fill in all required fields.',
    invalidEmail: 'Please enter a valid email address.',
    passwordTooShort: 'Password must be at least 8 characters.',
    passwordTooWeak: 'Password must include at least 2 of: uppercase, lowercase, number, special character.',
    passwordMismatch: 'Passwords do not match.',
    invalidPhone: 'Please enter a valid phone number.',
    signupFailed: 'Sign up failed.',
    signupError: 'An error occurred during sign up.',
    emailAlreadyExists: 'This email is already registered.',
    usernameAlreadyExists: 'This username is already taken.',
  },
  // Success
  signupSuccess: 'Account created successfully!',
  guestSignupSuccess: 'Guest account created! Redirecting to login...',
};
