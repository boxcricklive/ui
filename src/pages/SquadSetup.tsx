import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, UserPlus, Play, CheckCircle2, User, Trash2, Star, Shield, ChevronRight, Copy, Share2 } from 'lucide-react';
import api from '../services/api';
import LoadingBar from '../components/LoadingBar';

export default function SquadSetup() {
  const { matchId } = useParams();
  const [match, setMatch] = useState<any>(null);
  const [showAddPlayer, setShowAddPlayer] = useState<{ teamId: string, teamName: string } | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMatch();
    
    // Polling for match data every 5 seconds
    const interval = setInterval(() => {
      fetchMatch(true);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [matchId]);

  const [showOptions, setShowOptions] = useState<{ player: string, teamId: string } | null>(null);

  const fetchMatch = async (isPolling = false) => {
    try {
      const res = await api.get(`/api/Match/GetMatch/${matchId}`);
      setMatch(res.data);
    } catch (err: any) {
      console.error('Error fetching match', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('username');
        navigate('/login');
      }
    }
  };

  const handleAddPlayer = async () => {
    if (!newPlayerName || !match || !showAddPlayer) return;
    
    const teamIndex = match.squads.findIndex((s: any) => s.teamId === showAddPlayer.teamId);
    if (teamIndex > -1) {
      const currentSquadCount = match.squads[teamIndex].squadMembers.length;
      const squadStrength = match.squadStrength || 11;
      
      if (currentSquadCount >= squadStrength) {
        setError(`Cannot add more than ${squadStrength} players to this squad.`);
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const updatedSquads = [...match.squads];
      const teamIndex = updatedSquads.findIndex((s: any) => s.teamId === showAddPlayer.teamId);
      if (teamIndex > -1) {
        updatedSquads[teamIndex].squadMembers.push(newPlayerName);
        
        await api.post('/api/Match/UpdateMatchSquad', {
          matchId: matchId,
          squads: updatedSquads
        });
        
        await fetchMatch();
        setNewPlayerName('');
        setShowAddPlayer(null);
      }
    } catch (err: any) {
      console.error('Error adding player', err);
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

  const handleRemovePlayer = async (playerName: string, teamId: string) => {
    if (!match) return;
    setLoading(true);
    try {
      const updatedSquads = [...match.squads];
      const teamIndex = updatedSquads.findIndex(s => s.teamId === teamId);
      if (teamIndex > -1) {
        updatedSquads[teamIndex].squadMembers = updatedSquads[teamIndex].squadMembers.filter((p: string) => p !== playerName);
        
        await api.post('/api/Match/UpdateMatchSquad', {
          matchId: matchId,
          squads: updatedSquads
        });

        await fetchMatch();
        setShowOptions(null);
      }
    } catch (err: any) {
      console.error('Error removing player', err);
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

  const handleStartMatch = async () => {
    setLoading(true);
    try {
      await api.put('/api/Match/UpdateMatch', {
        ...match,
        status: 'Live'
      });
      navigate(`/scoring/${matchId}`);
    } catch (err: any) {
      console.error('Error starting match', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('username');
        navigate('/login');
        return;
      }
      navigate(`/scoring/${matchId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (matchId) {
      navigator.clipboard.writeText(matchId);
      alert('Match ID copied!');
    }
  };

  if (!match) return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] max-w-md mx-auto shadow-xl flex flex-col relative">
      <LoadingBar loading={loading} />
      {/* Header */}
      <div className="p-6 flex justify-between items-center bg-white border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-brand-dark">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-black tracking-tight text-brand-dark uppercase tracking-widest">Match Setup</h2>
        <button className="p-2 -mr-2 text-brand-dark">
          <MoreVertical size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
        {/* Match ID Section */}
        <div className="bg-brand-dark rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <p className="text-[8px] font-black text-brand-primary uppercase tracking-[0.2em]">Match Access Code</p>
            <p className="text-xl font-black text-white font-mono tracking-wider">{matchId}</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleCopy}
              className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-all"
            >
              <Copy size={18} />
            </button>
            <button className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-all">
              <Share2 size={18} />
            </button>
          </div>
        </div>

        {/* Title Section */}
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tighter text-brand-dark uppercase">Players Joined</h1>
          <p className="text-gray-400 text-sm leading-relaxed font-medium">
            Review squad selections and team balance before coin toss.
          </p>
        </div>

        {/* Squad Cards */}
        {match.squads.map((squad: any, sIdx: number) => (
          <div key={squad.teamId} className="bg-white rounded-2xl shadow-xl shadow-brand-dark/5 overflow-hidden border border-gray-100">
            {/* Squad Header */}
            <div className="bg-brand-dark p-6 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  {sIdx === 0 ? 'Squad Alpha' : 'Squad Beta'}
                </p>
                <h3 className="text-xl font-black text-white tracking-tight">{squad.teamName}</h3>
              </div>
              <div className="bg-brand-primary text-brand-dark px-3 py-1.5 rounded-full text-[10px] font-black">
                {squad.squadMembers.length}/{match.squadStrength || 11}
              </div>
            </div>

            {/* Player List */}
            <div className="p-4 space-y-2">
              {squad.squadMembers.map((player: string, pIdx: number) => (
                <div 
                  key={`${player}-${pIdx}`} 
                  className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => setShowOptions({ player, teamId: squad.teamId })}
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                      <User size={24} />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <div className="w-2.5 h-2.5 bg-brand-primary rounded-full" />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-brand-dark text-sm">{player}</h4>
                      {pIdx === 0 && (
                        <div className="w-5 h-5 bg-brand-dark text-brand-primary rounded flex items-center justify-center text-[8px] font-black">C</div>
                      )}
                      {pIdx === 1 && (
                        <div className="px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded text-[8px] font-black uppercase tracking-widest">WK</div>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      {pIdx === 0 ? 'Captain' : pIdx === 1 ? 'Wicket Keeper' : 'Player'}
                    </p>
                  </div>
                </div>
              ))}

              {/* Add Player Button */}
              {squad.squadMembers.length < (match.squadStrength || 11) ? (
                <button 
                  onClick={() => {
                    setError(null);
                    setShowAddPlayer({ teamId: squad.teamId, teamName: squad.teamName });
                  }}
                  className="w-full mt-4 py-4 border-2 border-dashed border-gray-100 rounded-2xl flex items-center justify-center gap-3 text-gray-400 hover:border-brand-primary hover:text-brand-primary hover:bg-brand-primary/5 transition-all group"
                >
                  <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Add Player</span>
                </button>
              ) : (
                <div className="w-full mt-4 py-4 border-2 border-dashed border-gray-100 rounded-2xl flex items-center justify-center gap-3 text-gray-300 bg-gray-50/50 cursor-not-allowed">
                  <CheckCircle2 size={18} className="text-brand-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Squad Full</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Next Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 max-w-md mx-auto z-50">
        <button 
          onClick={handleStartMatch}
          disabled={match.squads.some((s: any) => s.squadMembers.length === 0)}
          className="w-full bg-brand-dark text-white rounded-2xl py-5 font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-dark/20 flex items-center justify-center gap-3 hover:bg-brand-dark/90 transition-all disabled:opacity-50"
        >
          Next <ChevronRight size={20} className="text-brand-primary" />
        </button>
      </div>

      {/* Add Player Modal */}
      {showAddPlayer && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-brand-dark/60 backdrop-blur-md p-6">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 space-y-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="space-y-2">
              <h3 className="text-2xl font-black tracking-tighter text-brand-dark">Add Player</h3>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Team: {showAddPlayer.teamName}</p>
            </div>

            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100 animate-in fade-in slide-in-from-top-1 duration-200">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Player Name</label>
                <input 
                  type="text" 
                  placeholder="Enter name or username" 
                  className="w-full bg-[#F1F3F5] rounded-2xl px-5 py-4 text-brand-dark font-black focus:ring-2 focus:ring-brand-primary outline-none transition-all uppercase"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value.toUpperCase())}
                  autoFocus
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowAddPlayer(null)}
                  className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-dark transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddPlayer}
                  disabled={!newPlayerName || loading}
                  className="flex-[2] bg-brand-dark text-white rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest hover:bg-brand-dark/90 transition-all disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add to Squad'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Player Options Bottom Sheet */}
      {showOptions && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-brand-dark/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-t-[3rem] p-10 space-y-10 animate-in slide-in-from-bottom duration-300 shadow-2xl">
            <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto -mt-4 mb-4" />
            
            <div className="flex items-center gap-5 p-5 bg-[#F8F9FA] rounded-[2rem] border border-gray-100">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-brand-dark font-black text-2xl shadow-sm border border-gray-100">
                {showOptions.player.substring(0, 1).toUpperCase()}
              </div>
              <div>
                <h4 className="text-xl font-black text-brand-dark tracking-tight">{showOptions.player}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Squad Member Options</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button className="flex items-center justify-between p-5 bg-gray-50 hover:bg-brand-primary/10 rounded-2xl transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-dark shadow-sm group-hover:bg-brand-primary group-hover:text-brand-dark transition-colors">
                    <Star size={20} />
                  </div>
                  <span className="text-xs font-black text-brand-dark uppercase tracking-widest">Make Captain</span>
                </div>
                <Play size={14} className="text-gray-300 group-hover:text-brand-dark" />
              </button>

              <button className="flex items-center justify-between p-5 bg-gray-50 hover:bg-brand-primary/10 rounded-2xl transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-dark shadow-sm group-hover:bg-brand-primary group-hover:text-brand-dark transition-colors">
                    <Shield size={20} />
                  </div>
                  <span className="text-xs font-black text-brand-dark uppercase tracking-widest">Make Wicketkeeper</span>
                </div>
                <Play size={14} className="text-gray-300 group-hover:text-brand-dark" />
              </button>

              <button 
                onClick={() => handleRemovePlayer(showOptions.player, showOptions.teamId)}
                className="flex items-center justify-between p-5 bg-red-50 hover:bg-red-100 rounded-2xl transition-all group mt-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-500 shadow-sm group-hover:bg-red-500 group-hover:text-white transition-colors">
                    <Trash2 size={20} />
                  </div>
                  <span className="text-xs font-black text-red-600 uppercase tracking-widest">Remove Player</span>
                </div>
              </button>
            </div>

            <button 
              onClick={() => setShowOptions(null)}
              className="w-full py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-brand-dark transition-colors"
            >
              Close Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
