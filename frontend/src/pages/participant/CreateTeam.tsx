import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, AlertTriangle, Clock } from 'lucide-react';
import { getRegistrationStatus, EventWithTimeline, RegistrationStatus } from '../../utils/timeline';

export const CreateTeam = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [eventId, setEventId] = useState('');
  const [eventData, setEventData] = useState<EventWithTimeline | null>(null);
  const [myTeam, setMyTeam] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

      try {
        const [eventsRes, teamRes] = await Promise.allSettled([
          axios.get(`/api/events`, { headers: authHeaders }),
          axios.get(`/api/teams/my-team`, { headers: authHeaders })
        ]);

        if (eventsRes.status === 'fulfilled') {
          const res = eventsRes.value;
          const events = Array.isArray(res.data)
            ? res.data
            : res.data?.events || res.data?.data || [];

          if (events.length > 0) {
            const latest = events[0];
            const id = latest.id ?? latest._id ?? latest.event_id;
            if (id) setEventId(String(id));
            setEventData(latest);
          } else {
            setEventData(null);
          }
        }

        if (teamRes.status === 'fulfilled' && teamRes.value.data) {
          setMyTeam(teamRes.value.data);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setEventsLoading(false);
      }
    };

    fetchData();
  }, []);

  const regStatus: RegistrationStatus = getRegistrationStatus(eventData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (myTeam) {
      setError(`You are already a member of team "${myTeam.name}". You cannot create another team.`);
      return;
    }

    if (!regStatus.isOpen) {
      setError(regStatus.message);
      return;
    }

    if (!name.trim()) {
      setError('Please enter a team name.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const payload: any = { name: name.trim() };
      if (eventId) {
        payload.event_id = eventId;
      }

      console.log('Submitting team:', payload);

      const res = await axios.post(`/api/teams/create`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('Team created:', res.data);
      navigate('/participant/team');
    } catch (err: any) {
      console.error('Create team failed:', err);
      console.error('Status:', err.response?.status);
      console.error('Body:', err.response?.data);

      if (err.response?.data?.requiresProfile) {
        setError('You must complete your profile before creating a team.');
        navigate('/participant/profile');
      } else {
        setError(
          err.response?.data?.error ||
          err.response?.data?.message ||
          `Server error (${err.response?.status || 'network'}). Check backend logs.`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto mt-12">
      <div className="bauhaus-card p-6 md:p-10 bg-bauhaus-card">
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 bg-bauhaus-primary border-4 border-bauhaus-border text-white rounded-full flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.2)]">
            <Users className="w-12 h-12" />
          </div>
        </div>

        <h2 className="text-3xl md:text-4xl font-black text-center text-bauhaus-text uppercase tracking-tighter mb-8">
          Create Your Team
        </h2>

        {!eventsLoading && myTeam && (
          <div className="mb-6 p-5 border-4 border-black bg-cyan-300 text-black shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <div className="flex items-start gap-3">
              <Users className="w-6 h-6 shrink-0 text-black mt-0.5" />
              <div className="flex-1">
                <p className="font-black uppercase tracking-wider text-sm">
                  You already belong to a team!
                </p>
                <p className="text-sm font-bold mt-1 text-zinc-900">
                  You are currently a member of <span className="underline font-black">"{myTeam.name}"</span>. Participants can only belong to one team per hackathon event.
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

        {!eventsLoading && !myTeam && !regStatus.isOpen && (
          <div className="mb-6 p-4 border-4 border-black bg-yellow-300 text-black flex items-start gap-3 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            {regStatus.isClosed ? (
              <AlertTriangle className="w-6 h-6 shrink-0 text-red-600 mt-0.5" />
            ) : (
              <Clock className="w-6 h-6 shrink-0 text-amber-900 mt-0.5" />
            )}
            <div>
              <p className="font-black uppercase tracking-wider text-sm">
                {regStatus.isClosed ? 'Registration Closed' : 'Registration Not Open'}
              </p>
              <p className="text-xs font-bold mt-1 text-zinc-900">
                {regStatus.message}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-4 border-4 border-red-600 mb-6 font-bold uppercase tracking-wider text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-sm font-black uppercase tracking-widest mb-2 text-bauhaus-text">
              Team Name
            </label>
            <input
              type="text"
              required
              maxLength={50}
              disabled={!regStatus.isOpen || !!myTeam}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CODE NINJAS"
              className="w-full px-4 py-3 md:py-4 border-4 border-bauhaus-border bg-bauhaus-card text-bauhaus-text focus:outline-none focus:ring-0 focus:border-bauhaus-primary transition-colors font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={loading || eventsLoading || !regStatus.isOpen || !!myTeam}
            className="bauhaus-button w-full py-4 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {eventsLoading
              ? 'Loading...'
              : myTeam
              ? 'Already in a Team'
              : loading
              ? 'Creating...'
              : !regStatus.isOpen
              ? regStatus.isClosed ? 'Registration Closed' : 'Registration Locked'
              : 'Create Team & Get Code'}
          </button>
        </form>
      </div>
    </div>
  );
};