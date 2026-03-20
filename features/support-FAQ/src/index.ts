'use client';
import React, { useState } from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

/* ?Ä?Ä FAQ ?Ä?Ä */
export const FAQItem: React.FC<{
  question: string; answer: string;
}> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-gray-100">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50">
        <span className="font-medium text-sm">{question}</span>
        <span className="text-gray-400">{isOpen ? '?? : '+'}</span>
      </button>
      {isOpen && <div className="px-4 py-3 text-sm text-gray-600 bg-gray-50">{answer}</div>}
    </div>
  );
};

const FAQPage: React.FC<RouteComponentProps> = () => (
  <div className="flex flex-col h-full">
    <div className="px-6 py-4 border-b">
      <h2 className="font-semibold text-lg">?êÏ£º Î¨ªÎäî ÏßàÎ¨∏</h2>
      <input type="text" placeholder="ÏßàÎ¨∏ Í≤Ä??.." className="mt-2 w-full max-w-md px-3 py-1.5 border rounded-lg text-sm" />
    </div>
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto py-4">
        <FAQItem question="XGEN?Ä ?¥Îñ§ ?úÎπÑ?§Ïù∏Í∞Ä??" answer="XGEN?Ä AI ?åÌÅ¨?åÎ°ú???êÎèô???åÎû´?ºÏûÖ?àÎã§." />
        <FAQItem question="?åÌÅ¨?åÎ°ú?∞Î? ?¥ÎñªÍ≤?ÎßåÎìú?òÏöî?" answer="Ï∫îÎ≤Ñ?§Ïóê???∏ÎìúÎ•??úÎûòÍ∑∏Ìïò???åÌÅ¨?åÎ°ú?∞Î? ?§Í≥Ñ?????àÏäµ?àÎã§." />
        <FAQItem question="Î™®Îç∏ ?ôÏäµ?Ä ?¥ÎñªÍ≤??òÎÇò??" answer="Î™®Îç∏ ?ôÏäµ Î©îÎâ¥?êÏÑú ?∞Ïù¥?∞ÏÖãÍ≥?Í∏∞Î∞ò Î™®Îç∏???†ÌÉù?òÏó¨ ?ôÏäµ???úÏûë?©Îãà??" />
      </div>
    </div>
  </div>
);

export const supportFaqFeature: FeatureModule = {
  id: 'support-FAQ',
  name: 'Support FAQ',
  sidebarSection: 'workspace',
  sidebarItems: [
    { id: 'support-faq', titleKey: 'support.faq.title', descriptionKey: 'support.faq.description' },
  ],
  routes: { 'support-faq': FAQPage },
};

export { FAQPage };
export default supportFaqFeature;