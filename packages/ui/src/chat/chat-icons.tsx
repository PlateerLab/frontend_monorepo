'use client';

import React from 'react';

// ─────────────────────────────────────────────────────────────
// Avatars & Chat icons used across variants
// ─────────────────────────────────────────────────────────────

export const UserIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 15.75V14.25C15 13.4544 14.6839 12.6913 14.1213 12.1287C13.5587 11.5661 12.7956 11.25 12 11.25H6C5.20435 11.25 4.44129 11.5661 3.87868 12.1287C3.31607 12.6913 3 13.4544 3 14.25V15.75M12 5.25C12 6.90685 10.6569 8.25 9 8.25C7.34315 8.25 6 6.90685 6 5.25C6 3.59315 7.34315 2.25 9 2.25C10.6569 2.25 12 3.59315 12 5.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const BotIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 1.5V3M6 6.75H6.0075M12 6.75H12.0075M5.25 10.5C5.25 10.5 6.375 12 9 12C11.625 12 12.75 10.5 12.75 10.5M13.5 13.5H4.5C3.67157 13.5 3 12.8284 3 12V6C3 5.17157 3.67157 4.5 4.5 4.5H13.5C14.3284 4.5 15 5.17157 15 6V12C15 12.8284 14.3284 13.5 13.5 13.5ZM6.75 16.5H11.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const SendIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.333 1.667L9.167 10.833M18.333 1.667L12.5 18.333L9.167 10.833M18.333 1.667L1.667 7.5L9.167 10.833" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const PaperclipIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.158 9.342L9.575 16.925C8.66352 17.8365 7.43328 18.3469 6.15 18.3469C4.86672 18.3469 3.63648 17.8365 2.725 16.925C1.81352 16.0135 1.30313 14.7833 1.30313 13.5C1.30313 12.2167 1.81352 10.9865 2.725 10.075L10.308 2.492C10.9178 1.88216 11.7443 1.54004 12.604 1.54004C13.4637 1.54004 14.2902 1.88216 14.9 2.492C15.5098 3.10184 15.852 3.92826 15.852 4.788C15.852 5.64774 15.5098 6.47416 14.9 7.084L7.317 14.667C7.01208 14.9719 6.59887 15.143 6.169 15.143C5.73913 15.143 5.32592 14.9719 5.021 14.667C4.71608 14.3621 4.54502 13.9489 4.54502 13.519C4.54502 13.0891 4.71608 12.6759 5.021 12.371L12.017 5.375" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CloseSmallIcon: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const FileIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.167 1.167H3.5C3.19058 1.167 2.89383 1.28992 2.67504 1.50871C2.45625 1.7275 2.333 2.02425 2.333 2.333V11.667C2.333 11.976 2.45625 12.273 2.67504 12.492C2.89383 12.711 3.19058 12.833 3.5 12.833H10.5C10.809 12.833 11.106 12.711 11.325 12.492C11.544 12.273 11.667 11.976 11.667 11.667V4.667L8.167 1.167Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.167 1.167V4.667H11.667" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const AlertIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 4.667V7M7 9.333H7.006M12.833 7C12.833 10.222 10.222 12.833 7 12.833C3.778 12.833 1.167 10.222 1.167 7C1.167 3.778 3.778 1.167 7 1.167C10.222 1.167 12.833 3.778 12.833 7Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const StopIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="12" height="12" rx="2" fill="currentColor"/>
  </svg>
);

export const ChatBubbleIcon: React.FC = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M42 23C42.005 25.57 41.431 28.107 40.32 30.42C39.0062 33.1755 36.9728 35.4986 34.4233 37.158C31.8737 38.8174 28.9058 39.7478 25.86 39.84C23.29 39.845 20.753 39.271 18.44 38.16L6 42L9.84 29.56C8.72904 27.247 8.15497 24.71 8.16 22.14C8.25221 19.0942 9.18261 16.1263 10.842 13.5767C12.5014 11.0272 14.8245 8.99384 17.58 7.68C19.893 6.56904 22.43 5.99497 25 6H26C30.077 6.224 33.924 7.935 36.844 10.756C39.764 13.577 41.476 17.424 41.7 21.5V23H42Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
