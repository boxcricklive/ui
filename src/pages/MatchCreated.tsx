import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, Copy, Share2, UserPlus } from 'lucide-react';

export default function MatchCreated() {
  const { matchId } = useParams();
  const locationState = useLocation().state;
  const navigate = useNavigate();

  const handleCopy = () => {
    if (matchId) {
      navigator.clipboard.writeText(matchId);
      alert('Match ID copied!');
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark max-w-md mx-auto shadow-xl flex flex-col">
      {/* Header */}
      <div className="p-6 flex justify-between items-center text-white">
        <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-black tracking-tight uppercase">Match Setup</h2>
        <button className="p-2 -mr-2">
          <MoreVertical size={24} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="bg-white w-full rounded-[2.5rem] overflow-hidden shadow-2xl">
          {/* Top Icon Section */}
          <div className="h-64 bg-[#0F172A] relative flex items-center justify-center">
            <div className="w-32 h-32 bg-brand-primary rounded-[2rem] flex items-center justify-center shadow-2xl shadow-brand-primary/20 transform -rotate-6">
              <div className="w-20 h-20 border-4 border-brand-dark rounded-full flex items-center justify-center -rotate-12">
                <img src="https://api.dicebear.com/7.x/icons/svg?seed=cricket&backgroundColor=transparent" className="w-12 h-12" alt="Cricket Icon" referrerPolicy="no-referrer" />
              </div>
            </div>
          </div>

          <div className="p-10 text-center space-y-10">
            <div className="space-y-3">
              <h1 className="text-4xl font-black tracking-tighter text-[#0F172A] uppercase">Match Created!</h1>
              <p className="text-gray-500 text-sm leading-relaxed px-4 font-medium">
                Share this ID with players to join. The arena is set and analytics are live.
              </p>
            </div>

            {/* Match Access Code Card */}
            <div className="bg-[#0F172A] p-8 rounded-[2rem] space-y-4 relative overflow-hidden">
              <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] text-center opacity-80">Match Access Code</p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                <span className="text-3xl sm:text-5xl font-black text-brand-primary tracking-[0.1em] font-mono break-all text-center">
                  {matchId}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={handleCopy} 
                    className="p-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all"
                    title="Copy ID"
                  >
                    <Copy size={20} />
                  </button>
                  <button 
                    className="p-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all"
                    title="Share"
                  >
                    <Share2 size={20} />
                  </button>
                </div>
              </div>
            </div>

            <button 
              onClick={() => navigate('/join-match', { state: { matchId } })}
              className="w-full bg-brand-primary text-brand-dark rounded-2xl py-6 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-brand-primary/20 hover:scale-[1.02] transition-transform"
            >
              <UserPlus size={24} /> Add Players
            </button>

            <div className="flex justify-between items-center pt-8 border-t border-gray-100">
              <div className="text-left space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Venue</p>
                <p className="text-sm font-black text-brand-dark">{locationState?.location || 'Lords International'}</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Format</p>
                <p className="text-sm font-black text-brand-dark">{locationState?.overs || '20'} League</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
