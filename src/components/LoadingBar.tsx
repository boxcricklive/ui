import React from 'react';

interface LoadingBarProps {
  loading: boolean;
}

export default function LoadingBar({ loading }: LoadingBarProps) {
  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-gray-100 overflow-hidden">
      <div className="h-full bg-brand-primary animate-progress-bar w-full origin-left" />
      <style>{`
        @keyframes progress-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(-30%); }
          100% { transform: translateX(0); }
        }
        .animate-progress-bar {
          animation: progress-bar 2s infinite linear;
        }
      `}</style>
    </div>
  );
}
