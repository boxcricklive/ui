import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, Minus, Plus, MapPin } from 'lucide-react';
import api from '../services/api';
import LoadingBar from '../components/LoadingBar';

export default function MatchSetup() {
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [overs, setOvers] = useState<string>('20');
  const [players, setPlayers] = useState<string>('11');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [showSuggestions1, setShowSuggestions1] = useState(false);
  const [showSuggestions2, setShowSuggestions2] = useState(false);
  const navigate = useNavigate();

  const generateUniqueId = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  React.useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await api.get('/api/Teams/GetAllTeams');
        if (Array.isArray(response.data)) {
          setAllTeams(response.data);
        }
      } catch (err: any) {
        console.error('Error fetching teams', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('username');
          navigate('/login');
        }
      }
    };
    fetchTeams();
  }, []);

  const getOrCreateTeam = async (teamName: string) => {
    console.log(`[Team Setup] Getting or creating team: "${teamName}"`);
    try {
      // Try to get existing team
      const response = await api.get(`/api/Teams/GetTeamByName/${encodeURIComponent(teamName)}`);
      if (response.data && (response.data.teamId || response.data.TeamId)) {
        console.log(`[Team Setup] Found existing team:`, response.data);
        return {
          teamId: response.data.teamId || response.data.TeamId,
          teamName: response.data.teamName || response.data.TeamName
        };
      }
    } catch (err: any) {
      console.log(`[Team Setup] Team "${teamName}" not found or error occurred, attempting to create...`, err.message);
    }

    // If not found or error, create a new team
    try {
      const createPayload = {
        teamId: generateUniqueId(),
        teamName: teamName,
        city: location || 'Unknown',
        teamOwner: 'System',
        teamRank: 0
      };
      console.log(`[Team Setup] Creating new team with payload:`, createPayload);
      const createResponse = await api.post('/api/Teams/CreateTeam', createPayload);
      console.log(`[Team Setup] Team created successfully:`, createResponse.data);
      return {
        teamId: createResponse.data.teamId || createResponse.data.TeamId,
        teamName: createResponse.data.teamName || createResponse.data.TeamName
      };
    } catch (createErr: any) {
      console.error(`[Team Setup] Failed to create team "${teamName}":`, createErr);
      throw createErr;
    }
  };

  const handleCreateMatch = async () => {
    if (!team1 || !team2 || !location) return;
    
    if (team1.trim().toLowerCase() === team2.trim().toLowerCase()) {
      setError('Team names cannot be the same. Please choose different teams.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Get or create teams first
      const t1 = await getOrCreateTeam(team1);
      const t2 = await getOrCreateTeam(team2);

      const matchData = {
        matchId: generateUniqueId(),
        location: location,
        dateAndTime: new Date().toISOString(),
        status: 'Created',
        adminUsername: localStorage.getItem('username') || 'Unknown',
        totalOvers: Number(overs) || 20,
        squadStrength: Number(players) || 11,
        tossDetails: null,
        inningsList: [],
        winningTeamId: null,
        winningTeamName: null,
        playerOfTheMatch: null,
        squads: [
          { teamId: t1.teamId, teamName: t1.teamName, squadMembers: [] },
          { teamId: t2.teamId, teamName: t2.teamName, squadMembers: [] }
        ]
      };
      
      console.log('[Match Setup] Sending matchData:', JSON.stringify(matchData, null, 2));
      
      const response = await api.post('/api/Match/CreateMatch', matchData);
      console.log('Match created successfully:', response.data);
      const matchId = response.data.matchId || response.data.MatchId;
      if (!matchId) {
        throw new Error('Match ID not returned from server');
      }
      navigate(`/match-created/${matchId}`, { state: { matchId, location, overs: Number(overs) || 20 } });
    } catch (err: any) {
      console.error('Error creating match:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('username');
        navigate('/login');
        return;
      }
      const errorData = err.response?.data;
      
      // Log the full error response for debugging
      if (errorData) {
        console.log('[Match Setup] Full error response:', JSON.stringify(errorData, null, 2));
      }

      let errorMsg = errorData?.message || errorData?.title || err.message || 'Failed to create match. Please try again.';
      
      // If there are specific validation errors, show them
      if (errorData?.errors) {
        const details = Object.entries(errorData.errors)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join(' | ');
        errorMsg = `Validation Error: ${details}`;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto shadow-xl flex flex-col">
      <LoadingBar loading={loading} />
      {/* Header */}
      <div className="p-6 flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-brand-dark">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-black tracking-tight text-brand-dark uppercase">Match Setup</h2>
        <button className="p-2 -mr-2 text-brand-dark">
          <MoreVertical size={24} />
        </button>
      </div>

      <div className="flex-1 p-6 space-y-10">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tighter text-brand-dark">Lets start a match</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Start recording the match ball-by-ball to enable real-time analytics.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2 relative">
            <div className="flex justify-between items-center ml-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Team Name 1</label>
              {team1 && (
                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${allTeams.some(t => t.teamName.toLowerCase() === team1.toLowerCase()) ? 'bg-green-100 text-green-600' : 'bg-brand-primary text-brand-dark'}`}>
                  {allTeams.some(t => t.teamName.toLowerCase() === team1.toLowerCase()) ? 'Existing Team' : 'New Team'}
                </span>
              )}
            </div>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Eg. Mumbai Indians" 
                className="w-full bg-[#F1F3F5] border-l-4 border-brand-primary rounded-r-xl px-5 py-4 text-brand-dark font-black focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                value={team1}
                onChange={(e) => {
                  setTeam1(e.target.value);
                  setShowSuggestions1(true);
                }}
                onFocus={() => setShowSuggestions1(true)}
                onBlur={() => setTimeout(() => setShowSuggestions1(false), 200)}
              />
              {showSuggestions1 && team1 && allTeams.filter(t => t.teamName.toLowerCase().includes(team1.toLowerCase()) && t.teamName.toLowerCase() !== team1.toLowerCase()).length > 0 && (
                <div className="absolute z-50 w-full bg-white border border-gray-100 rounded-2xl shadow-2xl mt-2 max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                  {allTeams.filter(t => t.teamName.toLowerCase().includes(team1.toLowerCase()) && t.teamName.toLowerCase() !== team1.toLowerCase()).map(t => (
                    <button 
                      key={t.teamId}
                      type="button"
                      onClick={() => {
                        setTeam1(t.teamName);
                        setShowSuggestions1(false);
                      }}
                      className="w-full px-5 py-4 text-left text-sm font-bold text-brand-dark hover:bg-brand-primary/5 border-b border-gray-50 last:border-0 transition-colors flex items-center justify-between"
                    >
                      <span>{t.teamName}</span>
                      <span className="text-[8px] bg-gray-100 px-2 py-1 rounded-full text-gray-400 uppercase">Existing</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 relative">
            <div className="flex justify-between items-center ml-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Team Name 2</label>
              {team2 && (
                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${allTeams.some(t => t.teamName.toLowerCase() === team2.toLowerCase()) ? 'bg-green-100 text-green-600' : 'bg-brand-primary text-brand-dark'}`}>
                  {allTeams.some(t => t.teamName.toLowerCase() === team2.toLowerCase()) ? 'Existing Team' : 'New Team'}
                </span>
              )}
            </div>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Eg. Chennai Super Kings" 
                className="w-full bg-[#F1F3F5] border-l-4 border-brand-primary rounded-r-xl px-5 py-4 text-brand-dark font-black focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                value={team2}
                onChange={(e) => {
                  setTeam2(e.target.value);
                  setShowSuggestions2(true);
                }}
                onFocus={() => setShowSuggestions2(true)}
                onBlur={() => setTimeout(() => setShowSuggestions2(false), 200)}
              />
              {showSuggestions2 && team2 && allTeams.filter(t => t.teamName.toLowerCase().includes(team2.toLowerCase()) && t.teamName.toLowerCase() !== team2.toLowerCase()).length > 0 && (
                <div className="absolute z-50 w-full bg-white border border-gray-100 rounded-2xl shadow-2xl mt-2 max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                  {allTeams.filter(t => t.teamName.toLowerCase().includes(team2.toLowerCase()) && t.teamName.toLowerCase() !== team2.toLowerCase()).map(t => (
                    <button 
                      key={t.teamId}
                      type="button"
                      onClick={() => {
                        setTeam2(t.teamName);
                        setShowSuggestions2(false);
                      }}
                      className="w-full px-5 py-4 text-left text-sm font-bold text-brand-dark hover:bg-brand-primary/5 border-b border-gray-50 last:border-0 transition-colors flex items-center justify-between"
                    >
                      <span>{t.teamName}</span>
                      <span className="text-[8px] bg-gray-100 px-2 py-1 rounded-full text-gray-400 uppercase">Existing</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#F8F9FA] p-6 rounded-3xl space-y-8 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h4 className="font-black text-brand-dark uppercase tracking-tight text-sm">Total Overs</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Innings length</p>
              </div>
              <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl shadow-inner border border-gray-100">
                <button 
                  onClick={() => setOvers(prev => Math.max(1, (parseInt(prev) || 0) - 1).toString())}
                  className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-brand-dark hover:bg-brand-primary active:scale-95 transition-all"
                >
                  <Minus size={20} />
                </button>
                <input 
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={overs}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setOvers(val);
                  }}
                  className="w-16 bg-transparent text-center text-2xl font-black text-brand-dark outline-none focus:text-brand-primary transition-colors"
                />
                <button 
                  onClick={() => setOvers(prev => ((parseInt(prev) || 0) + 1).toString())}
                  className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-brand-dark hover:bg-brand-primary active:scale-95 transition-all"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h4 className="font-black text-brand-dark uppercase tracking-tight text-sm">Total Players</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Squad size</p>
              </div>
              <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl shadow-inner border border-gray-100">
                <button 
                  onClick={() => setPlayers(prev => Math.max(1, (parseInt(prev) || 0) - 1).toString())}
                  className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-brand-dark hover:bg-brand-primary active:scale-95 transition-all"
                >
                  <Minus size={20} />
                </button>
                <input 
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={players}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setPlayers(val);
                  }}
                  className="w-16 bg-transparent text-center text-2xl font-black text-brand-dark outline-none focus:text-brand-primary transition-colors"
                />
                <button 
                  onClick={() => setPlayers(prev => ((parseInt(prev) || 0) + 1).toString())}
                  className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-brand-dark hover:bg-brand-primary active:scale-95 transition-all"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">Error</p>
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Location</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Eg. Lakeside Turf" 
                className="w-full bg-[#F1F3F5] rounded-xl pl-12 pr-4 py-4 text-brand-dark font-black focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="relative h-32 rounded-2xl overflow-hidden group">
            <img src="https://picsum.photos/seed/stadium/800/400" className="w-full h-full object-cover" alt="Stadium" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-brand-dark/20 flex items-end p-4">
              <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-brand-dark">Stadium Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <button 
          onClick={handleCreateMatch}
          disabled={loading || !team1 || !team2 || !location}
          className="btn-primary uppercase tracking-widest text-sm py-5 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Match ID'}
        </button>
      </div>
    </div>
  );
}
