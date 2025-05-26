import React from 'react';

export default function FullPageWrapper({ children }) {
  return (
    <div className="h-[calc(100vh-40px)] overflow-hidden">
      {children}
    </div>
  );
}