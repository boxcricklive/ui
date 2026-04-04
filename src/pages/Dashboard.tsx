import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Zap, Target, Trophy, ChevronRight, Plus, X, Play, BarChart2, User, LogOut } from 'lucide-react';
import Layout from '../components/Layout';
import api, { checkHealth } from '../services/api';
import LoadingBar from '../components/LoadingBar';

export default function Dashboard() {
  const [showNewSession, setShowNewSession] = useState(false);
  const [isActionPressed, setIsActionPressed] = useState(false);
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [liveMatch, setLiveMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isServerUp, setIsServerUp] = useState<boolean | null>(null);
  const username = localStorage.getItem('username');
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setIsServerUp(null);
    try {
      if (username) {
        const statsRes = await api.get(`/api/Player/GetPlayerStatsByUsername?playerUsername=${encodeURIComponent(username)}`);
        setPlayerStats(statsRes.data);
      }
      // Attempt to fetch live matches if endpoint exists, otherwise set to null
      try {
        const liveRes = await api.get('/api/Match/GetLiveMatches');
        if (liveRes.data && Array.isArray(liveRes.data)) {
          setLiveMatch(liveRes.data[0]); // Show the first live match
        }
      } catch (e) {
        console.log('Live matches endpoint not found or failed');
        setLiveMatch(null);
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data', err);
      // If it's a 401, api.ts interceptor will handle redirect.
      // For other errors, we just log them and don't show the intrusive error screen.
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('username');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [username]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const handleAction = (path: string) => {
    setIsActionPressed(true);
    setTimeout(() => {
      navigate(path);
      setShowNewSession(false);
      setIsActionPressed(false);
    }, 300);
  };

  return (
    <Layout onPlusClick={() => setShowNewSession(true)}>
      <LoadingBar loading={loading} />
      <div className="p-6 space-y-8 pb-32">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-input flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm">
              <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${username}&backgroundColor=b6e3f4`} alt="Avatar" referrerPolicy="no-referrer" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Welcome Back</p>
              <h3 className="text-xl font-black tracking-tighter text-brand-dark leading-tight">Hello {username}</h3>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 text-brand-dark relative hover:scale-110 transition-transform">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 text-red-500 hover:scale-110 transition-transform"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Loading State Skeleton */}
        {loading && (
          <div className="space-y-8 animate-pulse">
            <div className="h-14 bg-gray-100 rounded-2xl w-full" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-100 rounded-lg w-1/2" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-32 bg-gray-100 rounded-2xl" />
                <div className="h-32 bg-gray-100 rounded-2xl" />
                <div className="h-32 bg-gray-100 rounded-2xl" />
                <div className="h-32 bg-gray-100 rounded-2xl" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-100 rounded-lg w-1/3" />
              <div className="h-64 bg-gray-100 rounded-[2.5rem]" />
            </div>
          </div>
        )}

        {!loading && (
          <>
            {/* Search */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-dark transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search matches, players or teams..." 
                className="w-full bg-[#F1F3F5] border-2 border-transparent rounded-xl py-4 pl-12 pr-4 text-sm text-brand-dark font-medium focus:bg-white focus:border-brand-primary/20 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all"
              />
            </div>

            {/* Season Performance */}
            <section className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <h4 className="text-xl font-black tracking-tighter text-brand-dark uppercase">Season Performance</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Updated today</p>
                </div>
                <button 
                  onClick={() => navigate('/stats')}
                  className="text-[10px] font-black text-brand-dark uppercase tracking-widest hover:text-brand-primary transition-colors flex items-center gap-1"
                >
                  View Analytics
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl shadow-xl shadow-brand-dark/5 space-y-3 relative overflow-hidden">
                  <div className="flex justify-between items-center">
                    <div className="p-2 bg-brand-primary/10 rounded-lg">
                      <Target size={18} className="text-brand-dark" />
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Runs</span>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-brand-dark tracking-tighter">{playerStats?.totalRuns || '0'}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Best: {playerStats?.bestBattingScore || 'N/A'}</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-xl shadow-brand-dark/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="p-2 bg-brand-primary/10 rounded-lg">
                      <Zap size={18} className="text-brand-dark" />
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">S/R</span>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-brand-dark tracking-tighter">{playerStats?.battingStrikeRate?.toFixed(1) || '0.0'}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Season Avg</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-xl shadow-brand-dark/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="p-2 bg-brand-primary/10 rounded-lg">
                      <Trophy size={18} className="text-brand-dark" />
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Wkts</span>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-brand-dark tracking-tighter">{playerStats?.totalWickets || '0'}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">BBI: {playerStats?.bestBowlingFigures || 'N/A'}</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-xl shadow-brand-dark/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="p-2 bg-brand-primary/10 rounded-lg">
                      <BarChart2 size={18} className="text-brand-dark" />
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Boundaries</span>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-brand-dark tracking-tighter">
                      {playerStats?.fours || 0} <span className="text-brand-primary">/</span> {playerStats?.sixes || 0}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fours & Sixes</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Match Center */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xl font-black tracking-tighter text-brand-dark uppercase">Match Center</h4>
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/20 text-[9px] font-black text-brand-dark uppercase tracking-[0.2em]">
                  <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                  Live Updates
                </div>
              </div>

              {liveMatch ? (
                <div 
                  onClick={() => navigate(`/scoring/${liveMatch.matchId}`)}
                  className="bg-white rounded-2xl shadow-2xl shadow-brand-dark/10 overflow-hidden border border-gray-100 cursor-pointer hover:scale-[1.01] transition-transform"
                >
                  <div className="p-8 flex justify-between items-center relative">
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 bg-[#F1F3F5] rounded-xl flex items-center justify-center text-xl font-black text-brand-dark mx-auto shadow-sm">
                        {liveMatch.squads?.[0]?.teamName?.substring(0, 3).toUpperCase()}
                      </div>
                      <div>
                        <h5 className="font-black text-brand-dark text-sm uppercase tracking-tight">{liveMatch.squads?.[0]?.teamName}</h5>
                        <p className="text-2xl font-black text-brand-dark tracking-tighter">
                          {liveMatch.inningsList?.[0]?.battingTeamId === liveMatch.squads?.[0]?.teamId 
                            ? `${liveMatch.inningsList?.[0]?.totalRunsScored || 0}/${liveMatch.inningsList?.[0]?.totalWicketsTaken || 0}`
                            : 'Yet to bat'}
                        </p>
                      </div>
                    </div>

                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10">
                      <div className="px-3 py-1 bg-brand-dark text-white text-[8px] font-black rounded-full mb-3 shadow-lg">LIVE</div>
                      <span className="text-gray-200 font-black italic text-xl">VS</span>
                    </div>

                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 bg-[#F1F3F5] rounded-xl flex items-center justify-center text-xl font-black text-brand-dark mx-auto shadow-sm">
                        {liveMatch.squads?.[1]?.teamName?.substring(0, 3).toUpperCase()}
                      </div>
                      <div>
                        <h5 className="font-black text-brand-dark text-sm uppercase tracking-tight">{liveMatch.squads?.[1]?.teamName}</h5>
                        <p className="text-2xl font-black text-brand-dark tracking-tighter">
                          {liveMatch.inningsList?.[0]?.battingTeamId === liveMatch.squads?.[1]?.teamId 
                            ? `${liveMatch.inningsList?.[0]?.totalRunsScored || 0}/${liveMatch.inningsList?.[0]?.totalWicketsTaken || 0}`
                            : 'Yet to bat'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-brand-dark p-4 flex justify-between items-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Live from {liveMatch.location || 'Arena'}</p>
                    <BarChart2 size={16} className="text-brand-primary" />
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center space-y-3">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200">
                    <Zap size={32} />
                  </div>
                  <p className="text-sm font-black text-brand-dark uppercase tracking-widest">No Live Matches</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Check back later for real-time stats</p>
                </div>
              )}

              {/* Recent Match Result Card */}
              {playerStats?.recentMatches?.[0] && (
                <div 
                  onClick={() => navigate(`/scoring/${playerStats.recentMatches[0].matchId}`)}
                  className="bg-[#F1F3F5] rounded-xl p-6 flex items-center justify-between group hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-gray-100 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                      <div className="w-12 h-12 bg-brand-dark rounded-xl flex items-center justify-center text-[10px] font-black text-white border-2 border-white shadow-sm">
                        {playerStats.recentMatches[0].squads?.[0]?.teamName?.substring(0, 3).toUpperCase()}
                      </div>
                      <div className="w-12 h-12 bg-slate-400 rounded-xl flex items-center justify-center text-[10px] font-black text-white border-2 border-white shadow-sm">
                        {playerStats.recentMatches[0].squads?.[1]?.teamName?.substring(0, 3).toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <h5 className="font-black text-brand-dark uppercase tracking-tight">
                        {playerStats.recentMatches[0].squads?.[0]?.teamName} v {playerStats.recentMatches[0].squads?.[1]?.teamName}
                      </h5>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        {new Date(playerStats.recentMatches[0].dateAndTime).toLocaleDateString()} • {playerStats.recentMatches[0].location}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-brand-dark uppercase tracking-tight">
                      {playerStats.recentMatches[0].winningTeamName ? `${playerStats.recentMatches[0].winningTeamName} WON` : 'FINISHED'}
                    </p>
                    <button className="text-[9px] font-bold text-gray-400 uppercase tracking-widest hover:text-brand-dark transition-colors">Full Scorecard</button>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* New Session Modal */}
      {showNewSession && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-brand-dark/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-8 space-y-8 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black tracking-tighter text-brand-dark">New Session</h3>
                <p className="text-gray-400 text-sm">Select your next performance action</p>
              </div>
              <button onClick={() => setShowNewSession(false)} className="p-2 bg-gray-100 rounded-full text-gray-400">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <button 
                onClick={() => handleAction('/match-setup')}
                className="w-full flex items-center gap-4 p-5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors group text-left"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-200 ${isActionPressed ? 'bg-[#D9F110] text-brand-dark' : 'bg-brand-dark text-white'}`}>
                  <Plus size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-brand-dark">Create Match</h4>
                  <p className="text-xs text-gray-400">Start a new live scoring session</p>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-brand-dark transition-colors" />
              </button>

              <button 
                onClick={() => handleAction('/join-match')}
                className="w-full flex items-center gap-4 p-5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors group text-left"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-200 ${isActionPressed ? 'bg-[#D9F110] text-brand-dark' : 'bg-brand-dark text-white'}`}>
                  <User size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-brand-dark">Join Match</h4>
                  <p className="text-xs text-gray-400">Join as player</p>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-brand-dark transition-colors" />
              </button>

              <button 
                onClick={() => handleAction('/matches')}
                className="w-full flex items-center gap-4 p-5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors group text-left"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-200 ${isActionPressed ? 'bg-[#D9F110] text-brand-dark' : 'bg-brand-dark text-white'}`}>
                  <Search size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-brand-dark">View Match</h4>
                  <p className="text-xs text-gray-400">Follow live stats</p>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-brand-dark transition-colors" />
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
