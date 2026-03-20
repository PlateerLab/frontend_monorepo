'use client';
import React, { useState } from 'react';
import type { FeatureModule } from '@xgen/types';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-2">ÎπÑÎ?Î≤àÌò∏ Ï∞æÍ∏∞</h1>
        <p className="text-center text-sm text-gray-500 mb-8">Í∞Ä?????¨Ïö©???¥Î©î?ºÏùÑ ?ÖÎ†•?òÏÑ∏??/p>
        {submitted ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">?ìß</div>
            <p className="font-medium mb-2">?¥Î©î?ºÏù¥ ?ÑÏÜ°?òÏóà?µÎãà??/p>
            <p className="text-sm text-gray-500 mb-6">ÎπÑÎ?Î≤àÌò∏ ?¨ÏÑ§??ÎßÅÌÅ¨Î•??ïÏù∏?òÏÑ∏??/p>
            <a href="/login" className="text-blue-500 hover:underline text-sm">Î°úÍ∑∏?∏ÏúºÎ°??åÏïÑÍ∞ÄÍ∏?/a>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
            <div>
              <label className="block text-sm font-medium mb-1">?¥Î©î??/label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <button type="submit" className="w-full py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">?¨ÏÑ§??ÎßÅÌÅ¨ ?ÑÏÜ°</button>
          </form>
        )}
        {!submitted && <p className="text-center text-sm text-gray-500 mt-6"><a href="/login" className="text-blue-500 hover:underline">Î°úÍ∑∏?∏ÏúºÎ°??åÏïÑÍ∞ÄÍ∏?/a></p>}
      </div>
    </div>
  );
};

export const authForgotPasswordModule: FeatureModule = {
  id: 'auth-ForgotPassword',
  name: 'ÎπÑÎ?Î≤àÌò∏ Ï∞æÍ∏∞',
  pageRoutes: { '/forgot-password': ForgotPasswordPage },
};

export default authForgotPasswordModule;