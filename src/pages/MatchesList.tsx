import React, { useState, useEffect } from 'react';
import { Search, Filter, ArrowLeft, ChevronRight, Target, Zap, Trophy, BarChart2 } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import LoadingBar from '../components/LoadingBar';

export default function MatchesList() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await api.get('/api/Match/GetMatches');
        if (res.data && Array.isArray(res.data)) {
          setMatches(res.data);
        }
      } catch (err) {
        console.error('Error fetching matches', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 space-y-4">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Loading Matches...</p>
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
          <h1 className="text-xl font-black tracking-widest uppercase">Matches</h1>
        </div>

        <div className="p-6 space-y-8">
          {/* Search & Filter */}
          <div className="flex gap-3">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-dark transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search matches, teams or players" 
                className="w-full bg-[#F1F3F5] border-2 border-transparent rounded-xl py-4 pl-12 pr-4 text-sm text-brand-dark font-medium focus:bg-white focus:border-brand-primary/20 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all"
              />
            </div>
            <button className="p-4 bg-[#F1F3F5] rounded-xl text-brand-dark hover:bg-gray-200 transition-colors">
              <Filter size={20} />
            </button>
          </div>

          {/* Live Now */}
          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h4 className="text-xl font-black tracking-tighter text-brand-dark uppercase">Live Now</h4>
                <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
              </div>
              <button className="text-[10px] font-black text-brand-dark uppercase tracking-widest hover:text-brand-primary transition-colors">View All</button>
            </div>

            <div className="space-y-6">
              {matches.filter(m => m.status === 'Live').map(match => {
                const innings = match.inningsList?.[0];
                const team1 = match.squads?.[0];
                const team2 = match.squads?.[1];
                const isTeam1Batting = innings?.battingTeamId === team1?.teamId;
                
                return (
                  <div key={match.matchId} className="bg-white border border-gray-100 rounded-2xl shadow-xl shadow-brand-dark/5 overflow-hidden relative">
                    <div className="absolute top-0 right-0 px-3 py-1 bg-[#D9F110] text-[8px] font-black text-brand-dark uppercase tracking-widest rounded-bl-xl">
                      LIVE • INNINGS {innings?.inningsNo || 1}
                    </div>
                    
                    <div className="p-6 space-y-6">
                      <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{new Date(match.dateAndTime).toLocaleDateString()}</p>
                      <h3 className="text-lg font-black text-brand-dark uppercase tracking-tight">{team1?.teamName} VS {team2?.teamName}</h3>

                      <div className="space-y-4">
                        {/* Team 1 */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-brand-dark text-white rounded-xl flex items-center justify-center font-black text-xs shadow-sm">
                              {team1?.teamName?.substring(0, 3).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-black text-brand-dark text-sm uppercase">{team1?.teamName}</p>
                              {isTeam1Batting && innings?.battingStats?.[0] && (
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                  {innings.battingStats[0].playerUsername} {innings.battingStats[0].runs}({innings.battingStats[0].ballsFaced})
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-brand-dark tracking-tighter">
                              {isTeam1Batting ? `${innings?.totalRunsScored || 0}/${innings?.totalWicketsTaken || 0}` : 'Yet to bat'}
                            </p>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-gray-50 mx-2" />

                        {/* Team 2 */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-brand-primary text-brand-dark rounded-xl flex items-center justify-center font-black text-xs shadow-sm">
                              {team2?.teamName?.substring(0, 3).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-black text-brand-dark text-sm uppercase">{team2?.teamName}</p>
                              {!isTeam1Batting && innings?.battingStats?.[0] && (
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                  {innings.battingStats[0].playerUsername} {innings.battingStats[0].runs}({innings.battingStats[0].ballsFaced})
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-brand-dark tracking-tighter">
                              {!isTeam1Batting ? `${innings?.totalRunsScored || 0}/${innings?.totalWicketsTaken || 0}` : 'Yet to bat'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-50 flex justify-end items-center">
                        <button 
                          onClick={() => navigate(`/scoring/${match.matchId}`)}
                          className="bg-brand-dark text-white text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-xl hover:bg-brand-dark/90 transition-colors shadow-lg shadow-brand-dark/20"
                        >
                          View Match
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Recent Results */}
          <section className="space-y-6">
            <h4 className="text-xl font-black tracking-tighter text-brand-dark uppercase">Recent Results</h4>
            
            <div className="space-y-6">
              {matches.filter(m => m.status === 'Finished').map(match => {
                const innings = match.inningsList?.[0];
                const team1 = match.squads?.[0];
                const team2 = match.squads?.[1];
                
                return (
                  <div key={match.matchId} className="bg-[#F8F9FA] rounded-2xl p-6 space-y-6 border border-gray-50">
                    <div className="flex justify-between items-center">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{new Date(match.dateAndTime).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Team 1 */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-brand-dark text-white rounded-xl flex items-center justify-center font-black text-[10px] shadow-sm">
                            {team1?.teamName?.substring(0, 3).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-black text-brand-dark uppercase">{team1?.teamName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-brand-dark tracking-tighter">
                            {innings?.battingTeamId === team1?.teamId ? `${innings?.totalRunsScored}/${innings?.totalWicketsTaken}` : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Team 2 */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-brand-primary text-brand-dark rounded-xl flex items-center justify-center font-black text-[10px] shadow-sm">
                            {team2?.teamName?.substring(0, 3).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-black text-brand-dark uppercase">{team2?.teamName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-brand-dark tracking-tighter">
                            {innings?.battingTeamId === team2?.teamId ? `${innings?.totalRunsScored}/${innings?.totalWicketsTaken}` : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-[#E8F5E9] py-2 px-4 rounded-xl text-center">
                        <p className="text-[10px] font-black text-[#2E7D32] uppercase tracking-widest">
                          {match.winningTeamName ? `${match.winningTeamName} WON` : 'FINISHED'}
                        </p>
                      </div>
                      {match.playerOfTheMatch && (
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center">MOM: {match.playerOfTheMatch}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
