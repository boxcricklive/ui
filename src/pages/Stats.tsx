import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Target, Zap, Trophy, ArrowUpRight, ArrowDownRight, LogOut } from 'lucide-react';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Stats() {
  const navigate = useNavigate();
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const username = localStorage.getItem('username');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      if (username) {
        const res = await api.get(`/api/Player/GetPlayerStatsByUsername?playerUsername=${encodeURIComponent(username)}`);
        setPlayerStats(res.data);
      }
    } catch (err: any) {
      console.error('Error fetching stats', err);
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
    fetchStats();
  }, [username]);

  if (loading) return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 space-y-4">
      <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Loading Analytics...</p>
    </div>
  );

  return (
    <Layout>
      <div className="min-h-screen bg-[#F8F9FA] p-6 space-y-8 pb-24">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Performance Hub</p>
            <h1 className="text-4xl font-black tracking-tighter text-brand-dark">Analytics</h1>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-brand-dark/5 border border-gray-50 space-y-4">
            <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-dark">
              <TrendingUp size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Strike Rate</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-black text-brand-dark">{playerStats?.battingStrikeRate || '0.0'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-brand-dark/5 border border-gray-50 space-y-4">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
              <Target size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Runs</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-black text-brand-dark">{playerStats?.totalRuns || '0'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <section className="bg-brand-dark rounded-[2.5rem] p-8 text-white space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/5 rounded-full -mr-24 -mt-24 blur-3xl" />
          
          <div className="flex justify-between items-center relative z-10">
            <h3 className="text-xl font-black tracking-tighter">Career Summary</h3>
            <BarChart3 size={20} className="text-brand-primary" />
          </div>

          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-white/5 relative z-10">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Wickets</p>
              <p className="text-xl font-black text-brand-primary">{playerStats?.totalWickets || '0'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Economy</p>
              <p className="text-xl font-black text-white">{playerStats?.bowlingEconomy || '0.0'}</p>
            </div>
          </div>
        </section>

        {/* Top Performers - Only if data exists, otherwise show user's own stats */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black tracking-tighter text-brand-dark">Your Highlights</h3>
            <Users size={20} className="text-gray-300" />
          </div>

          <div className="space-y-3">
            <div className="bg-white p-5 rounded-3xl border border-gray-100 flex items-center justify-between hover:shadow-lg hover:shadow-brand-dark/5 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100">
                  <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${username}&backgroundColor=b6e3f4`} alt="Avatar" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <p className="text-xs font-black text-brand-dark uppercase tracking-widest">{username}</p>
                  <div className="flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-500 text-[8px] font-black uppercase tracking-widest">
                    <Zap size={14} />
                    {playerStats?.totalRuns || 0} Career Runs
                  </div>
                </div>
              </div>
              <ArrowUpRight size={18} className="text-gray-200" />
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
