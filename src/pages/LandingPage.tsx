import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-primary/10 blur-[120px] rounded-full" />
      
      <div className="z-10 text-center space-y-8 max-w-lg">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest text-brand-primary uppercase">
          <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
          Game Engine
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter text-white leading-none">
          BOXCRICLIVE
        </h1>

        <p className="text-gray-400 text-base md:text-lg leading-relaxed px-4 max-w-sm mx-auto">
          Unlocking the future of cricket with real-time neural tracking and elite performance metrics.
        </p>

        <div className="space-y-4 pt-8 md:pt-12 w-full max-w-xs sm:max-w-sm mx-auto">
          <button 
            onClick={() => navigate('/signup')}
            className="btn-accent text-sm uppercase tracking-widest"
          >
            Join as Player <ArrowRight size={18} />
          </button>
          
          <button 
            onClick={() => navigate('/matches')}
            className="w-full bg-white/5 border border-white/10 text-white font-bold py-4 rounded-md flex items-center justify-center gap-2 hover:bg-white/10 transition-all text-sm uppercase tracking-widest"
          >
            View Match Only
          </button>
        </div>
      </div>
    </div>
  );
}
