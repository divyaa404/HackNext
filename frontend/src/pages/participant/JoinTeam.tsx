import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, Key, AlertTriangle, Clock, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getRegistrationStatus, EventWithTimeline, RegistrationStatus } from '../../utils/timeline';

export const JoinTeam = () => {
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teams, setTeams] = useState<any[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [eventData, setEventData] = useState<EventWithTimeline | null>(null);
  const [myTeam, setMyTeam] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchTeamsAndEvent();
  }, []);

  const fetchTeamsAndEvent = async () => {
    try {
      const token = localStorage.getItem('token');
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

      const [teamsRes, eventRes, myTeamRes] = await Promise.allSettled([
        axios.get('/api/teams/all', { headers: authHeaders }),
        axios.get('/api/events', { headers: authHeaders }),
        axios.get('/api/teams/my-team', { headers: authHeaders })
      ]);

      if (teamsRes.status === 'fulfilled') {
        setTeams(teamsRes.value.data || []);
      }
      if (eventRes.status === 'fulfilled') {
        const events = Array.isArray(eventRes.value.data)
          ? eventRes.value.data
          : eventRes.value.data?.events || eventRes.value.data?.data || [];
        if (events.length > 0) {
          setEventData(events[0]);
        } else {
          setEventData(null);
        }
      }
      if (myTeamRes.status === 'fulfilled' && myTeamRes.value.data) {
        setMyTeam(myTeamRes.value.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTeamsLoading(false);
    }
  };

  const regStatus: RegistrationStatus = getRegistrationStatus(eventData);

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (myTeam) {
      setError(`You are already a member of team "${myTeam.name}". You cannot join another team.`);
      return;
    }
    if (!regStatus.isOpen) {
      setError(regStatus.message);
      return;
    }
    if (!inviteCode || inviteCode.length !== 6) {
      setError('Please enter a valid 6-digit invite code.');
      return;
    }
    await joinTeamRequest(inviteCode);
  };

  const joinTeamRequest = async (code: string) => {
    setLoading(true);
    setError('');
    
    try {
      await axios.post(`/api/teams/join`, { invite_code: code }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      navigate('/participant/team');
    } catch (err: any) {
      if (err.response?.data?.requiresProfile) {
        setError('You must complete your profile before joining a team.');
        navigate('/participant/profile');
      } else {
        setError(err.response?.data?.error || 'Failed to join team');
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter teams based on search query
  const filteredTeams = teams.filter((team: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const teamName = team.name?.toLowerCase() || '';
    const leaderName = team.members?.[0]?.user?.name?.toLowerCase() || '';
    const leaderEmail = team.members?.[0]?.user?.email?.toLowerCase() || '';
    return teamName.includes(q) || leaderName.includes(q) || leaderEmail.includes(q);
  });

  const totalPages = Math.ceil(filteredTeams.length / ITEMS_PER_PAGE) || 1;
  const paginatedTeams = filteredTeams.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-black text-bauhaus-text uppercase tracking-tighter mb-8 shadow-white drop-shadow-[2px_2px_0px_rgba(255,255,255,1)]">Join a Team</h1>
      
      {!teamsLoading && myTeam && (
        <div className="mb-8 p-5 border-4 border-black bg-cyan-300 text-black shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <div className="flex items-start gap-3">
            <Users className="w-6 h-6 shrink-0 text-black mt-0.5" />
            <div className="flex-1">
              <p className="font-black uppercase tracking-wider text-sm">
                You already belong to a team!
              </p>
              <p className="text-sm font-bold mt-1 text-zinc-900">
                You are currently a member of <span className="underline font-black">"{myTeam.name}"</span>. You cannot join or request to join other teams in this hackathon.
              </p>
              <button
                type="button"
                onClick={() => navigate('/participant/team')}
                className="mt-3 inline-block bg-black text-white font-black uppercase text-xs tracking-widest px-4 py-2 border-2 border-black hover:bg-white hover:text-black transition-colors"
              >
                Go to My Team Workspace &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {!teamsLoading && !myTeam && !regStatus.isOpen && (
        <div className="mb-8 p-4 border-4 border-black bg-yellow-300 text-black flex items-start gap-3 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          {regStatus.isClosed ? (
            <AlertTriangle className="w-6 h-6 shrink-0 text-red-600 mt-0.5" />
          ) : (
            <Clock className="w-6 h-6 shrink-0 text-amber-900 mt-0.5" />
          )}
          <div>
            <p className="font-black uppercase tracking-wider text-sm">
              {regStatus.isClosed ? 'Team Registration Closed' : 'Team Registration Not Open'}
            </p>
            <p className="text-xs font-bold mt-1 text-zinc-900">
              {regStatus.message}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 border-4 border-red-600 mb-8 font-bold uppercase tracking-wider text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Join by Code Section */}
        <div className="lg:col-span-1">
          <div className="bauhaus-card p-4 md:p-8 bg-bauhaus-primary text-white border-bauhaus-border">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-bauhaus-card text-bauhaus-text border-4 border-bauhaus-border rounded-full flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.2)]">
                <Key className="w-10 h-10" />
              </div>
            </div>
            
            <h2 className="text-2xl font-black text-center uppercase tracking-widest mb-6 text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,0.6)]">Have a Code?</h2>
            
            <form onSubmit={handleJoinByCode} className="space-y-6">
              <div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  disabled={!regStatus.isOpen || !!myTeam}
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="6-DIGIT CODE"
                  className="w-full px-4 py-3 md:py-4 border-4 border-bauhaus-border bg-white dark:bg-zinc-900 text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-0 focus:border-bauhaus-accent transition-colors font-black text-2xl text-center uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !regStatus.isOpen || !!myTeam}
                className="w-full bg-black text-white border-4 border-white font-black uppercase tracking-widest px-6 py-4 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? 'Joining...'
                  : myTeam
                  ? 'Already in a Team'
                  : !regStatus.isOpen
                  ? regStatus.isClosed ? 'Registration Closed' : 'Registration Locked'
                  : 'Join Team'}
              </button>
            </form>
          </div>
        </div>

        {/* Existing Teams List */}
        <div className="lg:col-span-2">
          <div className="bauhaus-card p-4 md:p-8 bg-bauhaus-card border-bauhaus-border">
            
            {/* Header & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-bauhaus-primary shrink-0" />
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-bauhaus-text uppercase tracking-tighter">Existing Teams</h2>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    {filteredTeams.length} {filteredTeams.length === 1 ? 'team' : 'teams'} registered
                  </p>
                </div>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search team or leader..."
                  className="w-full pl-9 pr-8 py-2 border-2 border-bauhaus-border bg-bauhaus-bg text-bauhaus-text font-bold text-xs focus:outline-none focus:border-bauhaus-primary placeholder:text-zinc-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 hover:text-black dark:hover:text-white px-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {teamsLoading ? (
              <div className="text-center font-bold tracking-widest uppercase py-8">Loading teams...</div>
            ) : filteredTeams.length === 0 ? (
              <div className="text-center font-bold tracking-widest uppercase py-8 text-gray-500 dark:text-gray-400">
                {searchQuery ? `No teams matching "${searchQuery}"` : 'No teams found.'}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {paginatedTeams.map((team: any) => {
                    const leader = team.members[0]?.user;
                    const memberCount = team.members.length;
                    const teamMax = team.event?.team_size_max ?? eventData?.team_size_max ?? 4;
                    const isFull = memberCount >= teamMax;
                    const isUserInThisTeam = myTeam?.id === team.id;

                    return (
                      <div key={team.id} className="border-4 border-bauhaus-border p-4 flex flex-col md:flex-row justify-between items-center bg-bauhaus-bg hover:bg-gray-200 dark:bg-gray-800 transition-colors gap-3">
                        <div className="mb-2 md:mb-0 w-full md:w-auto">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg md:text-xl font-black uppercase tracking-widest truncate">{team.name}</h3>
                            {isUserInThisTeam && (
                              <span className="bg-black text-white text-[10px] font-black uppercase px-2 py-0.5">Your Team</span>
                            )}
                            {isFull && !isUserInThisTeam && (
                              <span className="bg-red-500 text-white text-[10px] font-black uppercase px-2 py-0.5">Full</span>
                            )}
                          </div>
                          <p className="font-bold text-xs md:text-sm text-gray-700 dark:text-gray-300">
                            Leader: <span className="text-bauhaus-primary font-black">{leader?.name || 'Unknown'}</span>
                          </p>
                          <p className="font-bold text-xs md:text-sm text-gray-700 dark:text-gray-300">
                            Members: {memberCount} / {teamMax}
                          </p>
                        </div>

                        <button 
                          disabled={loading || !regStatus.isOpen || !!myTeam || isFull}
                          onClick={async () => {
                            if (myTeam) {
                              setError(`You are already a member of team "${myTeam.name}".`);
                              return;
                            }
                            if (!regStatus.isOpen) {
                              setError(regStatus.message);
                              return;
                            }
                            setLoading(true);
                            try {
                              await axios.post('/api/teams/request-join', { team_id: team.id }, {
                                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                              });
                              setError('Join request sent to the team leader!');
                            } catch (err: any) {
                              setError(err.response?.data?.error || 'Failed to send request');
                            } finally {
                              setLoading(false);
                            }
                          }}
                          className="bauhaus-button py-2 px-5 text-xs uppercase tracking-wider w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        >
                          {isUserInThisTeam
                            ? 'Current Team'
                            : isFull
                            ? 'Team Full'
                            : myTeam
                            ? 'In Another Team'
                            : !regStatus.isOpen
                            ? 'Registration Closed'
                            : 'Request to Join'}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="pt-4 border-t-2 border-bauhaus-border flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider text-[11px]">
                      Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredTeams.length)} of {filteredTeams.length} teams
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="p-2 border-2 border-bauhaus-border font-black bg-white dark:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                        title="Previous Page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <span className="px-3 py-1.5 border-2 border-bauhaus-border font-black text-xs bg-bauhaus-primary text-white">
                        {currentPage} / {totalPages}
                      </span>

                      <button
                        type="button"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="p-2 border-2 border-bauhaus-border font-black bg-white dark:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                        title="Next Page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};