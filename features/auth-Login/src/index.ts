'use client';
import React, { useState } from 'react';
import type { FeatureModule } from '@xgen/types';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-8">XGEN 로그??/h1>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-sm font-medium mb-1">?�메??/label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">비�?번호</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비�?번호�??�력?�세?? className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" className="rounded" />로그???��?</label>
            <a href="/forgot-password" className="text-blue-500 hover:underline">비�?번호 찾기</a>
          </div>
          <button type="submit" className="w-full py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">로그??/button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">계정???�으?��??? <a href="/signup" className="text-blue-500 hover:underline">?�원가??/a></p>
      </div>
    </div>
  );
};

export const authLoginModule: FeatureModule = {
  id: 'auth-Login',
  name: '로그??,
  pageRoutes: { '/login': LoginPage },
};

export default authLoginModule;