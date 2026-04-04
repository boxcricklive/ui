import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Pencil, Shield, Trophy, ChevronRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../services/api';
import LoadingBar from '../components/LoadingBar';

export default function PlayerProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const username = localStorage.getItem('username');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (username) {
          const res = await api.get(`/api/Player/GetPlayerByUsername?playerUsername=${username}`);
          setProfile(res.data);
        }
      } catch (err) {
        console.error('Error fetching profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    navigate('/login');
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 space-y-4">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Loading Profile...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <LoadingBar loading={loading} />
      <div className="min-h-screen bg-white">
        {/* Dark Header */}
        <div className="bg-brand-dark text-white px-6 py-6 flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-black tracking-widest uppercase">Profile</h1>
        </div>

        <div className="p-6 space-y-10 pb-32">
          {/* Profile Section */}
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-[2rem] p-1.5 border-[3px] border-[#D9F110] shadow-xl shadow-[#D9F110]/10">
                <div className="w-full h-full rounded-[1.6rem] overflow-hidden bg-gray-100">
                  <img 
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${username}`} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer" 
                  />
                </div>
              </div>
              <button className="absolute bottom-1 right-1 w-8 h-8 bg-brand-dark text-white rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                <Pencil size={14} />
              </button>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-black text-brand-dark tracking-tighter">{profile?.playerName || username}</h2>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#D9F110] rounded-full text-[10px] font-black text-brand-dark uppercase tracking-widest shadow-sm">
                <CheckCircle2 size={12} className="fill-brand-dark text-[#D9F110]" />
                Premium Member
              </div>
            </div>
          </div>

          {/* Series Record */}
          <section className="space-y-4">
            <h3 className="text-lg font-black text-brand-dark tracking-tight">Series Record</h3>
            <div className="bg-white rounded-2xl shadow-xl shadow-brand-dark/5 border border-gray-50 p-6 flex justify-between items-center">
              <div className="text-center flex-1">
                <p className="text-2xl font-black text-[#2E7D32]">12</p>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Won</p>
              </div>
              <div className="w-px h-8 bg-gray-100" />
              <div className="text-center flex-1">
                <p className="text-2xl font-black text-[#C62828]">04</p>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Lost</p>
              </div>
              <div className="w-px h-8 bg-gray-100" />
              <div className="text-center flex-1">
                <p className="text-2xl font-black text-brand-dark">01</p>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Draw</p>
              </div>
            </div>
          </section>

          {/* Saved Team */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-brand-dark tracking-tight">Saved Team</h3>
              <button className="text-[10px] font-black text-[#D9F110] uppercase tracking-widest hover:underline">Manage</button>
            </div>
            
            <div className="space-y-3">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between group hover:shadow-lg transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-brand-dark">
                    <Shield size={24} />
                  </div>
                  <div>
                    <p className="font-black text-brand-dark text-sm uppercase tracking-tight">Warriors XI</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">11 Players</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-brand-dark transition-colors" />
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between group hover:shadow-lg transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-brand-dark">
                    <Trophy size={24} />
                  </div>
                  <div>
                    <p className="font-black text-brand-dark text-sm uppercase tracking-tight">Elite Strikers</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">15 Players</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-brand-dark transition-colors" />
              </div>
            </div>
          </section>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="w-full py-4 bg-[#F1F3F5] rounded-2xl flex items-center justify-center gap-3 text-brand-dark font-black uppercase tracking-widest hover:bg-gray-200 transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>
    </Layout>
  );
}
