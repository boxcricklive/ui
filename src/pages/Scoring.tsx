import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, Undo2, PlusCircle, Send, Copy, Zap } from 'lucide-react';
import api from '../services/api';
import LoadingBar from '../components/LoadingBar';

export default function Scoring() {
  const { matchId } = useParams();
  const [match, setMatch] = useState<any>(null);
  const [selectedRuns, setSelectedRuns] = useState<number | 'W' | null>(null);
  const [extraType, setExtraType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [commentary, setCommentary] = useState<any[]>([]);
  
  // Innings Setup State
  const [showInningsSetupModal, setShowInningsSetupModal] = useState(false);
  const [setupStriker, setSetupStriker] = useState('');
  const [setupNonStriker, setSetupNonStriker] = useState('');
  const [setupBowler, setSetupBowler] = useState('');

  // Wicket Flow State
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [wicketType, setWicketType] = useState<string>('Bowled');
  const [dismissedUsername, setDismissedUsername] = useState<string>('');
  const [newBatterUsername, setNewBatterUsername] = useState<string>('');
  const [strikeAfterWicket, setStrikeAfterWicket] = useState<'incoming' | 'non-striker'>('incoming');

  // Bowler Selection State
  const [showBowlerModal, setShowBowlerModal] = useState(false);
  const [selectedBowler, setSelectedBowler] = useState<string>('');

  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  const fetchMatch = async (isPolling = false) => {
    try {
      const res = await api.get(`/api/Match/GetMatch/${matchId}`);
      const matchData = res.data;
      
      // Cleanup invalid overs from the data
      if (matchData.inningsList) {
        matchData.inningsList.forEach((innings: any) => {
          if (innings.overs) {
            innings.overs = innings.overs.filter((o: any) => 
              o.overNo > 0 && o.matchId !== null && o.inningsNo !== null
            );
          }
        });
      }

      setMatch(matchData);
      
      // If match is live and no innings started yet, or if we need to start 2nd innings
      const currentInnings = matchData.inningsList?.[matchData.inningsList.length - 1];
      const isFirstInnings = matchData.inningsList?.length === 1;
      const squadSize = matchData.squads[0].squadMembers.length;
      
      const isInningsOver = currentInnings && (
        currentInnings.totalWicketsTaken >= squadSize - 1 || 
        (currentInnings.bowlingStats?.reduce((acc: number, b: any) => acc + (b.legalBallsBowled || 0), 0) >= matchData.totalOvers * 6)
      );

      if (matchData.adminUsername === username && matchData.matchStatus === 'Live' && !isPolling) {
        if (!currentInnings || (isInningsOver && matchData.inningsList.length < 2)) {
          setShowInningsSetupModal(true);
        } else if (!matchData.currentBowlerUsername && !isInningsOver) {
          setShowBowlerModal(true);
        }
      }

      // Fetch commentary for ball-by-ball updates
      const commRes = await api.get(`/api/Match/${matchId}/commentary?pageSize=12`);
      if (commRes.data && Array.isArray(commRes.data)) {
        setCommentary(commRes.data);
      }
      
      if (!isPolling) setLoading(false);
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

  useEffect(() => {
    fetchMatch();
    const interval = setInterval(() => fetchMatch(true), 5000);
    return () => clearInterval(interval);
  }, [matchId]);

  if (loading || !match) return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-8 text-center space-y-8">
      <div className="w-20 h-20 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Syncing Arena...</h2>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Fetching live match analytics</p>
      </div>
    </div>
  );

  const isAdmin = match.adminUsername === username;
  const currentInnings = match.inningsList?.[match.inningsList.length - 1];
  
  // Identify striker and non-striker from battingStats
  const activeBatters = currentInnings?.battingStats?.filter((s: any) => !s.isOut) || [];
  const striker = activeBatters.find((s: any) => s.isStriker)?.playerUsername || activeBatters[0]?.playerUsername;
  const nonStriker = activeBatters.find((s: any) => !s.isStriker && s.playerUsername !== striker)?.playerUsername || activeBatters[1]?.playerUsername;

  const totalBalls = currentInnings?.bowlingStats?.reduce((acc: number, b: any) => acc + (b.legalBallsBowled || 0), 0) || 0;
  const displayOvers = Math.floor(totalBalls / 6);
  const ballsInOver = totalBalls % 6;
  const overDisplay = `${displayOvers}.${ballsInOver}`;
  const currentOverNo = Math.floor(totalBalls / 6) + 1;
  const totalRuns = currentInnings?.totalRunsScored || 0;
  const target = match.inningsList?.length === 2 ? (match.inningsList[0].totalRunsScored + 1) : null;
  const runRate = totalBalls > 0 ? (totalRuns / (totalBalls / 6)).toFixed(2) : '0.00';
  const squadSize = match.squads[0].squadMembers.length;
  const isInningsOver = currentInnings && (
    currentInnings.totalWicketsTaken >= squadSize - 1 || 
    (totalBalls >= match.totalOvers * 6)
  );

  const generateCommentary = (runs: number | 'W', extra: string | null) => {
    if (runs === 'W') return "OUT! What a clinical dismissal!";
    if (extra === 'WD') return "Wayward delivery, it's a Wide!";
    if (extra === 'NB') return "Front foot over the line, No Ball!";
    if (runs === 6) return "BOOM! That's out of the park! SIX!";
    if (runs === 4) return "CRACKED! Boundary to the ropes!";
    if (runs === 0) return "Solid defense, no run.";
    return `${runs} run${runs > 1 ? 's' : ''} taken.`;
  };

  const handleStartInnings = async () => {
    if (!setupStriker || !setupNonStriker || !setupBowler || !matchId) return;
    setIsUpdating(true);
    try {
      const isSecondInnings = match.inningsList?.length === 1 && isInningsOver;
      const nextInningsNo = isSecondInnings ? 2 : 1;
      
      // Determine teams
      const battingTeamId = isSecondInnings ? match.inningsList[0].bowlingTeamId : match.squads[0].teamId;
      const bowlingTeamId = isSecondInnings ? match.inningsList[0].battingTeamId : match.squads[1].teamId;

      const newInnings = {
        matchId: matchId,
        inningsNo: nextInningsNo,
        battingTeamId: battingTeamId,
        bowlingTeamId: bowlingTeamId,
        totalRunsScored: 0,
        totalWicketsTaken: 0,
        battingStats: [
          { playerUsername: setupStriker, runs: 0, ballsFaced: 0, fours: 0, sixes: 0, isOut: false, isStriker: true },
          { playerUsername: setupNonStriker, runs: 0, ballsFaced: 0, fours: 0, sixes: 0, isOut: false, isStriker: false }
        ],
        bowlingStats: [
          { playerUsername: setupBowler, oversBowled: 0, legalBallsBowled: 0, runsConceded: 0, wicketsTaken: 0, maidens: 0 }
        ],
        overs: []
      };

      const updatedInningsList = isSecondInnings ? [...match.inningsList, newInnings] : [newInnings];

      await api.put('/api/Match/UpdateMatch', {
        ...match,
        matchId: matchId,
        inningsList: updatedInningsList,
        currentBowlerUsername: setupBowler,
        matchStatus: 'Live'
      });

      await fetchMatch(true);
      setShowInningsSetupModal(false);
    } catch (err) {
      console.error('Error starting innings', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateScore = async () => {
    if (selectedRuns === null && extraType === null) return;
    if (!isAdmin || !currentInnings || !matchId) return;
    
    // If it's a wicket and we haven't collected wicket details yet
    if (selectedRuns === 'W' && !showWicketModal && !dismissedUsername) {
      const activeBatters = currentInnings.battingStats?.filter((s: any) => !s.isOut) || [];
      setDismissedUsername(activeBatters[0]?.playerUsername || '');
      setShowWicketModal(true);
      return;
    }

    setIsUpdating(true);
    try {
      const activeBatters = currentInnings.battingStats?.filter((s: any) => !s.isOut) || [];
      const striker = activeBatters[0]?.playerUsername;
      const nonStriker = activeBatters[1]?.playerUsername;
      const currentBowler = match.currentBowlerUsername || currentInnings.bowlingStats?.[currentInnings.bowlingStats.length - 1]?.playerUsername;
      const inningsNo = currentInnings.inningsNo || 1;

      const isWicket = selectedRuns === 'W';
      const runsOffBat = typeof selectedRuns === 'number' ? selectedRuns : 0;
      const extraRuns = extraType ? 1 : 0;

      // Determine if strike rotates
      // Odd runs (1, 3) off bat rotate strike
      // Wicket might rotate strike depending on strikeAfterWicket
      const rotateStrike = (runsOffBat % 2 !== 0);

      await api.post('/api/Match/push-ball', {
        matchId: matchId, 
        inningsNo: inningsNo,
        over: {
          matchId: matchId,
          inningsNo: inningsNo,
          overNo: currentOverNo,
          bowlerUsername: currentBowler,
          runsScored: 0 
        },
        ballNo: ballsInOver + 1,
        teamBattingId: currentInnings.battingTeamId,
        strikerUsername: striker,
        nonStrikerUsername: nonStriker,
        bowlerUsername: currentBowler,
        runsOffBat: runsOffBat,
        isWide: extraType === 'WD',
        isNoBall: extraType === 'NB',
        isBye: extraType === 'B',
        isLegBye: extraType === 'LB',
        extraRuns: extraRuns,
        isWicket: isWicket,
        wicketType: isWicket ? wicketType : null,
        dismissedUsername: isWicket ? dismissedUsername : null,
        incomingBatterUsername: isWicket ? newBatterUsername : null,
        strikeAfterWicket: isWicket ? strikeAfterWicket : null,
        customCommentary: generateCommentary(selectedRuns, extraType)
      });

      // If strike rotates, we might need to swap them in local state or wait for fetch
      // But the API call is done.
      
      await fetchMatch(true);
      setSelectedRuns(null);
      setExtraType(null);
      setDismissedUsername('');
      setNewBatterUsername('');
      setShowWicketModal(false);

      // Check if over completed
      const updatedMatch = await api.get(`/api/Match/GetMatch/${matchId}`);
      const updatedInnings = updatedMatch.data.inningsList?.[updatedMatch.data.inningsList.length - 1];
      const updatedTotalBalls = updatedInnings?.bowlingStats?.reduce((acc: number, b: any) => acc + (b.legalBallsBowled || 0), 0) || 0;
      if (updatedTotalBalls > 0 && updatedTotalBalls % 6 === 0) {
        setShowBowlerModal(true);
      }
    } catch (err: any) {
      console.error('Error updating score', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSelectBowler = async () => {
    if (!selectedBowler || !matchId) return;
    setIsUpdating(true);
    try {
      // Initialize the over object for the new over
      const updatedInningsList = [...(match.inningsList || [])];
      if (updatedInningsList.length > 0) {
        const currentInningsIdx = updatedInningsList.length - 1;
        const currentInnings = { ...updatedInningsList[currentInningsIdx] };
        const inningsNo = currentInnings.inningsNo || 1;
        
        const newOver = {
          matchId: matchId, 
          inningsNo: inningsNo,
          overNo: currentOverNo,
          bowlerUsername: selectedBowler,
          runsScored: 0
        };
        
        if (!currentInnings.overs) currentInnings.overs = [];
        
        // Cleanup: Remove any invalid overs (overNo 0 or null values)
        currentInnings.overs = currentInnings.overs.filter((o: any) => 
          o.overNo > 0 && o.matchId !== null && o.inningsNo !== null
        );

        // Check if over already exists to avoid duplicates
        const existingOverIdx = currentInnings.overs.findIndex((o: any) => o.overNo === currentOverNo);
        if (existingOverIdx > -1) {
          currentInnings.overs[existingOverIdx] = newOver;
        } else {
          currentInnings.overs.push(newOver);
        }
        updatedInningsList[currentInningsIdx] = currentInnings;
      }

      await api.put('/api/Match/UpdateMatch', {
        ...match,
        matchId: matchId, // Ensure matchId is present at root
        inningsList: updatedInningsList,
        currentBowlerUsername: selectedBowler
      });
      await fetchMatch(true);
      setShowBowlerModal(false);
    } catch (err) {
      console.error('Error selecting bowler', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUndo = async () => {
    if (!matchId) return;
    setIsUpdating(true);
    try {
      // Find the last ball details to undo
      const lastBall = commentary[0];
      if (lastBall) {
        await api.post('/api/Match/undo-ball', { 
          matchId: matchId, // Use matchId from useParams directly
          inningsNo: lastBall.inningsNo,
          overNumber: lastBall.overNumber,
          ballNumber: lastBall.ballNumber
        });
      }
      await fetchMatch(true);
    } catch (err: any) {
      console.error('Error undoing last ball', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('username');
        navigate('/login');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] max-w-md mx-auto shadow-xl flex flex-col">
      <LoadingBar loading={loading || isUpdating} />
      {/* Header */}
      <div className="bg-brand-dark p-6 flex justify-between items-center text-white">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-black tracking-tight uppercase">Match Center</h2>
        <button className="p-2 -mr-2">
          <MoreVertical size={24} />
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Score Display */}
        <div className="bg-brand-dark p-8 pt-0 text-center space-y-6">
          <div className="flex justify-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Match ID:</span>
              <span className="text-[10px] font-black text-white uppercase tracking-widest">{matchId}</span>
              <Copy size={12} className="text-gray-400 cursor-pointer" onClick={() => {
                navigator.clipboard.writeText(matchId || '');
                alert('Match ID copied!');
              }} />
            </div>
            {!isAdmin && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/20 rounded-full">
                <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">View Only</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center text-white">
            <div className="text-left">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Batting</p>
              <p className="text-sm font-black">{currentInnings?.battingTeamId === match.squads[0].teamId ? match.squads[0].teamName : match.squads[1].teamName}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bowling</p>
              <p className="text-sm font-black">{currentInnings?.bowlingTeamId === match.squads[1].teamId ? match.squads[1].teamName : match.squads[0].teamName}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-7xl font-black text-brand-primary tracking-tighter">
              {currentInnings?.totalRunsScored || 0} <span className="text-white/40">/</span> {currentInnings?.totalWicketsTaken || 0}
            </h1>
            <div className="flex justify-center gap-8">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Overs</p>
                <p className="text-xl font-black text-white">{overDisplay} <span className="text-white/40">/</span> {match.totalOvers}</p>
              </div>
              {target && (
                <div>
                  <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">Target</p>
                  <p className="text-xl font-black text-white">{target}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Run Rate</p>
                <p className="text-xl font-black text-white">{runRate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Players */}
        <div className="bg-brand-dark/95 p-6 border-t border-white/5 flex justify-between items-center text-white">
          <div className="space-y-3">
            {striker && (
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 bg-brand-primary rounded-full" />
                <p className="text-sm font-black">{striker}</p>
                <p className="text-xs font-black text-brand-primary">
                  {currentInnings.battingStats.find((s: any) => s.playerUsername === striker)?.runs} 
                  <span className="text-[10px] text-gray-400 font-normal">({currentInnings.battingStats.find((s: any) => s.playerUsername === striker)?.ballsFaced})</span>
                </p>
              </div>
            )}
            {nonStriker && (
              <div className="flex items-center gap-2 opacity-60">
                <span className="w-1.5 h-4 bg-transparent rounded-full" />
                <p className="text-sm font-black">{nonStriker}</p>
                <p className="text-xs font-black text-brand-primary">
                  {currentInnings.battingStats.find((s: any) => s.playerUsername === nonStriker)?.runs} 
                  <span className="text-[10px] text-gray-400 font-normal">({currentInnings.battingStats.find((s: any) => s.playerUsername === nonStriker)?.ballsFaced})</span>
                </p>
              </div>
            )}
            {!striker && !nonStriker && (
              <p className="text-xs text-gray-400 italic">No active batters</p>
            )}
          </div>

          <div className="text-right space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bowling</p>
            {currentInnings?.bowlingStats?.length > 0 ? (
              <>
                <p className="text-sm font-black">{match.currentBowlerUsername || currentInnings.bowlingStats[currentInnings.bowlingStats.length - 1].playerUsername}</p>
                <div className="flex gap-1 justify-end flex-wrap max-w-[150px]">
                  {/* Showing all balls of the current over */}
                  {commentary
                    .filter(c => c.overNumber === currentOverNo)
                    .sort((a, b) => a.ballNumber - b.ballNumber || a.id - b.id) // Sort by ball number, then id for extras
                    .map((ball, i) => {
                      let display = '';
                      let color = 'border-white/10';
                      if (ball.isWicket) {
                        display = 'W';
                        color = 'bg-red-500 border-red-500 text-white';
                      } else if (ball.isWide) {
                        display = `${ball.extraRuns}WD`;
                        color = 'bg-brand-primary text-brand-dark border-brand-primary';
                      } else if (ball.isNoBall) {
                        display = `${ball.runsOffBat + ball.extraRuns}NB`;
                        color = 'bg-brand-primary text-brand-dark border-brand-primary';
                      } else {
                        display = ball.runsOffBat.toString();
                        if (ball.runsOffBat >= 4) color = 'bg-brand-primary text-brand-dark border-brand-primary';
                        if (ball.runsOffBat === 0) color = 'border-white/20 text-white/40';
                      }
                      return (
                        <div key={ball.id || i} className={`w-7 h-7 rounded-full border ${color} flex items-center justify-center text-[9px] font-black transition-all shadow-sm`}>
                          {display}
                        </div>
                      );
                    })}
                  {/* Placeholder circles for remaining legal balls */}
                  {Array.from({ length: Math.max(0, 6 - (commentary.filter(c => c.overNumber === currentOverNo && !c.isWide && !c.isNoBall).length)) }).map((_, i) => (
                    <div key={`empty-${i}`} className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center text-[9px] font-black text-white/10">
                      •
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-gray-400 italic">No active bowler</p>
            )}
          </div>
        </div>

        {/* Scoring Controls */}
        {isAdmin ? (
          <div className="flex-1 bg-white p-6 space-y-8">
            {isInningsOver ? (
              <div className="flex flex-col items-center justify-center h-full space-y-6 py-12">
                <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center">
                  <Zap size={40} className="text-brand-primary" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tighter">Innings Completed</h3>
                  <p className="text-gray-400 text-sm font-medium">All wickets down or overs completed.</p>
                </div>
                {match.inningsList?.length < 2 && (
                  <button 
                    onClick={() => setShowInningsSetupModal(true)}
                    className="w-full bg-brand-dark text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl"
                  >
                    Start Next Innings
                  </button>
                )}
                {match.inningsList?.length === 2 && (
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="w-full bg-brand-dark text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl"
                  >
                    Match Finished - View Results
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="bg-[#F8F9FA] p-4 rounded-2xl flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-dark">This Ball</span>
                  <div className="bg-white px-4 py-2 rounded-lg border border-gray-100 text-xs font-black text-brand-dark">
                    {extraType ? `${extraType} + ` : ''}{selectedRuns !== null ? selectedRuns : 'Select Runs'}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {['NB', 'B', 'LB', 'WD'].map((type) => (
                    <button 
                      key={type}
                      onClick={() => setExtraType(extraType === type ? null : type)}
                      className={`p-4 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${extraType === type ? 'bg-brand-dark text-white' : 'bg-gray-50 text-brand-dark hover:bg-gray-100'}`}
                    >
                      <span className="text-sm font-black">{type}</span>
                      <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">{type === 'NB' ? 'No Ball' : type === 'B' ? 'Bye' : type === 'LB' ? 'Leg Bye' : 'Wide'}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {[0, 1, 2, 'W', 3, 4, 6].map((run) => (
                    <button 
                      key={run}
                      onClick={() => setSelectedRuns(run as any)}
                      className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${run === 'W' ? 'bg-red-50 text-red-600 border-2 border-red-100' : selectedRuns === run ? 'bg-brand-dark text-white' : 'bg-white border border-gray-100 text-brand-dark hover:bg-gray-50 shadow-sm'}`}
                    >
                      {run === 'W' ? (
                        <>
                          <img src="https://api.dicebear.com/7.x/icons/svg?seed=wicket" className="w-6 h-6" alt="Wicket" />
                          <span className="text-xl font-black">W</span>
                          <span className="text-[8px] font-black uppercase tracking-widest">Wicket</span>
                        </>
                      ) : (
                        <span className="text-2xl font-black">{run}</span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={handleUndo}
                    className="flex-1 py-4 bg-gray-50 rounded-xl flex items-center justify-center gap-2 text-brand-dark font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all"
                  >
                    <Undo2 size={16} /> Undo
                  </button>
                  <button className="flex-1 py-4 bg-gray-50 rounded-xl flex items-center justify-center gap-2 text-brand-dark font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all">
                    <PlusCircle size={16} /> Extras
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex-1 bg-white p-6 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center">
              <Zap size={40} className="text-brand-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-brand-dark uppercase tracking-tighter">Live Commentary</h3>
              <p className="text-gray-400 text-sm font-medium">The match is live! Scores will update automatically as the admin records each ball.</p>
            </div>
            <div className="w-full bg-[#F8F9FA] rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recent Balls</span>
                <div className="flex gap-2">
                  {commentary.slice(0, 5).map((ball: any, i: number) => (
                    <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${ball.isWicket ? 'bg-red-500 text-white' : 'bg-brand-dark text-white'}`}>
                      {ball.isWicket ? 'W' : ball.isWide ? 'WD' : ball.isNoBall ? 'NB' : ball.runsOffBat}
                    </div>
                  ))}
                </div>
              </div>
              {commentary[0] && (
                <div className="p-4 bg-white rounded-xl border border-gray-100">
                  <p className="text-xs font-bold text-brand-dark italic">"{commentary[0].customCommentary || 'What a match!'}"</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Innings Setup Modal */}
      {showInningsSetupModal && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-brand-dark/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] p-8 space-y-8 animate-in slide-in-from-bottom duration-300">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black tracking-tighter text-brand-dark uppercase">
                {match.inningsList?.length === 1 && isInningsOver ? 'Start 2nd Innings' : 'Innings Setup'}
              </h3>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Select initial players</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Striker</p>
                <select 
                  value={setupStriker}
                  onChange={(e) => setSetupStriker(e.target.value)}
                  className="w-full p-4 bg-gray-50 rounded-xl border-none text-sm font-black text-brand-dark outline-none"
                >
                  <option value="">Select Striker</option>
                  {match.squads.find((s: any) => s.teamId === (match.inningsList?.length === 1 && isInningsOver ? match.inningsList[0].bowlingTeamId : match.squads[0].teamId))?.squadMembers
                    ?.map((member: string) => (
                      <option key={member} value={member}>{member}</option>
                    ))
                  }
                </select>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Non-Striker</p>
                <select 
                  value={setupNonStriker}
                  onChange={(e) => setSetupNonStriker(e.target.value)}
                  className="w-full p-4 bg-gray-50 rounded-xl border-none text-sm font-black text-brand-dark outline-none"
                >
                  <option value="">Select Non-Striker</option>
                  {match.squads.find((s: any) => s.teamId === (match.inningsList?.length === 1 && isInningsOver ? match.inningsList[0].bowlingTeamId : match.squads[0].teamId))?.squadMembers
                    ?.filter((m: string) => m !== setupStriker)
                    .map((member: string) => (
                      <option key={member} value={member}>{member}</option>
                    ))
                  }
                </select>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Opening Bowler</p>
                <select 
                  value={setupBowler}
                  onChange={(e) => setSetupBowler(e.target.value)}
                  className="w-full p-4 bg-gray-50 rounded-xl border-none text-sm font-black text-brand-dark outline-none"
                >
                  <option value="">Select Bowler</option>
                  {match.squads.find((s: any) => s.teamId === (match.inningsList?.length === 1 && isInningsOver ? match.inningsList[0].battingTeamId : match.squads[1].teamId))?.squadMembers
                    ?.map((member: string) => (
                      <option key={member} value={member}>{member}</option>
                    ))
                  }
                </select>
              </div>

              <button 
                onClick={handleStartInnings}
                disabled={!setupStriker || !setupNonStriker || !setupBowler || isUpdating}
                className="w-full bg-brand-dark text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl disabled:opacity-50"
              >
                Start Innings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wicket Modal */}
      {showWicketModal && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-brand-dark/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] p-8 space-y-8 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black tracking-tighter text-brand-dark uppercase">Select Dismissal</h3>
              <button onClick={() => setShowWicketModal(false)} className="p-2 bg-gray-100 rounded-full text-gray-400">
                <Undo2 size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Dismissed Batter */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Who got out?</p>
                <div className="grid grid-cols-2 gap-3">
                  {currentInnings.battingStats?.filter((s: any) => !s.isOut).slice(0, 2).map((batter: any) => (
                    <button
                      key={batter.playerUsername}
                      onClick={() => setDismissedUsername(batter.playerUsername)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${dismissedUsername === batter.playerUsername ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-100'}`}
                    >
                      <p className="text-xs font-black text-brand-dark uppercase">{batter.playerUsername}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{batter.runs}({batter.ballsFaced})</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Wicket Type */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Wicket Type</p>
                <div className="grid grid-cols-3 gap-2">
                  {['Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped', 'Hit Wicket'].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setWicketType(type);
                        if (type !== 'Run Out') setStrikeAfterWicket('incoming');
                      }}
                      className={`py-3 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest ${wicketType === type ? 'bg-brand-dark text-white border-brand-dark' : 'bg-gray-50 text-gray-400 border-transparent'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Incoming Batter */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Incoming Batter</p>
                <select 
                  value={newBatterUsername}
                  onChange={(e) => setNewBatterUsername(e.target.value)}
                  className="w-full p-4 bg-gray-50 rounded-xl border-none text-sm font-black text-brand-dark outline-none"
                >
                  <option value="">Select New Batter</option>
                  {match.squads.find((s: any) => s.teamId === currentInnings.battingTeamId)?.squadMembers
                    ?.filter((m: string) => !currentInnings.battingStats?.find((s: any) => s.playerUsername === m))
                    .map((member: string) => (
                      <option key={member} value={member}>{member}</option>
                    ))
                  }
                </select>
              </div>

              {/* Strike Selection for Run Out */}
              {wicketType === 'Run Out' && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Who takes strike?</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setStrikeAfterWicket('incoming')}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${strikeAfterWicket === 'incoming' ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-100'}`}
                    >
                      <p className="text-[10px] font-black text-brand-dark uppercase">Incoming Batter</p>
                    </button>
                    <button
                      onClick={() => setStrikeAfterWicket('non-striker')}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${strikeAfterWicket === 'non-striker' ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-100'}`}
                    >
                      <p className="text-[10px] font-black text-brand-dark uppercase">Non-Striker</p>
                    </button>
                  </div>
                </div>
              )}

              <button 
                onClick={handleUpdateScore}
                disabled={!dismissedUsername || !newBatterUsername || isUpdating}
                className="w-full bg-brand-dark text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl disabled:opacity-50"
              >
                Confirm Wicket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bowler Selection Modal */}
      {showBowlerModal && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-brand-dark/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] p-8 space-y-8 animate-in slide-in-from-bottom duration-300">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black tracking-tighter text-brand-dark uppercase">Over Completed</h3>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Select bowler for the next over</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {match.squads.find((s: any) => s.teamId === currentInnings.bowlingTeamId)?.squadMembers
                  ?.map((member: string) => (
                    <button
                      key={member}
                      onClick={() => setSelectedBowler(member)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${selectedBowler === member ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-100'}`}
                    >
                      <p className="text-xs font-black text-brand-dark uppercase">{member}</p>
                    </button>
                  ))
                }
              </div>

              <button 
                onClick={handleSelectBowler}
                disabled={!selectedBowler || isUpdating}
                className="w-full bg-brand-dark text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl disabled:opacity-50"
              >
                Start Next Over
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="p-6 bg-white border-t border-gray-100 space-y-4">
          <button 
            onClick={handleUpdateScore}
            disabled={(selectedRuns === null && extraType === null) || isUpdating}
            className="btn-primary uppercase tracking-widest text-sm py-5 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isUpdating ? (
              <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Update Score <Send size={18} className="text-brand-primary" /></>
            )}
          </button>
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full text-center text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-brand-dark transition-colors"
          >
            Cancel & Return to Home
          </button>
        </div>
      )}

      {!isAdmin && (
        <div className="p-6 bg-white border-t border-gray-100">
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn-primary bg-brand-dark text-white uppercase tracking-widest text-sm py-5"
          >
            Exit Match Center
          </button>
        </div>
      )}
    </div>
  );
}
