import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Play, UserPlus, Shield, Zap, Target, Trophy, CheckCircle2, ChevronRight, User, Hash, Briefcase, MoreVertical, Plus, X, Trash2, Star, Copy, Share2, Coins, RotateCw } from 'lucide-react';
import api, { joinMatch } from '../services/api';
import { MatchDto, TossDto, InningsDto, MatchSquadDto } from '../types';
import LoadingBar from '../components/LoadingBar';

type Step = 'ENTER_CODE' | 'PLAYER_PROFILE' | 'SUCCESS' | 'TOSS' | 'COIN_FLIP' | 'INNINGS_SETUP' | 'FIRST_OVER_SETUP';

export default function JoinMatch() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if matchId was passed via state (e.g. from MatchCreated page)
  const initialMatchId = location.state?.matchId || '';
  
  const [step, setStep] = useState<Step>(initialMatchId ? 'PLAYER_PROFILE' : 'ENTER_CODE');
  const [matchId, setMatchId] = useState(initialMatchId);
  const [matchData, setMatchData] = useState<MatchDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddPlayer, setShowAddPlayer] = useState<{ teamId: string, teamName: string } | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  
  const [profile, setProfile] = useState({
    name: localStorage.getItem('username') || '',
    teamId: ''
  });

  const [selectedPlayer, setSelectedPlayer] = useState<{ name: string, teamId: string } | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  // Toss & Setup State
  const [tossWinner, setTossWinner] = useState('');
  const [tossDecision, setTossDecision] = useState<'BAT' | 'BOWL' | ''>('');
  const [coinFlipResult, setCoinFlipResult] = useState<'HEADS' | 'TAILS' | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [striker, setStriker] = useState('');
  const [nonStriker, setNonStriker] = useState('');
  const [bowler, setBowler] = useState('');

  useEffect(() => {
    if (initialMatchId) {
      fetchMatchData(initialMatchId);
    }
  }, [initialMatchId]);

  // Polling for match data when in SUCCESS step
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'SUCCESS' && matchId) {
      interval = setInterval(() => {
        fetchMatchData(matchId, true);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, matchId]);

  const fetchMatchData = async (id: string, isPolling = false) => {
    if (!isPolling) setLoading(true);
    setError('');
    try {
      const response = await api.get(`/api/Match/GetMatch/${id}`);
      if (response.data) {
        setMatchData(response.data);
        const currentStatus = response.data.status || response.data.Status;
        // If match becomes live, redirect to scoring/match view
        if (currentStatus === 'Live') {
          navigate(`/scoring/${id}`);
        }
      } else {
        if (!isPolling) {
          setError('Match not found. Please check the ID.');
          setStep('ENTER_CODE');
        }
      }
    } catch (err: any) {
      console.error('Error finding match', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('username');
        navigate('/login');
        return;
      }
      if (!isPolling) {
        setError('Invalid Match ID or network error.');
        setStep('ENTER_CODE');
      }
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  const handleAddPlayer = async () => {
    if (!newPlayerName || !matchData || !showAddPlayer) return;
    setLoading(true);
    try {
      const squads = matchData.squads || matchData.Squads;
      const updatedSquads = [...squads];
      const teamIndex = updatedSquads.findIndex(s => s.teamId === showAddPlayer.teamId || s.TeamId === showAddPlayer.teamId);
      if (teamIndex > -1) {
        const members = updatedSquads[teamIndex].squadMembers || updatedSquads[teamIndex].SquadMembers || [];
        updatedSquads[teamIndex].squadMembers = [...members, newPlayerName];
        
        await api.put('/api/Match/UpdateMatch', {
          ...matchData,
          squads: updatedSquads
        });
        
        await fetchMatchData(matchId);
        setNewPlayerName('');
        setShowAddPlayer(null);
      }
    } catch (err) {
      console.error('Error adding player', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartMatch = async () => {
    setStep('TOSS');
  };

  const handleFlipCoin = () => {
    setIsFlipping(true);
    setCoinFlipResult(null);
    setTimeout(() => {
      const result = Math.random() > 0.5 ? 'HEADS' : 'TAILS';
      setCoinFlipResult(result);
      setIsFlipping(false);
    }, 2000);
  };

  const handleSaveToss = async () => {
    if (!tossWinner || !tossDecision || !matchData) return;
    setLoading(true);
    try {
      const tossDetails: TossDto = {
        teamWhoWon: tossWinner,
        decision: tossDecision
      };

      const battingTeamId = tossDecision === 'BAT' ? tossWinner : matchData.squads?.find(s => s.teamId !== tossWinner)?.teamId;
      const bowlingTeamId = battingTeamId === matchData.squads?.[0].teamId ? matchData.squads?.[1].teamId : matchData.squads?.[0].teamId;

      const firstInnings: InningsDto = {
        matchId: matchId,
        inningsNo: 1,
        battingTeamId: battingTeamId,
        battingTeamName: matchData.squads?.find(s => s.teamId === battingTeamId)?.teamName,
        bowlingTeamId: bowlingTeamId,
        bowlingTeamName: matchData.squads?.find(s => s.teamId === bowlingTeamId)?.teamName,
        battingStats: [],
        bowlingStats: [],
        totalRunsScored: 0,
        totalWicketsTaken: 0,
        totalExtras: 0,
        overs: []
      };

      const updatedMatch = {
        ...matchData,
        tossDetails,
        inningsList: [firstInnings]
      };

      await api.put('/api/Match/UpdateMatch', updatedMatch);
      setMatchData(updatedMatch);
      setStep('FIRST_OVER_SETUP');
    } catch (err) {
      console.error('Error saving toss', err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateMatch = async () => {
    if (!striker || !nonStriker || !bowler || !matchData) return;
    setLoading(true);
    try {
      const currentInnings = matchData.inningsList?.[0];
      if (!currentInnings) return;

      const updatedInnings: InningsDto = {
        ...currentInnings,
        battingStats: [
          { playerUsername: striker, runs: 0, ballsFaced: 0, fours: 0, sixes: 0, strikeRate: 0, isOut: false },
          { playerUsername: nonStriker, runs: 0, ballsFaced: 0, fours: 0, sixes: 0, strikeRate: 0, isOut: false }
        ],
        bowlingStats: [
          { playerUsername: bowler, overs: 0, maidens: 0, runsConceded: 0, wickets: 0, economyRate: 0, extras: 0, legalBallsBowled: 0 }
        ]
      };

      const updatedMatch = {
        ...matchData,
        status: 'Live',
        inningsList: [updatedInnings]
      };

      await api.put('/api/Match/UpdateMatch', updatedMatch);
      
      navigate(`/scoring/${matchId}`);
    } catch (err) {
      console.error('Error activating match', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMakeCaptain = async () => {
    if (!selectedPlayer || !matchData) return;
    setLoading(true);
    try {
      const squads = matchData.squads || matchData.Squads;
      const updatedSquads = squads.map((s: any) => {
        if (s.teamId === selectedPlayer.teamId || s.TeamId === selectedPlayer.teamId) {
          return { ...s, captainUsername: selectedPlayer.name };
        }
        return s;
      });

      await api.put('/api/Match/UpdateMatch', {
        ...matchData,
        squads: updatedSquads
      });
      
      await fetchMatchData(matchId);
      setSelectedPlayer(null);
    } catch (err) {
      console.error('Error making captain', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePlayer = async () => {
    if (!selectedPlayer || !matchData) return;
    setLoading(true);
    try {
      await api.delete(`/api/Match/${matchId}/RemovePlayer/${selectedPlayer.name}`);
      await fetchMatchData(matchId);
      setSelectedPlayer(null);
    } catch (err) {
      console.error('Error removing player', err);
    } finally {
      setLoading(false);
    }
  };

  const startPress = (player: string, teamId: string) => {
    const timer = setTimeout(() => {
      setSelectedPlayer({ name: player, teamId });
    }, 600); // 600ms for long press
    setLongPressTimer(timer);
  };

  const endPress = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleFindMatch = async () => {
    if (matchId.length !== 8) {
      setError('Please enter a valid 8-character code');
      return;
    }
    await fetchMatchData(matchId);
    if (!error) setStep('PLAYER_PROFILE');
  };

  const handleJoinMatch = async () => {
    if (!profile.teamId) {
      setError('Please select a team assignment');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await joinMatch(matchId, profile.teamId, profile.name);
      setStep('SUCCESS');
    } catch (err: any) {
      console.error('Error joining match', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('username');
        navigate('/login');
        return;
      }
      setError(err.response?.data?.message || 'Failed to join match. Please try again.');
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

  if (step === 'SUCCESS') {
    const isAdmin = matchData?.adminUsername === localStorage.getItem('username');

    if (!isAdmin) {
      return (
        <div className="min-h-screen bg-[#F0F4F8] max-w-md mx-auto shadow-xl flex flex-col">
          {/* Header */}
          <div className="p-6 flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 text-brand-dark">
              <ArrowLeft size={24} />
            </button>
            <h2 className="text-lg font-black tracking-tight text-brand-dark uppercase">Join Match</h2>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-12">
            {/* Stadium Image Card */}
            <div className="relative w-full aspect-square max-w-[300px] bg-white rounded-[2.5rem] p-4 shadow-2xl">
              <div className="w-full h-full rounded-[2rem] overflow-hidden relative">
                <img 
                  src="https://picsum.photos/seed/cricket-stadium/600/600" 
                  className="w-full h-full object-cover brightness-50" 
                  alt="Stadium" 
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-[#D9F110] rounded-[2rem] flex items-center justify-center shadow-2xl">
                    <img src="https://api.dicebear.com/7.x/icons/svg?seed=cricket&backgroundColor=transparent" className="w-16 h-16" alt="Cricket Icon" />
                  </div>
                </div>
                
                {/* Badges */}
                <div className="absolute top-4 right-4 bg-white rounded-full px-4 py-1.5 flex items-center gap-2 shadow-lg transform rotate-3">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-brand-dark">Preparing Chart</span>
                </div>
                
                <div className="absolute bottom-4 left-4 bg-brand-dark/80 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2 shadow-lg">
                  <User size={12} className="text-brand-primary" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-white">
                    {((matchData?.squads?.[0]?.squadMembers?.length || 0) + (matchData?.squads?.[1]?.squadMembers?.length || 0))} Players Ready
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-black tracking-tighter text-brand-dark uppercase">You're all set!</h1>
              <div className="space-y-6">
                <p className="text-gray-500 text-lg font-medium leading-tight">
                  Waiting for the admin to start the match...
                </p>
                <p className="text-gray-400 text-sm leading-relaxed px-4">
                  Stay on this screen to join the live session automatically.
                </p>
              </div>
            </div>

            {/* Pagination Dots */}
            <div className="flex gap-2">
              <div className="w-8 h-1.5 bg-brand-primary rounded-full" />
              <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
              <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F8F9FA] max-w-md mx-auto shadow-xl flex flex-col relative">
        {/* Header */}
        <div className="p-6 flex justify-between items-center bg-white border-b border-gray-100">
          <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 text-brand-dark">
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
          {(matchData?.squads || []).map((squad: any, sIdx: number) => (
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
                  {(squad.squadMembers || []).length}/{matchData?.squadStrength || 11}
                </div>
              </div>

              {/* Player List */}
              <div className="p-4 space-y-2">
                {(squad.squadMembers || []).map((player: string, pIdx: number) => {
                  const isCaptain = squad.captainUsername === player;
                  return (
                    <div 
                      key={`${player}-${pIdx}`} 
                      onMouseDown={() => isAdmin && startPress(player, squad.teamId)}
                      onMouseUp={endPress}
                      onMouseLeave={endPress}
                      onTouchStart={() => isAdmin && startPress(player, squad.teamId)}
                      onTouchEnd={endPress}
                      className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors group cursor-pointer select-none"
                    >
                      <div className="relative">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 overflow-hidden">
                          <img 
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${player}`} 
                            alt={player}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                          <div className="w-2.5 h-2.5 bg-brand-primary rounded-full" />
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-brand-dark text-sm">{player}</h4>
                          {isCaptain && (
                            <div className="w-5 h-5 bg-brand-dark text-brand-primary rounded flex items-center justify-center text-[8px] font-black">C</div>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                          {isCaptain ? 'Captain' : 'Player'}
                        </p>
                      </div>
                      {isAdmin && <MoreVertical size={16} className="text-gray-300" />}
                    </div>
                  );
                })}

                {/* Add Player Button */}
                <button 
                  onClick={() => setShowAddPlayer({ teamId: squad.teamId, teamName: squad.teamName })}
                  className="w-full mt-4 py-4 border-2 border-dashed border-gray-100 rounded-2xl flex items-center justify-center gap-3 text-gray-400 hover:border-brand-primary hover:text-brand-primary hover:bg-brand-primary/5 transition-all group"
                >
                  <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Add Player</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Next Button */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 max-w-md mx-auto z-50">
          <button 
            onClick={handleStartMatch}
            disabled={loading || (matchData?.squads || []).some((s: any) => (s.squadMembers || []).length < (matchData?.squadStrength || 11))}
            className="w-full bg-brand-dark text-white rounded-2xl py-5 font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-dark/20 flex items-center justify-center gap-3 hover:bg-brand-dark/90 transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Next'} <ChevronRight size={20} className="text-brand-primary" />
          </button>
        </div>

        {/* Player Options Modal */}
        {selectedPlayer && (
          <div className="fixed inset-0 z-[120] flex items-end justify-center bg-brand-dark/60 backdrop-blur-md p-0">
            <div className="bg-white w-full max-md rounded-t-[2.5rem] p-8 space-y-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tighter text-brand-dark uppercase">Player Options</h3>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="w-12 h-12 bg-white rounded-xl overflow-hidden border border-gray-100">
                    <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedPlayer.name}`} alt="" />
                  </div>
                  <div>
                    <p className="font-black text-brand-dark">{selectedPlayer.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Selection</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={handleMakeCaptain}
                  className="w-full flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-dark">
                      <Star size={20} />
                    </div>
                    <span className="font-black text-brand-dark uppercase tracking-tight">Make Captain</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                </button>

                <button 
                  onClick={handleRemovePlayer}
                  className="w-full flex items-center justify-between p-5 bg-red-50 border border-red-100 rounded-2xl hover:bg-red-100 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-red-600">
                      <Trash2 size={20} />
                    </div>
                    <span className="font-black text-red-600 uppercase tracking-tight">Remove Player</span>
                  </div>
                </button>
              </div>

              <button 
                onClick={() => setSelectedPlayer(null)}
                className="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-brand-dark transition-colors"
              >
                Cancel Action
              </button>
            </div>
          </div>
        )}

        {/* Add Player Modal */}
        {showAddPlayer && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-brand-dark/60 backdrop-blur-md p-6">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 space-y-8 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tighter text-brand-dark">Add Player</h3>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Team: {showAddPlayer.teamName}</p>
              </div>

              <div className="space-y-4">
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
      </div>
    );
  }

  if (step === 'TOSS') {
    return (
      <div className="min-h-screen bg-[#F8F9FA] max-w-md mx-auto shadow-xl flex flex-col">
        <div className="p-6 flex items-center gap-4">
          <button onClick={() => setStep('SUCCESS')} className="p-2 -ml-2 text-brand-dark">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-lg font-black tracking-tight text-brand-dark uppercase">Match Toss</h2>
        </div>

        <div className="flex-1 p-8 flex flex-col items-center justify-center space-y-12">
          <div className="w-32 h-32 bg-brand-primary rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-brand-primary/20">
            <Coins size={48} className="text-brand-dark" />
          </div>

          <div className="text-center space-y-4">
            <h1 className="text-4xl font-black tracking-tighter text-brand-dark uppercase">Time for Toss</h1>
            <p className="text-gray-500 font-medium">Select how you want to decide the toss winner.</p>
          </div>

          <div className="w-full space-y-4">
            <button 
              onClick={() => setStep('COIN_FLIP')}
              className="w-full flex items-center justify-between p-6 bg-white rounded-3xl shadow-xl shadow-brand-dark/5 border border-gray-100 group hover:border-brand-primary transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-dark">
                  <RotateCw size={24} />
                </div>
                <div className="text-left">
                  <p className="font-black text-brand-dark uppercase">Flip a Coin</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Digital Randomizer</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-300 group-hover:text-brand-primary transition-colors" />
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
              <div className="relative flex justify-center"><span className="bg-[#F8F9FA] px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Or Manual Selection</span></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {matchData?.squads?.map((squad) => (
                <button
                  key={squad.teamId}
                  onClick={() => {
                    setTossWinner(squad.teamId);
                    setStep('INNINGS_SETUP');
                  }}
                  className="p-6 bg-white rounded-3xl shadow-xl shadow-brand-dark/5 border border-gray-100 flex flex-col items-center gap-4 hover:border-brand-primary transition-all"
                >
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-brand-dark">
                    <Shield size={24} />
                  </div>
                  <p className="font-black text-brand-dark text-xs uppercase text-center leading-tight">{squad.teamName}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'COIN_FLIP') {
    return (
      <div className="min-h-screen bg-brand-dark max-w-md mx-auto shadow-xl flex flex-col relative overflow-hidden">
        <div className="p-6 relative z-10">
          <button onClick={() => setStep('TOSS')} className="p-2 -ml-2 text-white">
            <ArrowLeft size={24} />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-12 relative z-10">
          <div className={`w-48 h-48 bg-brand-primary rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(217,241,16,0.3)] relative ${isFlipping ? 'animate-bounce' : ''}`}>
            <div className={`w-40 h-40 border-8 border-brand-dark/20 rounded-full flex items-center justify-center ${isFlipping ? 'animate-spin' : ''}`}>
              {coinFlipResult ? (
                <span className="text-4xl font-black text-brand-dark tracking-tighter">{coinFlipResult}</span>
              ) : (
                <Coins size={64} className="text-brand-dark" />
              )}
            </div>
          </div>

          <div className="text-center space-y-4">
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase">
              {isFlipping ? 'Flipping...' : coinFlipResult ? `It's ${coinFlipResult}!` : 'Ready to Flip?'}
            </h1>
            <p className="text-gray-400 font-medium">
              {coinFlipResult ? 'Now select the winner based on the result.' : 'Tap the button below to flip the coin.'}
            </p>
          </div>

          {coinFlipResult ? (
            <div className="w-full grid grid-cols-2 gap-4">
              {matchData?.squads?.map((squad) => (
                <button
                  key={squad.teamId}
                  onClick={() => {
                    setTossWinner(squad.teamId);
                    setStep('INNINGS_SETUP');
                  }}
                  className="p-6 bg-white/5 border-2 border-white/10 rounded-3xl flex flex-col items-center gap-4 hover:border-brand-primary transition-all"
                >
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-brand-primary">
                    <Trophy size={24} />
                  </div>
                  <p className="font-black text-white text-xs uppercase text-center leading-tight">{squad.teamName}</p>
                </button>
              ))}
            </div>
          ) : (
            <button 
              onClick={handleFlipCoin}
              disabled={isFlipping}
              className="w-full bg-brand-primary text-brand-dark rounded-2xl py-6 font-black uppercase tracking-[0.3em] shadow-2xl shadow-brand-primary/20 disabled:opacity-50"
            >
              Flip Coin
            </button>
          )}
        </div>
      </div>
    );
  }

  if (step === 'INNINGS_SETUP') {
    const winnerName = matchData?.squads?.find(s => s.teamId === tossWinner)?.teamName;
    return (
      <div className="min-h-screen bg-[#F8F9FA] max-w-md mx-auto shadow-xl flex flex-col">
        <div className="p-6 flex items-center gap-4">
          <button onClick={() => setStep('TOSS')} className="p-2 -ml-2 text-brand-dark">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-lg font-black tracking-tight text-brand-dark uppercase">Toss Decision</h2>
        </div>

        <div className="flex-1 p-8 space-y-12">
          <div className="bg-brand-dark rounded-[2.5rem] p-8 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trophy size={32} className="text-brand-dark" />
            </div>
            <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em]">Toss Winner</p>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">{winnerName}</h2>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-black text-brand-dark uppercase tracking-tight text-center">What's the decision?</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setTossDecision('BAT')}
                className={`p-8 rounded-[2.5rem] border-4 flex flex-col items-center gap-4 transition-all ${
                  tossDecision === 'BAT' ? 'bg-brand-primary/10 border-brand-primary' : 'bg-white border-transparent shadow-xl shadow-brand-dark/5'
                }`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${tossDecision === 'BAT' ? 'bg-brand-primary text-brand-dark' : 'bg-gray-50 text-gray-300'}`}>
                  <Zap size={32} />
                </div>
                <span className="font-black text-brand-dark uppercase tracking-widest">Batting</span>
              </button>

              <button
                onClick={() => setTossDecision('BOWL')}
                className={`p-8 rounded-[2.5rem] border-4 flex flex-col items-center gap-4 transition-all ${
                  tossDecision === 'BOWL' ? 'bg-brand-primary/10 border-brand-primary' : 'bg-white border-transparent shadow-xl shadow-brand-dark/5'
                }`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${tossDecision === 'BOWL' ? 'bg-brand-primary text-brand-dark' : 'bg-gray-50 text-gray-300'}`}>
                  <Target size={32} />
                </div>
                <span className="font-black text-brand-dark uppercase tracking-widest">Bowling</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <button 
            onClick={handleSaveToss}
            disabled={!tossDecision || loading}
            className="w-full bg-brand-dark text-white rounded-2xl py-6 font-black uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? 'Setting up...' : 'Confirm & Continue'} <ChevronRight size={20} className="text-brand-primary" />
          </button>
        </div>
      </div>
    );
  }

  if (step === 'FIRST_OVER_SETUP') {
    const currentInnings = matchData?.inningsList?.[0];
    const battingTeam = matchData?.squads?.find(s => s.teamId === currentInnings?.battingTeamId);
    const bowlingTeam = matchData?.squads?.find(s => s.teamId === currentInnings?.bowlingTeamId);

    return (
      <div className="min-h-screen bg-[#F8F9FA] max-w-md mx-auto shadow-xl flex flex-col">
        <LoadingBar loading={loading} />
        <div className="p-6 flex items-center gap-4">
          <button onClick={() => setStep('INNINGS_SETUP')} className="p-2 -ml-2 text-brand-dark">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-lg font-black tracking-tight text-brand-dark uppercase">First Over Setup</h2>
        </div>

        <div className="flex-1 p-6 space-y-8 overflow-y-auto pb-32">
          {/* Batting Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-dark rounded-lg flex items-center justify-center text-brand-primary">
                <Zap size={16} />
              </div>
              <h3 className="font-black text-brand-dark uppercase tracking-tight">Select Batters ({battingTeam?.teamName})</h3>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Striker</label>
                <select 
                  value={striker}
                  onChange={(e) => setStriker(e.target.value)}
                  className="w-full bg-white rounded-2xl px-5 py-4 font-black text-brand-dark border-2 border-transparent focus:border-brand-primary outline-none shadow-sm"
                >
                  <option value="">Select Striker</option>
                  {battingTeam?.squadMembers?.map(p => (
                    <option key={p} value={p} disabled={p === nonStriker}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Non-Striker</label>
                <select 
                  value={nonStriker}
                  onChange={(e) => setNonStriker(e.target.value)}
                  className="w-full bg-white rounded-2xl px-5 py-4 font-black text-brand-dark border-2 border-transparent focus:border-brand-primary outline-none shadow-sm"
                >
                  <option value="">Select Non-Striker</option>
                  {battingTeam?.squadMembers?.map(p => (
                    <option key={p} value={p} disabled={p === striker}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Bowling Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-dark rounded-lg flex items-center justify-center text-brand-primary">
                <Target size={16} />
              </div>
              <h3 className="font-black text-brand-dark uppercase tracking-tight">Select Bowler ({bowlingTeam?.teamName})</h3>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Opening Bowler</label>
              <select 
                value={bowler}
                onChange={(e) => setBowler(e.target.value)}
                className="w-full bg-white rounded-2xl px-5 py-4 font-black text-brand-dark border-2 border-transparent focus:border-brand-primary outline-none shadow-sm"
              >
                <option value="">Select Bowler</option>
                {bowlingTeam?.squadMembers?.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 max-w-md mx-auto">
          <button 
            onClick={handleActivateMatch}
            disabled={!striker || !nonStriker || !bowler || loading}
            className="w-full bg-brand-primary text-brand-dark rounded-2xl py-6 font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? 'Starting Match...' : 'Go Live'} <Play size={20} fill="currentColor" />
          </button>
        </div>
      </div>
    );
  }


  if (step === 'PLAYER_PROFILE') {
    return (
      <div className="min-h-screen bg-[#F8F9FA] max-w-md mx-auto shadow-xl flex flex-col">
        <LoadingBar loading={loading} />
        <div className="p-6 flex justify-between items-center">
          <button onClick={() => setStep('ENTER_CODE')} className="p-2 -ml-2 text-brand-dark">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-lg font-black tracking-tight text-brand-dark uppercase tracking-widest">Join Match</h2>
          <div className="w-10" />
        </div>

        <div className="flex-1 p-6 space-y-8 overflow-y-auto">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Step 02 / 03</p>
              <h1 className="text-4xl font-black tracking-tighter text-brand-dark uppercase">Player Profile</h1>
            </div>
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400">
              <UserPlus size={24} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary" size={18} />
                <div className="w-full bg-white rounded-xl pl-12 pr-4 py-4 text-brand-dark font-black border-2 border-transparent uppercase">
                  {profile.name}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Select Team Assignment</label>
              <div className="grid grid-cols-2 gap-4">
                {matchData?.squads?.map((squad: any) => (
                  <button
                    key={squad.teamId}
                    onClick={() => setProfile({...profile, teamId: squad.teamId})}
                    className={`p-6 rounded-2xl border-2 transition-all text-left space-y-4 ${
                      profile.teamId === squad.teamId 
                        ? 'bg-brand-primary/5 border-brand-primary shadow-lg shadow-brand-primary/10' 
                        : 'bg-white border-transparent shadow-sm'
                    }`}
                  >
                    <Shield size={24} className={profile.teamId === squad.teamId ? 'text-brand-dark' : 'text-gray-200'} />
                    <h4 className={`font-black uppercase tracking-tighter leading-tight ${profile.teamId === squad.teamId ? 'text-brand-dark' : 'text-gray-300'}`}>
                      {squad.teamName}
                    </h4>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border-t border-gray-100">
          {error && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mb-4 text-center">{error}</p>}
          <button 
            onClick={handleJoinMatch}
            disabled={loading}
            className="btn-primary uppercase tracking-widest text-sm py-5 flex items-center justify-center gap-3"
          >
            {loading ? 'Joining...' : 'Join Match'} <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark max-w-md mx-auto shadow-xl flex flex-col relative overflow-hidden">
      <LoadingBar loading={loading} />
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/10 rounded-full -mr-48 -mt-48 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-primary/10 rounded-full -ml-48 -mb-48 blur-3xl" />

      <div className="p-6 relative">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white">
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="flex-1 p-8 flex flex-col justify-center space-y-12 relative">
        <div className="text-center space-y-4">
          <div className="inline-block px-4 py-1.5 bg-brand-primary/20 rounded-full">
            <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">Live Session</p>
          </div>
          <h1 className="text-6xl font-black tracking-tighter text-white leading-[0.85]">
            JOIN THE<br/>
            <span className="text-brand-primary">ARENA</span>
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed px-8">
            Enter your unique access code to sync with the match.
          </p>
        </div>

        <div className="space-y-6">
          <div className="relative">
            <div className="absolute -top-3 left-6 px-2 bg-brand-dark z-10">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Match Access Code</label>
            </div>
            <div className="bg-white/5 border-2 border-white/10 rounded-3xl p-8 flex justify-between gap-2">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="flex-1 aspect-[2/3] bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
                  <span className="text-4xl font-black text-white/10 font-mono">
                    {matchId[idx] || '0'}
                  </span>
                </div>
              ))}
              <input 
                type="text" 
                maxLength={8}
                className="absolute inset-0 opacity-0 cursor-pointer"
                value={matchId}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  setMatchId(val);
                }}
                autoFocus
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest text-center">{error}</p>}
        </div>
      </div>

      <div className="p-8 relative">
        <button 
          onClick={handleFindMatch}
          disabled={loading || matchId.length !== 8}
          className="w-full bg-brand-dark border-2 border-white/10 text-white rounded-2xl py-6 font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-white/5 transition-all disabled:opacity-30"
        >
          {loading ? 'Searching...' : 'Next'} <ChevronRight size={20} className="text-brand-primary" />
        </button>
        <p className="text-center mt-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          Don't have a code? <button className="text-white underline">Ask the Scorer</button>
        </p>
      </div>
    </div>
  );
}
