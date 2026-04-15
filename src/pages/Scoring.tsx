import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, Undo2, PlusCircle, Send, Copy, Zap } from 'lucide-react';
import api from '../services/api';
import LoadingBar from '../components/LoadingBar';

export function Scoring() {
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
  const [activeTab, setActiveTab] = useState<'live' | 'scorecard'>('live');
  const [scorecardInningsIdx, setScorecardInningsIdx] = useState(0);

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
              (o.overNo > 0 || o.overNumber > 0) && o.matchId !== null && o.inningsNo !== null
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
        const currentInnings = matchData.inningsList?.[matchData.inningsList.length - 1];
        const totalBalls = currentInnings?.bowlingStats?.reduce((acc: number, b: any) => acc + (b.legalBallsBowled || 0), 0) || 0;
        const currentoverNumber = Math.floor(totalBalls / 6) + 1;
        const currentOverData = currentInnings?.overs?.find((o: any) => (o.overNo === currentoverNumber || o.overNumber === currentoverNumber));
        const squadSize = matchData.squads[0].squadMembers.length;
        
        const target = matchData.inningsList?.length === 2 ? (matchData.inningsList[0].totalRunsScored + 1) : null;
        const isTargetReached = target !== null && currentInnings?.totalRunsScored >= target;

        const isInningsOver = currentInnings && (
          currentInnings.totalWicketsTaken >= squadSize - 1 || 
          (totalBalls >= matchData.totalOvers * 6) ||
          isTargetReached
        );

        if (!currentInnings || (isInningsOver && matchData.inningsList.length < (matchData.totalInnings || 2))) {
          setShowInningsSetupModal(true);
        } else if (isInningsOver && matchData.inningsList.length === (matchData.totalInnings || 2)) {
          // If 2nd innings is over, we could mark match as finished
          // For now, we'll just ensure no more scoring is allowed
          console.log("Match Finished");
        } else if (!currentOverData && !isInningsOver) {
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
  // The first active batter in the array is the striker, the second is the non-striker
  const activeBatters = currentInnings?.battingStats?.filter((s: any) => !s.isOut) || [];
  const striker = activeBatters[0]?.playerUsername;
  const nonStriker = activeBatters[1]?.playerUsername;

  const totalBalls = currentInnings?.bowlingStats?.reduce((acc: number, b: any) => acc + (b.legalBallsBowled || 0), 0) || 0;
  const displayOvers = Math.floor(totalBalls / 6);
  const ballsInOver = totalBalls % 6;
  const overDisplay = `${displayOvers}.${ballsInOver}`;
  const currentoverNumber = Math.floor(totalBalls / 6) + 1;
  const totalRuns = currentInnings?.totalRunsScored || 0;
  const target = match.inningsList?.length === 2 ? (match.inningsList[0].totalRunsScored + 1) : null;
  const isTargetReached = target !== null && totalRuns >= target;
  const runRate = totalBalls > 0 ? (totalRuns / (totalBalls / 6)).toFixed(2) : '0.00';
  const reqRunRate = target && (match.totalOvers * 6 - totalBalls) > 0 
    ? ((target - totalRuns) / ((match.totalOvers * 6 - totalBalls) / 6)).toFixed(2) 
    : null;
  const squadSize = match.squads[0].squadMembers.length;
  
  const remainingBatters = match.squads.find((s: any) => s.teamId === currentInnings?.battingTeamId)?.squadMembers
    ?.filter((m: string) => {
      const stats = currentInnings?.battingStats?.find((s: any) => s.playerUsername === m);
      return !stats; // Not in battingStats means hasn't batted yet
    }) || [];

  const isNextBatterRequired = currentInnings && (currentInnings.totalWicketsTaken < squadSize - 3);

  const isInningsOver = currentInnings && (
    currentInnings.totalWicketsTaken >= squadSize - 1 || 
    (totalBalls >= match.totalOvers * 6) ||
    isTargetReached
  );

  const getMatchResult = () => {
    if (match.inningsList?.length !== 2) return null;
    const inn1 = match.inningsList[0];
    const inn2 = match.inningsList[1];
    
    // Check if 2nd innings is actually over
    const isInn2Over = inn2.totalWicketsTaken >= squadSize - 1 || 
                       (inn2.bowlingStats?.reduce((acc: number, b: any) => acc + (b.legalBallsBowled || 0), 0) >= match.totalOvers * 6) ||
                       (inn2.totalRunsScored > inn1.totalRunsScored);

    if (!isInn2Over) return null;

    if (inn2.totalRunsScored > inn1.totalRunsScored) {
      const wicketsLeft = (squadSize - 1) - inn2.totalWicketsTaken;
      return `${inn2.battingTeamName} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}`;
    } else if (inn2.totalRunsScored < inn1.totalRunsScored) {
      const runDiff = inn1.totalRunsScored - inn2.totalRunsScored;
      return `${inn1.battingTeamName} won by ${runDiff} run${runDiff !== 1 ? 's' : ''}`;
    } else {
      return "Match Tied";
    }
  };

  const matchResult = getMatchResult();

  // Derive current bowler from the overs list or match object
  const currentOverData = currentInnings?.overs?.find((o: any) => (o.overNo === currentoverNumber || o.overNumber === currentoverNumber));
  const currentBowler = currentOverData?.bowlerUsername || null;

  // Derive Fall of Wickets from commentary
  const fow = commentary
    .filter(c => c.isWicket)
    .sort((a, b) => a.id - b.id) // Assuming id is chronological
    .map((ball, idx) => ({
      wicketNo: idx + 1,
      score: ball.totalRunsScored || '?', // We might need to track this in BallDto or derive it
      over: `${ball.overNumber}.${ball.ballNumber}`,
      player: ball.dismissedUsername
    }));

  const recentBalls = commentary.slice(0, 6).reverse();

  const getCommentaryTitle = (ball: any) => {
    if (ball.isWicket) return "BIG WICKET!";
    if (ball.runsOffBat === 6) return "MASSIVE SIX!";
    if (ball.runsOffBat === 4) return "BEAUTIFUL BOUNDARY!";
    if (ball.isWide) return "WIDE BALL";
    if (ball.isNoBall) return "NO BALL";
    return `${ball.runsOffBat + (ball.extraRuns || 0)} run${(ball.runsOffBat + (ball.extraRuns || 0)) !== 1 ? 's' : ''}`;
  };

  const getCommentaryColor = (ball: any) => {
    if (ball.isWicket) return "text-red-600";
    if (ball.runsOffBat >= 4) return "text-[#4C7C05]"; // Darker green for boundaries
    return "text-brand-dark";
  };

  const getBallCircleColor = (ball: any) => {
    if (ball.isWicket) return "bg-red-100 text-red-600";
    if (ball.runsOffBat >= 4) return "bg-[#4C7C05] text-white";
    if (ball.runsOffBat === 0) return "bg-gray-100 text-gray-400";
    return "bg-[#D9F110] text-brand-dark";
  };

  const handleStartInnings = async () => {
    if (!setupStriker || !setupNonStriker || !setupBowler || !matchId) return;
    setIsUpdating(true);
    try {
      const isSecondInnings = match.inningsList?.length === 1 && isInningsOver;
      const nextInningsNumber = isSecondInnings ? 2 : 1;
      
      // Determine teams
      const battingTeamId = isSecondInnings ? match.inningsList[0].bowlingTeamId : match.squads[0].teamId;
      const bowlingTeamId = isSecondInnings ? match.inningsList[0].battingTeamId : match.squads[1].teamId;
      
      const battingTeam = match.squads.find((s: any) => s.teamId === battingTeamId);
      const bowlingTeam = match.squads.find((s: any) => s.teamId === bowlingTeamId);

      const newInnings = {
        matchId: matchId,
        inningsNo: nextInningsNumber,
        battingTeamId: battingTeamId,
        battingTeamName: battingTeam?.teamName || '',
        bowlingTeamId: bowlingTeamId,
        bowlingTeamName: bowlingTeam?.teamName || '',
        totalRunsScored: 0,
        totalWicketsTaken: 0,
        battingStats: [
          { playerUsername: setupStriker, runs: 0, ballsFaced: 0, fours: 0, sixes: 0, strikeRate: 0, isOut: false },
          { playerUsername: setupNonStriker, runs: 0, ballsFaced: 0, fours: 0, sixes: 0, strikeRate: 0, isOut: false }
        ],
        bowlingStats: [
          { playerUsername: setupBowler, oversBowled: 0, legalBallsBowled: 0, runsConceded: 0, wicketsTaken: 0, maidens: 0, economy: 0, dots: 0, wides: 0, noBalls: 0 }
        ],
        overs: [
          {
            matchId: matchId,
            inningsNo: nextInningsNumber,
            overNo: 1,
            bowlerUsername: setupBowler,
            runsScored: 0
          }
        ]
      };

      const updatedInningsList = isSecondInnings ? [...match.inningsList, newInnings] : [newInnings];

      await api.put('/api/Match/UpdateMatch', {
        ...match,
        matchId: matchId,
        inningsList: updatedInningsList,
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
      if (!currentBowler) {
        setShowBowlerModal(true);
        setIsUpdating(false);
        return;
      }
      const inningsNo = currentInnings.inningsNo || 1;

      const isWicket = selectedRuns === 'W';
      const runsOffBat = typeof selectedRuns === 'number' ? selectedRuns : 0;
      const extraRuns = extraType ? 1 : 0;

      const currentStriker = striker;
      const currentNonStriker = nonStriker;

      const ballCommentary = isWicket ? "OUT! What a clinical dismissal!" : 
                            (extraType === 'WD' ? "Wayward delivery, it's a Wide!" :
                            (extraType === 'NB' ? "Front foot over the line, No Ball!" :
                            (runsOffBat === 6 ? "BOOM! That's out of the park! SIX!" :
                            (runsOffBat === 4 ? "CRACKED! Boundary to the ropes!" :
                            (runsOffBat === 0 ? "Solid defense, no run." : `${runsOffBat} run${runsOffBat > 1 ? 's' : ''} taken.`)))));

      await api.post('/api/Match/push-ball', {
        matchId: matchId, 
        inningsNo: inningsNo,
        overNumber: currentoverNumber,
        ballNumber: ballsInOver + 1,
        teamBattingId: currentInnings.battingTeamId,
        strikerUsername: currentStriker,
        nonStrikerUsername: currentNonStriker,
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
        nextBatterUsername: isWicket ? (newBatterUsername || null) : null,
        customCommentary: ballCommentary
      });

      // Fetch latest state to ensure we have updated stats
      const res = await api.get(`/api/Match/GetMatch/${matchId}`);
      let updatedMatch = res.data;
      let latestInnings = updatedMatch.inningsList[updatedMatch.inningsList.length - 1];
      
      const isOverEnd = (ballsInOver + 1) % 6 === 0 && !['WD', 'NB'].includes(extraType || '');
      const shouldRotate = (runsOffBat % 2 !== 0);

      // Handle strike rotation
      if (latestInnings.battingStats) {
        let stats = [...latestInnings.battingStats];
        
        if (isWicket) {
          // Find the non-striker (the active batter who didn't get out)
          const ns = stats.find(s => !s.isOut && s.playerUsername !== dismissedUsername);
          
          // Auto-select last batter if not required to show modal but someone is left
          let finalBatter = newBatterUsername;
          if (!finalBatter && !isNextBatterRequired) {
            const remaining = match.squads.find((s: any) => s.teamId === latestInnings.battingTeamId)?.squadMembers
              ?.filter((m: string) => !stats.find(s => s.playerUsername === m));
            if (remaining && remaining.length === 1) {
              finalBatter = remaining[0];
            }
          }

          // Add the new batter to stats if they were selected or auto-picked
          if (finalBatter) {
            const exists = stats.find(s => s.playerUsername === finalBatter);
            if (!exists) {
              stats.push({
                playerUsername: finalBatter,
                runs: 0,
                ballsFaced: 0,
                fours: 0,
                sixes: 0,
                strikeRate: 0,
                isOut: false
              });
            }
          }

          const nb = stats.find(s => s.playerUsername === newBatterUsername);
          
          if (nb && ns) {
            // Remove them from their current positions and place them at the front
            const otherStats = stats.filter(s => s.playerUsername !== ns.playerUsername && s.playerUsername !== nb.playerUsername);
            if (strikeAfterWicket === 'incoming') {
              stats = [nb, ns, ...otherStats];
            } else {
              stats = [ns, nb, ...otherStats];
            }
          }
        } else if (shouldRotate !== isOverEnd) {
          // Swap striker and non-striker positions in the array
          const sIdx = stats.findIndex(s => s.playerUsername === currentStriker);
          const nsIdx = stats.findIndex(s => s.playerUsername === currentNonStriker);
          
          if (sIdx !== -1 && nsIdx !== -1) {
            const temp = stats[sIdx];
            stats[sIdx] = stats[nsIdx];
            stats[nsIdx] = temp;
          }
        }

        latestInnings.battingStats = stats;
        updatedMatch.inningsList[updatedMatch.inningsList.length - 1] = latestInnings;
        
        // Remove invalid property
        delete (updatedMatch as any).currentBowlerUsername;
        
        await api.put('/api/Match/UpdateMatch', updatedMatch);
      }
      
      await fetchMatch(true);
      setSelectedRuns(null);
      setExtraType(null);
      setDismissedUsername('');
      setNewBatterUsername('');
      setWicketType('Bowled');
      setShowWicketModal(false);

      // Check if over completed for modal
      if (isOverEnd) {
        setShowBowlerModal(true);
      }
    } catch (err: any) {
      console.error('Error updating score', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSelectBowler = async () => {
    if (!selectedBowler || !matchId || !match) return;
    setIsUpdating(true);
    try {
      const updatedInningsList = JSON.parse(JSON.stringify(match.inningsList || []));
      
      if (updatedInningsList.length > 0) {
        const currentInningsIdx = updatedInningsList.length - 1;
        const currentInnings = updatedInningsList[currentInningsIdx];
        const inningsNo = currentInnings.inningsNo || 1;
        
        const newOver = {
          matchId: matchId, 
          inningsNo: inningsNo,
          overNo: currentoverNumber,
          bowlerUsername: selectedBowler,
          runsScored: 0
        };
        
        if (!currentInnings.overs) currentInnings.overs = [];
        if (!currentInnings.bowlingStats) currentInnings.bowlingStats = [];

        // Add bowler to bowlingStats if not exists
        const existingBowler = currentInnings.bowlingStats.find((s: any) => s.playerUsername === selectedBowler);
        if (!existingBowler) {
          currentInnings.bowlingStats.push({
            playerUsername: selectedBowler,
            oversBowled: 0,
            maidens: 0,
            runsConceded: 0,
            wicketsTaken: 0,
            economy: 0,
            dots: 0,
            wides: 0,
            noBalls: 0,
            legalBallsBowled: 0
          });
        }
        
        // Cleanup: Remove any invalid overs
        currentInnings.overs = currentInnings.overs.filter((o: any) => 
          (o.overNo > 0 || o.overNumber > 0) && o.matchId !== null && o.inningsNo !== null
        );

        // Check if over already exists to avoid duplicates
        const existingOverIdx = currentInnings.overs.findIndex((o: any) => (o.overNo === currentoverNumber || o.overNumber === currentoverNumber));
        if (existingOverIdx > -1) {
          currentInnings.overs[existingOverIdx] = newOver;
        } else {
          currentInnings.overs.push(newOver);
        }

        // Persist the change to the backend
        const updatePayload = {
          ...match,
          matchId: matchId,
          inningsList: updatedInningsList
        };
        
        // Remove invalid property if it exists in the match object
        delete (updatePayload as any).currentBowlerUsername;

        await api.put('/api/Match/UpdateMatch', updatePayload);
      }

      await fetchMatch(true);
      setShowBowlerModal(false);
    } catch (err) {
      console.error('Error selecting bowler', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUndo = async () => {
    if (!matchId || !currentInnings) return;
    setIsUpdating(true);
    try {
      // Try to get last ball from commentary first
      const lastBall = commentary[0];
      
      let undoPayload;
      if (lastBall) {
        undoPayload = { 
          matchId: matchId,
          inningsNo: lastBall.inningsNo || currentInnings.inningsNo,
          overNumber: lastBall.overNumber || Math.floor((totalBalls - 1) / 6) + 1,
          ballNumber: lastBall.ballNumber || ((totalBalls - 1) % 6) + 1
        };
      } else if (totalBalls > 0) {
        // Fallback: derive from total balls
        undoPayload = {
          matchId: matchId,
          inningsNo: currentInnings.inningsNo,
          overNumber: Math.floor((totalBalls - 1) / 6) + 1,
          ballNumber: ((totalBalls - 1) % 6) + 1
        };
      }

      if (undoPayload) {
        await api.post('/api/Match/undo-ball', undoPayload);
        await fetchMatch(true);
      }
    } catch (err: any) {
      console.error('Error undoing last ball', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">
      <LoadingBar loading={loading || isUpdating} />
      {/* Navbar */}
      <div className="bg-brand-dark px-6 py-4 flex items-center gap-4 border-b border-white/5 sticky top-0 z-[100]">
        <button 
          onClick={() => {
            if (activeTab === 'scorecard') {
              setActiveTab('live');
            } else {
              navigate('/dashboard');
            }
          }} 
          className="p-2 hover:bg-white/5 rounded-full transition-colors"
        >
          <ArrowLeft size={24} className="text-white" />
        </button>
        <h2 className="text-lg font-black text-white uppercase tracking-widest">
          {activeTab === 'scorecard' ? 'Scorecard' : 'Match Center'}
        </h2>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Live</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 no-scrollbar bg-[#F8F9FA]">
        {/* Main Score Header - Dark Section */}
        <div className="bg-brand-dark p-6 text-white space-y-6 relative overflow-hidden">
          {/* Match ID Badge */}
          <div className="flex justify-center relative z-10">
            <div className="bg-white rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/10">
              <span className="text-[10px] font-black text-brand-dark uppercase tracking-widest">Match ID:</span>
              <span className="text-[10px] font-black text-brand-dark font-mono">{matchId}</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(matchId || '');
                }}
                className="text-brand-dark/40 hover:text-brand-dark transition-colors"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center relative z-10 px-2">
            <div className="text-center space-y-1 flex-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Batting</p>
              <h3 className="text-sm font-black uppercase tracking-tight truncate">
                {currentInnings?.battingTeamId === match.squads[0].teamId ? match.squads[0].teamName : match.squads[1].teamName}
              </h3>
            </div>
            <div className="w-px h-8 bg-white/10 mx-4" />
            <div className="text-center space-y-1 flex-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bowling</p>
              <h3 className="text-sm font-black uppercase tracking-tight truncate">
                {currentInnings?.bowlingTeamId === match.squads[1].teamId ? match.squads[1].teamName : match.squads[0].teamName}
              </h3>
            </div>
          </div>

          <div className="text-center relative z-10 py-2">
            <h1 className="text-7xl font-black tracking-tighter text-[#D9F110]">
              {totalRuns} <span className="text-4xl opacity-50">/</span> {currentInnings?.totalWicketsTaken || 0}
            </h1>
          </div>

          <div className="flex justify-center gap-12 relative z-10">
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Overs</p>
              <p className="text-xl font-black text-white">{overDisplay} <span className="text-sm text-gray-500">/ {match.totalOvers}</span></p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Run Rate</p>
              <p className="text-xl font-black text-white">{runRate}</p>
            </div>
          </div>

          {matchResult && (
            <div className="relative z-10 flex justify-center animate-in zoom-in duration-500">
              <div className="bg-[#D9F110] text-brand-dark px-6 py-2 rounded-full font-black uppercase tracking-widest text-xs shadow-lg shadow-[#D9F110]/20">
                {matchResult}
              </div>
            </div>
          )}

          <div className="h-px bg-white/10 w-full" />

          {/* Batters & Bowler Mini Stats */}
          <div className="grid grid-cols-2 gap-8 relative z-10">
            <div className="space-y-3">
              {activeBatters.map((batter, i) => (
                <div key={batter.playerUsername} className="flex items-center gap-3">
                  <div className={`w-1.5 h-4 rounded-full ${i === 0 ? 'bg-[#D9F110]' : 'bg-transparent'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white truncate">{batter.playerUsername}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-[#D9F110]">{batter.runs}</span>
                    <span className="text-[10px] font-bold text-gray-500 ml-1">({batter.ballsFaced})</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bowling</p>
              <p className="text-sm font-black text-white truncate">
                {currentBowler || 'Select Bowler'}
              </p>
              <div className="flex gap-1.5 justify-end mt-2">
                {recentBalls.map((ball, i) => {
                  let color = 'bg-white/10 text-white';
                  let display = ball.runsOffBat?.toString() || '0';
                  if (ball.isWicket) {
                    color = 'bg-[#D9F110] text-brand-dark';
                    display = 'W';
                  }
                  return (
                    <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${color}`}>
                      {display}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'live' ? (
          isAdmin ? (
            /* Admin Scoring Controls */
            <div className="p-4 space-y-4">
              {/* This Ball Indicator */}
              <div className="bg-[#F8F9FA] p-4 rounded-xl border border-gray-100 flex items-center gap-3">
                <span className="text-[10px] font-black text-brand-dark uppercase tracking-widest">This Ball</span>
                <div className="flex-1 bg-white border border-gray-100 rounded-lg px-3 py-1.5 text-xs font-black text-brand-dark min-h-[32px] flex items-center">
                  {selectedRuns !== null || extraType !== null ? (
                    <div className="flex items-center gap-2">
                      {extraType === 'WD' && <span>Wide</span>}
                      {extraType === 'NB' && <span>No Ball</span>}
                      {extraType === 'B' && <span>Bye</span>}
                      {extraType === 'LB' && <span>Leg Bye</span>}
                      {extraType && selectedRuns !== null && <span>+</span>}
                      {selectedRuns !== null && (
                        <span>
                          {selectedRuns === 'W' ? 'Wicket' : `${selectedRuns} Run${selectedRuns !== 1 ? 's' : ''}`}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-300 italic">Select action...</span>
                  )}
                </div>
              </div>

              {/* Extras Grid */}
              <div className={`grid grid-cols-4 gap-2 ${isInningsOver ? 'opacity-50 pointer-events-none' : ''}`}>
                {[
                  { id: 'NB', label: 'Nb', sub: 'NO BALL' },
                  { id: 'B', label: 'B', sub: 'BYE' },
                  { id: 'LB', label: 'Lb', sub: 'LEG BYE' },
                  { id: 'WD', label: 'Wd', sub: 'WIDE' }
                ].map((extra) => (
                  <button 
                    key={extra.id}
                    onClick={() => {
                      setExtraType(prev => prev === extra.id ? null : extra.id);
                      if (selectedRuns === 'W') setSelectedRuns(0);
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${extraType === extra.id ? 'bg-brand-primary text-brand-dark shadow-md scale-105' : 'bg-[#F1F3F5] text-brand-dark hover:bg-gray-200'}`}
                  >
                    <span className="text-lg font-black">{extra.label}</span>
                    <span className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{extra.sub}</span>
                  </button>
                ))}
              </div>

              {/* Runs & Wicket Grid */}
              <div className={`grid grid-cols-4 gap-2 ${isInningsOver ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="col-span-3 grid grid-cols-3 gap-2">
                  {[0, 1, 2, 3, 4, 6].map((run) => (
                    <button 
                      key={run}
                      onClick={() => {
                        setSelectedRuns(prev => prev === run ? null : run);
                      }}
                      className={`h-16 rounded-xl flex items-center justify-center text-xl font-black transition-all border-2 ${selectedRuns === run ? 'bg-white border-brand-dark text-brand-dark shadow-lg scale-105' : 'bg-white border-gray-100 text-brand-dark hover:border-gray-200'}`}
                    >
                      {run}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => {
                    setSelectedRuns('W');
                    setExtraType(null);
                    const activeBatters = currentInnings?.battingStats?.filter((s: any) => !s.isOut) || [];
                    setDismissedUsername(activeBatters[0]?.playerUsername || '');
                    setShowWicketModal(true);
                  }}
                  className={`h-full rounded-xl flex flex-col items-center justify-center gap-1 transition-all border-2 ${selectedRuns === 'W' ? 'bg-white border-red-500 text-red-600 shadow-lg scale-105' : 'bg-white border-gray-100 text-red-600 hover:border-red-200'}`}
                >
                  <div className="w-7 h-7 bg-red-50 rounded-full flex items-center justify-center">
                    <Zap size={16} className="fill-current" />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black">W</p>
                    <p className="text-[7px] font-black uppercase tracking-widest">Wicket</p>
                  </div>
                </button>
              </div>

              {/* Utility Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleUndo}
                  disabled={isUpdating || totalBalls === 0}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all shadow-sm ${totalBalls > 0 ? 'bg-white border-2 border-brand-dark text-brand-dark hover:bg-gray-50' : 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed'}`}
                >
                  <Undo2 size={14} /> Undo Last Ball
                </button>
                <button 
                  onClick={() => setActiveTab('scorecard')}
                  className="py-3 bg-[#E9ECEF] text-brand-dark rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-gray-200 transition-all shadow-sm"
                >
                  Full Scoreboard
                </button>
              </div>

              {/* Primary Action Button */}
              <div className="pt-2">
                {isInningsOver ? (
                  <div className="space-y-3">
                    <div className="w-full py-4 bg-gray-100 text-gray-400 rounded-xl font-black uppercase tracking-[0.2em] text-xs text-center border-2 border-dashed border-gray-200">
                      {match.inningsList?.length === (match.totalInnings || 2) ? 'Match Finished' : 'Innings Completed'}
                    </div>
                    {match.inningsList?.length < (match.totalInnings || 2) && (
                      <button 
                        onClick={() => setShowInningsSetupModal(true)}
                        className="w-full py-4 bg-brand-primary text-brand-dark rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 animate-bounce-subtle"
                      >
                        Start Next Innings <PlusCircle size={16} />
                      </button>
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={handleUpdateScore}
                    disabled={(selectedRuns === null && extraType === null) || isUpdating}
                    className="w-full py-4 bg-brand-dark text-[#D9F110] rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isUpdating ? (
                      <div className="w-5 h-5 border-2 border-[#D9F110]/30 border-t-[#D9F110] rounded-full animate-spin" />
                    ) : (
                      <>
                        Update Score <Zap size={16} className="fill-current" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Player Match Center View */
            <div className="p-6 space-y-8">
              <button 
                onClick={() => setActiveTab('scorecard')}
                className="w-full py-4 bg-[#E9ECEF] text-brand-dark rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all shadow-sm"
              >
                Full Scoreboard
              </button>

              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <h3 className="text-xl font-black text-brand-dark tracking-tight">AI Commentary</h3>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Real-time Analysis</span>
                </div>

                <div className="space-y-0 bg-white rounded-[2rem] shadow-xl shadow-brand-dark/5 border border-gray-100 overflow-hidden">
                  {commentary.length > 0 ? (
                    commentary.map((ball, idx) => (
                      <div key={idx} className={`p-5 flex gap-5 items-start border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm ${getBallCircleColor(ball)}`}>
                          {ball.overNumber}.{ball.ballNumber}
                        </div>
                        <div className="space-y-1">
                          <h4 className={`text-sm font-black uppercase tracking-tight ${getCommentaryColor(ball)}`}>
                            {getCommentaryTitle(ball)}
                          </h4>
                          <p className="text-xs text-gray-500 font-medium leading-relaxed">
                            {ball.customCommentary || "No description available for this ball."}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center space-y-3">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                        <Zap size={20} className="text-gray-200" />
                      </div>
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Waiting for first ball...</p>
                    </div>
                  )}
                  
                  {commentary.length > 0 && (
                    <button className="w-full py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-brand-dark transition-colors bg-gray-50/30">
                      Show Previous Overs
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        ) : (
          /* Scorecard Tab View */
          <div className="p-4 space-y-6">
            {/* Innings Switcher */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
              {match.inningsList?.map((innings: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setScorecardInningsIdx(idx)}
                  className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${scorecardInningsIdx === idx ? 'bg-brand-dark text-white shadow-md' : 'text-gray-400 hover:text-brand-dark'}`}
                >
                  {match.squads.find((s: any) => s.teamId === innings.battingTeamId)?.teamName || `Innings ${idx + 1}`}
                </button>
              ))}
            </div>

            {match.inningsList?.[scorecardInningsIdx] && (
              <div className="space-y-6 animate-in fade-in duration-500">
                {/* Batting Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                    <h4 className="text-lg font-black text-brand-dark uppercase tracking-tight">Batting</h4>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Innings {scorecardInningsIdx + 1}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <th className="px-4 py-3">Batter</th>
                          <th className="px-4 py-3">Dismissal</th>
                          <th className="px-4 py-3 text-right">R</th>
                          <th className="px-4 py-3 text-right">B</th>
                          <th className="px-4 py-3 text-right">4s</th>
                          <th className="px-4 py-3 text-right">6s</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {match.inningsList[scorecardInningsIdx].battingStats?.map((stat: any, idx: number) => (
                          <tr key={idx} className="text-xs font-bold text-brand-dark">
                            <td className="px-4 py-4 flex items-center gap-2">
                              {stat.playerUsername}
                              {!stat.isOut && <div className="w-1.5 h-1.5 bg-[#D9F110] rounded-full" />}
                            </td>
                            <td className="px-4 py-4 text-[10px] text-gray-400 uppercase font-black">
                              {stat.isOut ? (stat.wicketType || 'Out') : 'Not Out'}
                            </td>
                            <td className="px-4 py-4 text-right font-black">{stat.runs || 0}</td>
                            <td className="px-4 py-4 text-right text-gray-400">{stat.ballsFaced || 0}</td>
                            <td className="px-4 py-4 text-right text-gray-400">{stat.fours || 0}</td>
                            <td className="px-4 py-4 text-right text-gray-400">{stat.sixes || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 bg-gray-50/30 flex justify-between items-center border-t border-gray-50">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Extras</p>
                      <p className="text-xs font-bold text-brand-dark">{match.inningsList[scorecardInningsIdx].totalExtras || 0}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-brand-dark">
                        Total: {match.inningsList[scorecardInningsIdx].totalRunsScored}/{match.inningsList[scorecardInningsIdx].totalWicketsTaken}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        ({Math.floor((match.inningsList[scorecardInningsIdx].bowlingStats?.reduce((acc: number, b: any) => acc + (b.legalBallsBowled || 0), 0) || 0) / 6)}.{(match.inningsList[scorecardInningsIdx].bowlingStats?.reduce((acc: number, b: any) => acc + (b.legalBallsBowled || 0), 0) || 0) % 6} Ov)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bowling Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4 border-b border-gray-50">
                    <h4 className="text-lg font-black text-brand-dark uppercase tracking-tight">Bowling</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <th className="px-4 py-3">Bowler</th>
                          <th className="px-4 py-3 text-right">O</th>
                          <th className="px-4 py-3 text-right">M</th>
                          <th className="px-4 py-3 text-right">R</th>
                          <th className="px-4 py-3 text-right">W</th>
                          <th className="px-4 py-3 text-right">Econ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {match.inningsList[scorecardInningsIdx].bowlingStats?.map((stat: any, idx: number) => (
                          <tr key={idx} className="text-xs font-bold text-brand-dark">
                            <td className="px-4 py-4 font-black">{stat.playerUsername}</td>
                            <td className="px-4 py-4 text-right">{Math.floor((stat.legalBallsBowled || 0) / 6)}.{ (stat.legalBallsBowled || 0) % 6 }</td>
                            <td className="px-4 py-4 text-right text-gray-400">{stat.maidens || 0}</td>
                            <td className="px-4 py-4 text-right font-black">{stat.runsConceded || 0}</td>
                            <td className="px-4 py-4 text-right text-[#D9F110] font-black bg-brand-dark/5">{stat.wicketsTaken || stat.wickets || 0}</td>
                            <td className="px-4 py-4 text-right text-gray-400">{(stat.runsConceded / ((stat.legalBallsBowled || 1) / 6)).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Fall of Wickets */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Undo2 size={16} className="text-gray-400 -rotate-90" />
                    <h4 className="text-sm font-black text-brand-dark uppercase tracking-tight">Fall of Wickets</h4>
                  </div>
                  <div className="space-y-3">
                    {fow.length > 0 ? fow.map((w, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-bold">{w.wicketNo}-{w.score} ({w.player}, {w.over} ov)</span>
                        <span className="font-black text-brand-dark">Runs: {w.score}</span>
                      </div>
                    )) : (
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-center py-4">No wickets fallen yet</p>
                    )}
                  </div>
                </div>

                {/* Partnership Card */}
                <div className="bg-brand-dark rounded-2xl p-6 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#D9F110]/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Current Partnership</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-4xl font-black text-[#D9F110]">
                      {activeBatters.reduce((acc, b) => acc + (b.runs || 0), 0)}*
                    </h3>
                    <span className="text-sm font-bold text-gray-400">
                      ({activeBatters.reduce((acc, b) => acc + (b.ballsFaced || 0), 0)} balls)
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-300 mt-2">
                    {activeBatters[0]?.playerUsername} & {activeBatters[1]?.playerUsername}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals remain below */}

      {/* Innings Setup Modal */}
      {showInningsSetupModal && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-brand-dark/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] p-8 space-y-8 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black tracking-tighter text-brand-dark uppercase">Innings Setup</h3>
              <button onClick={() => setShowInningsSetupModal(false)} className="p-2 bg-gray-100 rounded-full text-gray-400">
                <Undo2 size={20} />
              </button>
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
                    ?.filter((m: string) => m !== setupNonStriker)
                    .map((member: string) => (
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
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 space-y-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black tracking-tighter text-brand-dark uppercase">Dismissal Details</h3>
              <button onClick={() => {
                setShowWicketModal(false);
                setSelectedRuns(null);
              }} className="p-2 bg-gray-100 rounded-full text-gray-400">
                <Undo2 size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Dismissed Batter */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Who got out?</p>
                <div className="grid grid-cols-2 gap-2">
                  {activeBatters.slice(0, 2).map((batter: any) => (
                    <button
                      key={batter.playerUsername}
                      onClick={() => setDismissedUsername(batter.playerUsername)}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${dismissedUsername === batter.playerUsername ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-100'}`}
                    >
                      <p className="text-xs font-black text-brand-dark uppercase truncate">{batter.playerUsername}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{batter.runs}({batter.ballsFaced})</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Wicket Type */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Wicket Type</p>
                <div className="grid grid-cols-3 gap-2">
                  {['Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped', 'Hit Wicket'].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setWicketType(type);
                        if (type !== 'Run Out') setStrikeAfterWicket('incoming');
                      }}
                      className={`py-2 rounded-lg border transition-all text-[9px] font-black uppercase tracking-widest ${wicketType === type ? 'bg-brand-dark text-white border-brand-dark' : 'bg-gray-50 text-gray-400 border-transparent'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Incoming Batter */}
              {isNextBatterRequired && remainingBatters.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Next Batter</p>
                  <select 
                    value={newBatterUsername}
                    onChange={(e) => setNewBatterUsername(e.target.value)}
                    className="w-full p-3 bg-gray-50 rounded-xl border-none text-xs font-black text-brand-dark outline-none"
                  >
                    <option value="">Select Next Batter</option>
                    {remainingBatters.map((member: string) => (
                      <option key={member} value={member}>{member}</option>
                    ))}
                  </select>
                </div>
              )}

              <button 
                onClick={handleUpdateScore}
                disabled={!dismissedUsername || !wicketType || (isNextBatterRequired && remainingBatters.length > 0 && !newBatterUsername) || isUpdating}
                className="w-full bg-brand-dark text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg disabled:opacity-50 text-xs"
              >
                Confirm & Update Score
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bowler Selection Modal */}
      {showBowlerModal && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-brand-dark/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 space-y-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black tracking-tighter text-brand-dark uppercase">Next Bowler</h3>
              <button onClick={() => setShowBowlerModal(false)} className="p-2 bg-gray-100 rounded-full text-gray-400">
                <Undo2 size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                {match.squads.find((s: any) => s.teamId === currentInnings?.bowlingTeamId)?.squadMembers
                  ?.map((member: string) => (
                    <button
                      key={member}
                      onClick={() => setSelectedBowler(member)}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${selectedBowler === member ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-100'}`}
                    >
                      <p className="text-xs font-black text-brand-dark uppercase truncate">{member}</p>
                    </button>
                  ))
                }
              </div>

              <button 
                onClick={handleSelectBowler}
                disabled={!selectedBowler || isUpdating}
                className="w-full bg-brand-dark text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg disabled:opacity-50 text-xs"
              >
                Confirm Bowler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Scoring;
