import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Users, 
  Copy, 
  Crown, 
  Plus, 
  LogIn, 
  Upload, 
  Mail, 
  Building2, 
  Phone, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  Lock,
  Eye
} from 'lucide-react';
import { getSubmissionStatus, SubmissionStatus } from '../../utils/timeline';

const GithubIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const LinkedinIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
  </svg>
);

export const TeamDetails = () => {
  const [team, setTeam] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchTeamAndRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/teams/my-team`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setTeam(res.data);
      if (res.data) {
        // Only load join requests if event is not strictly solo
        const isSolo = res.data.event?.team_size_min === 1 && res.data.event?.team_size_max === 1;
        if (!isSolo) {
          const reqs = await axios.get('/api/teams/join-requests', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setRequests(reqs.data || []);
        }
      }
    } catch (err) {
      console.error('Failed to load team', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamAndRequests();
  }, []);

  const handleRequestAction = async (id: string, action: 'accept' | 'reject') => {
    try {
      await axios.post(`/api/teams/join-requests/${id}/${action}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchTeamAndRequests();
    } catch (err: any) {
      alert(err.response?.data?.error || `Failed to ${action}`);
    }
  };

  const copyCode = () => {
    if (!team?.invite_code) return;
    navigator.clipboard.writeText(team.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-bauhaus-border border-t-bauhaus-primary rounded-full animate-spin"></div>
        <p className="font-black uppercase tracking-widest text-sm text-bauhaus-text">Loading Team Details...</p>
      </div>
    );
  }

  // Not enrolled in any team or solo entry
  if (!team) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto mt-12">
        <div className="bauhaus-card p-6 md:p-12 bg-bauhaus-card text-center border-4 border-bauhaus-border shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_rgba(255,255,255,0.2)]">
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-bauhaus-primary border-4 border-bauhaus-border text-white rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.2)]">
              <Users className="w-12 h-12" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-bauhaus-text uppercase tracking-tighter mb-3">
            Not In A Team Yet
          </h2>
          <p className="text-sm md:text-base font-bold text-zinc-600 dark:text-zinc-400 mb-8 max-w-md mx-auto">
            Create an entry or join an existing team with an invite code to start participating.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/participant/team/create"
              className="bauhaus-button flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-black"
            >
              <Plus className="w-5 h-5" /> Create Team / Entry
            </Link>
            <Link
              to="/participant/team/join"
              className="px-8 py-3.5 border-4 border-bauhaus-border bg-zinc-100 dark:bg-zinc-800 text-bauhaus-text font-black text-sm uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.2)] active:translate-y-0.5 active:shadow-none"
            >
              <LogIn className="w-5 h-5" /> Join Team
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if Event is Individual Participant (min=1, max=1)
  const isSoloEvent = (team.event?.team_size_min === 1 && team.event?.team_size_max === 1) || team.members?.length === 1 && team.event?.team_size_max === 1;
  const submission = team.submissions && team.submissions.length > 0 ? team.submissions[0] : null;
  const subStatus: SubmissionStatus = getSubmissionStatus(team.event);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      
      {/* Header Banner: Responsive Landscape Card */}
      <div className="bauhaus-card overflow-hidden bg-bauhaus-card border-4 border-bauhaus-border shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_rgba(255,255,255,0.2)]">
        
        {/* Cover Strip */}
        <div className="bg-gradient-to-r from-bauhaus-primary via-black to-zinc-900 text-white p-6 md:p-8 border-b-4 border-bauhaus-border flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-black uppercase px-2.5 py-1 rounded shadow ${
                isSoloEvent ? 'bg-emerald-500 text-white' : 'bg-bauhaus-accent text-black'
              }`}>
                {isSoloEvent ? 'Individual Participant' : 'Team Entry'}
              </span>
              <span className="text-xs font-bold text-zinc-300">
                {team.event?.name || 'Hackathon Event'}
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white drop-shadow-md">
              {team.name}
            </h1>
          </div>

          {/* Quick Action Button for Submission */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/participant/submission"
              className={`bauhaus-button border-4 border-black text-xs font-black uppercase tracking-wider px-6 py-3 shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center gap-2 ${
                subStatus.isLocked 
                  ? 'bg-zinc-300 text-zinc-700 hover:bg-zinc-200' 
                  : subStatus.isClosed
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-white text-black hover:bg-zinc-100 hover:text-black'
              }`}
            >
              {subStatus.isLocked ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Submissions Locked</span>
                </>
              ) : subStatus.isClosed ? (
                <>
                  <Eye className="w-4 h-4" />
                  <span>{submission ? 'View Submission (Closed)' : 'Submissions Closed'}</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>{submission ? 'Manage Submission' : 'Submit Project'}</span>
                </>
              )}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Solo / Team Details Sub-header */}
        <div className="p-6 md:p-8 bg-zinc-50 dark:bg-zinc-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b-2 border-bauhaus-border/50">
          
          {isSoloEvent ? (
            /* Solo Notice: No invite code or join requests */
            <div className="flex items-center space-x-3 text-xs font-bold text-zinc-700 dark:text-zinc-300">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-black text-sm uppercase text-black dark:text-white">Single Participant Mode</p>
                <p className="text-zinc-500 font-medium">This event is configured for individual participation. No team invites or join requests are required.</p>
              </div>
            </div>
          ) : (
            /* Team Invite Code Banner */
            <div className="flex flex-wrap items-center justify-between gap-4 w-full">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-bauhaus-primary/10 border-2 border-bauhaus-primary text-bauhaus-primary">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-[11px] font-black uppercase tracking-widest text-zinc-400">Team Invite Code</span>
                  <span className="font-mono font-black text-2xl md:text-3xl tracking-widest text-black dark:text-white">
                    {team.invite_code}
                  </span>
                </div>
              </div>

              <button
                onClick={copyCode}
                className="px-5 py-2.5 rounded-xl border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black text-xs font-black uppercase tracking-wider hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all flex items-center gap-2 shadow-sm active:scale-95"
              >
                <Copy className="w-4 h-4" />
                <span>{copied ? 'Code Copied!' : 'Copy Invite Code'}</span>
              </button>
            </div>
          )}

        </div>

      </div>

      {/* ========================================================================= */}
      {/* MEMBERS SECTION (Horizontal Grid Landscape View)                          */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-bauhaus-text flex items-center gap-2">
            <Users className="w-6 h-6 text-bauhaus-primary" />
            <span>{isSoloEvent ? 'Participant Details' : `Team Members (${team.members.length})`}</span>
          </h2>
        </div>

        {/* Horizontal Responsive Grid for Members */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.members.map((m: any, idx: number) => {
            const isLeader = idx === 0;
            const u = m.user;
            return (
              <div
                key={m.id}
                className="bauhaus-card p-6 bg-bauhaus-card border-4 border-bauhaus-border shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] flex flex-col justify-between space-y-4 hover:-translate-y-1 transition-transform"
              >
                <div>
                  {/* Top Bar: Avatar & Leader Tag */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-14 h-14 rounded-xl border-2 border-bauhaus-border bg-gradient-to-br from-bauhaus-primary to-bauhaus-secondary text-white flex items-center justify-center font-black text-2xl shadow-sm">
                      {u?.name?.[0]?.toUpperCase() || u?.email?.[0]?.toUpperCase() || 'P'}
                    </div>

                    {isLeader && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 border-2 border-amber-300 text-[10px] font-black uppercase tracking-widest shadow-sm">
                        <Crown className="w-3.5 h-3.5 text-amber-600" />
                        <span>{isSoloEvent ? 'Participant' : 'Leader'}</span>
                      </span>
                    )}
                  </div>

                  {/* Member Names & Contact */}
                  <h3 className="font-black text-lg uppercase tracking-tight text-bauhaus-text truncate">
                    {u?.name || 'Unnamed Participant'}
                  </h3>

                  <div className="space-y-1.5 pt-2 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                    <div className="flex items-center space-x-2 truncate">
                      <Mail className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      <span className="truncate">{u?.email || 'N/A'}</span>
                    </div>

                    {u?.college && (
                      <div className="flex items-center space-x-2 truncate">
                        <Building2 className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        <span className="truncate">{u.college}</span>
                      </div>
                    )}

                    {u?.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        <span>{u.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Social links (if provided) */}
                {(u?.github_url || u?.linkedin_url) && (
                  <div className="pt-3 border-t-2 border-bauhaus-border flex gap-2">
                    {u.github_url && (
                      <a href={u.github_url} target="_blank" rel="noreferrer" className="p-1.5 rounded border border-zinc-300 dark:border-zinc-700 hover:border-black text-zinc-700 dark:text-zinc-300">
                        <GithubIcon className="w-4 h-4" />
                      </a>
                    )}
                    {u.linkedin_url && (
                      <a href={u.linkedin_url} target="_blank" rel="noreferrer" className="p-1.5 rounded border border-zinc-300 dark:border-zinc-700 hover:border-black text-blue-600">
                        <LinkedinIcon className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* JOIN REQUESTS SECTION (Only visible for team events with pending requests)*/}
      {/* ========================================================================= */}
      {!isSoloEvent && requests.length > 0 && (
        <div className="bauhaus-card bg-bauhaus-accent p-6 md:p-8 border-4 border-bauhaus-border shadow-[8px_8px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between mb-6 border-b-4 border-bauhaus-border pb-3">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black flex items-center gap-2">
              <Clock className="w-6 h-6" />
              <span>Pending Join Requests ({requests.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.map((req: any) => (
              <div 
                key={req.id} 
                className="p-4 border-4 border-bauhaus-border bg-white text-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-4"
              >
                <div>
                  <h4 className="font-black text-base uppercase">{req.user?.name || 'Applicant'}</h4>
                  <p className="text-xs text-zinc-600 font-bold">{req.user?.email} • {req.user?.college || 'College N/A'}</p>
                </div>

                <div className="flex gap-3 pt-2 border-t border-zinc-200">
                  <button 
                    onClick={() => handleRequestAction(req.id, 'accept')}
                    className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase tracking-wider transition-all shadow-sm"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => handleRequestAction(req.id, 'reject')}
                    className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider transition-all shadow-sm"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};