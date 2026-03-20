'use client';
import React from 'react';
const Divider: React.FC<{ className?: string }> = ({ className }) => <hr className={`border-gray-200 ${className ?? ''}`} />;
export default Divider;
