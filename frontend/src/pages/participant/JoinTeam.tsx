import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, Key, AlertTriangle, Clock } from 'lucide-react';
import { getRegistrationStatus, EventWithTimeline, RegistrationStatus } from '../../utils/timeline';

export const JoinTeam = () => {
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teams, setTeams] = useState<any[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [eventData, setEventData] = useState<EventWithTimeline | null>(null);

  useEffect(() => {
    fetchTeamsAndEvent();
  }, []);

  const fetchTeamsAndEvent = async () => {
    try {
      const token = localStorage.getItem('token');
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

      const [teamsRes, eventRes] = await Promise.allSettled([
        axios.get('/api/teams/all', { headers: authHeaders }),
        axios.get('/api/events', { headers: authHeaders })
      ]);

      if (teamsRes.status === 'fulfilled') {
        setTeams(teamsRes.value.data || []);
      }
      if (eventRes.status === 'fulfilled') {
        const events = Array.isArray(eventRes.value.data)
          ? eventRes.value.data
          : eventRes.value.data?.events || eventRes.value.data?.data || [];
        if (events.length > 0) {
          setEventData(events[events.length - 1]);
        }
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
      alert('Joined team successfully!');
      navigate('/participant/team');
    } catch (err: any) {
      if (err.response?.data?.requiresProfile) {
        alert('You must complete your profile before joining a team.');
        navigate('/participant/profile');
      } else {
        setError(err.response?.data?.error || 'Failed to join team');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-black text-bauhaus-text uppercase tracking-tighter mb-8 shadow-white drop-shadow-[2px_2px_0px_rgba(255,255,255,1)]">Join a Team</h1>
      
      {!teamsLoading && !regStatus.isOpen && (
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
            
            <h2 className="text-2xl font-black text-center uppercase tracking-widest mb-6 text-bauhaus-text shadow-white drop-shadow-[2px_2px_0px_rgba(255,255,255,1)]">Have a Code?</h2>
            
            <form onSubmit={handleJoinByCode} className="space-y-6">
              <div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  disabled={!regStatus.isOpen}
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="6-DIGIT CODE"
                  className="w-full px-4 py-3 md:py-4 border-4 border-bauhaus-border bg-bauhaus-card text-bauhaus-text focus:outline-none focus:ring-0 focus:border-bauhaus-accent transition-colors font-black text-2xl text-center uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !regStatus.isOpen}
                className="w-full bg-black text-white border-4 border-white font-black uppercase tracking-widest px-6 py-4 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Joining...' : !regStatus.isOpen ? 'Registration Closed' : 'Join Team'}
              </button>
            </form>
          </div>
        </div>

        {/* Existing Teams List */}
        <div className="lg:col-span-2">
          <div className="bauhaus-card p-4 md:p-8 bg-bauhaus-card border-bauhaus-border">
            <div className="flex items-center gap-4 mb-8">
              <Users className="w-10 h-10 text-bauhaus-primary" />
              <h2 className="text-2xl md:text-3xl font-black text-bauhaus-text uppercase tracking-tighter">Existing Teams</h2>
            </div>

            {teamsLoading ? (
              <div className="text-center font-bold tracking-widest uppercase py-8">Loading teams...</div>
            ) : teams.length === 0 ? (
              <div className="text-center font-bold tracking-widest uppercase py-8 text-gray-500 dark:text-gray-400">No teams found.</div>
            ) : (
              <div className="space-y-4">
                {teams.map((team: any) => {
                  const leader = team.members[0]?.user;
                  const memberCount = team.members.length;
                  return (
                    <div key={team.id} className="border-4 border-bauhaus-border p-4 flex flex-col md:flex-row justify-between items-center bg-bauhaus-bg hover:bg-gray-200 dark:bg-gray-800 transition-colors">
                      <div className="mb-4 md:mb-0">
                        <h3 className="text-xl font-black uppercase tracking-widest">{team.name}</h3>
                        <p className="font-bold text-gray-700 dark:text-gray-300">Leader: <span className="text-bauhaus-primary">{leader?.name || 'Unknown'}</span></p>
                        <p className="font-bold text-gray-700 dark:text-gray-300">Members: {memberCount} / 4</p>
                      </div>
                      <button 
                        disabled={loading || !regStatus.isOpen}
                        onClick={async () => {
                          if (!regStatus.isOpen) {
                            alert(regStatus.message);
                            return;
                          }
                          setLoading(true);
                          try {
                            await axios.post('/api/teams/request-join', { team_id: team.id }, {
                              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                            });
                            alert('Join request sent to the team leader!');
                          } catch (err: any) {
                            alert(err.response?.data?.error || 'Failed to send request');
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="bauhaus-button py-2 px-6 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {!regStatus.isOpen ? 'Registration Closed' : 'Request to Join'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};