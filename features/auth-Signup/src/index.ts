'use client';
import React, { useState } from 'react';
import type { FeatureModule } from '@xgen/types';

const SignupPage: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-8">?Œì›ê°€??/h1>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-sm font-medium mb-1">?´ë¦„</label>
            <input type="text" value={form.name} onChange={update('name')} placeholder="?ê¸¸?? className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">?´ë©”??/label>
            <input type="email" value={form.email} onChange={update('email')} placeholder="name@company.com" className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ë¹„ë?ë²ˆí˜¸</label>
            <input type="password" value={form.password} onChange={update('password')} placeholder="8???´ìƒ" className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ë¹„ë?ë²ˆí˜¸ ?•ì¸</label>
            <input type="password" value={form.confirmPassword} onChange={update('confirmPassword')} placeholder="ë¹„ë?ë²ˆí˜¸ë¥??¤ì‹œ ?…ë ¥?˜ì„¸?? className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <button type="submit" className="w-full py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">ê°€?…í•˜ê¸?/button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">?´ë? ê³„ì •???ˆìœ¼? ê??? <a href="/login" className="text-blue-500 hover:underline">ë¡œê·¸??/a></p>
      </div>
    </div>
  );
};

export const authSignupModule: FeatureModule = {
  id: 'auth-Signup',
  name: '?Œì›ê°€??,
  pageRoutes: { '/signup': SignupPage },
};

export default authSignupModule;