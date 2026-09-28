import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Gavel, 
  CheckCircle, 
  Sparkles, 
  X, 
  Trophy, 
  Bell, 
  Send, 
  Users, 
  FileText, 
  Search, 
  Clock, 
  AlertTriangle,
  Mail,
  Building2,
  Phone
} from 'lucide-react';

export const ManageSubmissions = () => {
  const [activeTab, setActiveTab] = useState<'submitted' | 'pending'>('submitted');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [pendingTeams, setPendingTeams] = useState<any[]>([]);
  const [stats, setStats] = useState<{ totalTeams: number; submittedTeams: number; pendingTeams: number }>({
    totalTeams: 0,
    submittedTeams: 0,
    pendingTeams: 0
  });
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [assignMessage, setAssignMessage] = useState<string | null>(null);

  // Search filter for pending teams
  const [searchQuery, setSearchQuery] = useState('');

  // Notification modal state
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null); // null = notify all
  const [customMessage, setCustomMessage] = useState(
    '⚠️ URGENT: The organizers request that your team submit your project fast before the deadline closes!'
  );
  const [notifying, setNotifying] = useState(false);

  // Leaderboard modal
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofData, setProofData] = useState<any>(null);
  const [loadingProof, setLoadingProof] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([loadSubmissions(), loadPendingTeams()]);
    setLoading(false);
  };

  const loadSubmissions = async () => {
    try {
      const subsRes = await axios.get('/api/submissions/all', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSubmissions(subsRes.data || []);
    } catch (err) {
      console.error('Failed to load submissions', err);
    }
  };

  const loadPendingTeams = async () => {
    try {
      const res = await axios.get('/api/submissions/pending-teams', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPendingTeams(res.data.pendingTeams || []);
      if (res.data.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to load pending teams', err);
    }
  };

  const loadNormalizationProof = async () => {
    setLoadingProof(true);
    setShowProofModal(true);
    try {
      const res = await axios.get('/api/organizer/events/latest/normalization-proof', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProofData(res.data);
    } catch (err) {
      console.error('Failed to load normalization proof', err);
      setAssignMessage('Failed to load normalization proof');
    } finally {
      setLoadingProof(false);
    }
  };

  const handleEqualAssign = async () => {
    setAssigning(true);
    setAssignMessage(null);

    try {
      const res = await axios.post('/api/submissions/assign-equal', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAssignMessage(res.data.message || 'Submissions equally divided among judges!');
      loadSubmissions();
    } catch (err: any) {
      setAssignMessage(err.response?.data?.error || 'Failed to assign submissions');
    } finally {
      setAssigning(false);
    }
  };

  const openNotifyModal = (team: any | null) => {
    setSelectedTeam(team);
    if (team) {
      setCustomMessage(`⚠️ URGENT for team "${team.name}": Please submit your project fast before the submission deadline passes!`);
    } else {
      setCustomMessage('⚠️ URGENT: The organizers request that your team submit your project fast before the deadline closes!');
    }
    setNotifyModalOpen(true);
  };

  const handleSendNotification = async () => {
    setNotifying(true);
    try {
      if (selectedTeam) {
        // Notify single team
        const res = await axios.post(
          `/api/submissions/notify-pending/${selectedTeam.id}`,
          { message: customMessage },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        setAssignMessage(res.data.message || `Alert sent to team "${selectedTeam.name}"!`);
      } else {
        // Notify all remaining teams
        const res = await axios.post(
          `/api/submissions/notify-all-pending`,
          { message: customMessage },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        setAssignMessage(res.data.message || 'Alert sent to all remaining pending teams!');
      }
      setNotifyModalOpen(false);
      loadPendingTeams();
      setTimeout(() => setAssignMessage(null), 6000);
    } catch (err: any) {
      setAssignMessage(err.response?.data?.error || 'Failed to send notification.');
    } finally {
      setNotifying(false);
    }
  };

  const filteredPendingTeams = pendingTeams.filter(team => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const matchTeamName = team.name?.toLowerCase().includes(q);
    const matchCode = team.invite_code?.toLowerCase().includes(q);
    const matchMember = team.members?.some((m: any) => 
      m.user?.name?.toLowerCase().includes(q) ||
      m.user?.email?.toLowerCase().includes(q) ||
      m.user?.college?.toLowerCase().includes(q)
    );
    return matchTeamName || matchCode || matchMember;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Panel */}
      <div className="bauhaus-card p-6 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-2 border-red-500 font-mono text-[10px] font-black uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-red-600" />
              <span>Submissions & Teams Management</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
              Manage Submissions
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mt-0.5">
              Review project submissions, track remaining pending teams, and broadcast urgent submission alerts.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadNormalizationProof}
              className="px-4 py-2.5 bg-black dark:bg-zinc-800 hover:bg-red-600 dark:hover:bg-red-600 text-white font-black text-xs uppercase tracking-wider border-2 border-black dark:border-zinc-700 shadow-[4px_4px_0px_rgba(0,0,0,0.3)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.1)] transition flex items-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              Leaderboard
            </button>
            <button
              onClick={handleEqualAssign}
              disabled={assigning || submissions.length === 0}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Gavel className="w-4 h-4" />
              {assigning ? 'Dividing...' : 'Auto-Assign Equally'}
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t-2 border-zinc-200 dark:border-zinc-800">
          <div className="bg-zinc-50 dark:bg-zinc-800/80 p-3.5 border-2 border-black dark:border-zinc-700 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">Total Teams</span>
              <span className="text-xl font-black text-zinc-900 dark:text-white">{stats.totalTeams || pendingTeams.length + submissions.length}</span>
            </div>
            <Users className="w-6 h-6 text-zinc-400" />
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3.5 border-2 border-emerald-600 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">Submitted Projects</span>
              <span className="text-xl font-black text-emerald-800 dark:text-emerald-200">{submissions.length}</span>
            </div>
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/40 p-3.5 border-2 border-amber-600 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 block">Remaining / Pending</span>
              <span className="text-xl font-black text-amber-900 dark:text-amber-200">{pendingTeams.length}</span>
            </div>
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Action Notice Alert */}
      {assignMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 p-4 border-2 border-emerald-500 flex items-center justify-between gap-3 font-bold text-sm shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{assignMessage}</span>
          </div>
          <button onClick={() => setAssignMessage(null)} className="text-emerald-800 dark:text-emerald-300 hover:opacity-75 font-black text-xs uppercase">
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b-4 border-black dark:border-white pb-2">
        <button
          onClick={() => setActiveTab('submitted')}
          className={`px-5 py-3 font-black text-xs uppercase tracking-wider border-2 border-black dark:border-white transition-all flex items-center gap-2 ${
            activeTab === 'submitted'
              ? 'bg-black text-white dark:bg-white dark:text-black shadow-[4px_4px_0px_rgba(220,38,38,1)] -translate-y-0.5'
              : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-500" />
          <span>Submitted Projects ({submissions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`px-5 py-3 font-black text-xs uppercase tracking-wider border-2 border-black dark:border-white transition-all flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'bg-red-600 text-white shadow-[4px_4px_0px_rgba(0,0,0,1)] -translate-y-0.5'
              : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
          }`}
        >
          <Bell className="w-4 h-4 text-amber-400" />
          <span>Remaining Teams Pending Submission ({pendingTeams.length})</span>
          {pendingTeams.length > 0 && (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SUBMITTED PROJECTS                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'submitted' && (
        <div className="bauhaus-card bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-800/80 border-b-4 border-black dark:border-zinc-700">
                  <th className="px-4 md:px-6 py-3.5 text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Team</th>
                  <th className="px-4 md:px-6 py-3.5 text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Project Title</th>
                  <th className="px-4 md:px-6 py-3.5 text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Assigned Judge(s)</th>
                  <th className="px-4 md:px-6 py-3.5 text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Links</th>
                  <th className="px-4 md:px-6 py-3.5 text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-zinc-200 dark:divide-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-medium">Loading submissions...</span>
                      </div>
                    </td>
                  </tr>
                ) : submissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                      <Gavel className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                      <p className="font-bold text-sm">No submissions recorded yet.</p>
                      <p className="text-xs mt-1">Switch to the "Remaining Teams" tab to notify participants to submit.</p>
                    </td>
                  </tr>
                ) : (
                  submissions.map(sub => {
                    const assignedJudges = sub.assignments?.map((a: any) => a.judge?.user?.name || a.judge?.user?.staff_id || a.judge?.display_name).filter(Boolean) || [];
                    return (
                      <tr key={sub.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                        <td className="px-4 md:px-6 py-4">
                          <div className="font-black text-sm uppercase text-zinc-900 dark:text-white">{sub.team?.name || 'Unknown Team'}</div>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <div className="text-sm font-bold text-zinc-900 dark:text-white line-clamp-2" title={sub.title}>{sub.title}</div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-1">{sub.description}</div>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          {assignedJudges.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {assignedJudges.map((jName: string, idx: number) => (
                                <span key={idx} className="inline-flex items-center text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 px-2.5 py-1 border-2 border-black dark:border-zinc-700">
                                  {jName}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <div className="flex flex-col space-y-1.5">
                            {sub.repo_url && <a href={sub.repo_url} target="_blank" rel="noreferrer" className="text-xs text-red-600 dark:text-red-400 hover:underline font-black uppercase">GitHub ↗</a>}
                            {sub.demo_video_url && <a href={sub.demo_video_url} target="_blank" rel="noreferrer" className="text-xs text-red-600 dark:text-red-400 hover:underline font-black uppercase">Video ↗</a>}
                            {sub.pdf_url && <a href={sub.pdf_url} target="_blank" rel="noreferrer" className="text-xs text-red-600 dark:text-red-400 hover:underline font-black uppercase">PDF ↗</a>}
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400 font-medium whitespace-nowrap">
                          {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: REMAINING TEAMS PENDING SUBMISSION                                  */}
      {/* ========================================================================= */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {/* Controls Strip */}
          <div className="bg-white dark:bg-zinc-900 p-4 border-4 border-black dark:border-white shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.2)] flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Search remaining teams or members..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border-2 border-black dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-red-600"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Notify All Button */}
            <button
              onClick={() => openNotifyModal(null)}
              disabled={pendingTeams.length === 0}
              className="w-full md:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Bell className="w-4 h-4" />
              <span>Notify All Remaining Teams ({pendingTeams.length})</span>
            </button>
          </div>

          {/* Pending Teams List */}
          <div className="bauhaus-card bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-100 dark:bg-zinc-800/80 border-b-4 border-black dark:border-zinc-700">
                    <th className="px-4 md:px-6 py-3.5 text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Team Details</th>
                    <th className="px-4 md:px-6 py-3.5 text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Team Members & Leader</th>
                    <th className="px-4 md:px-6 py-3.5 text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Submission Status</th>
                    <th className="px-4 md:px-6 py-3.5 text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Alert Status</th>
                    <th className="px-4 md:px-6 py-3.5 text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-zinc-200 dark:divide-zinc-800">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm font-medium">Loading remaining teams...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredPendingTeams.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                        <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <p className="font-bold text-sm text-zinc-900 dark:text-white">
                          {searchQuery ? 'No remaining teams match your search.' : 'All registered teams have submitted their projects! 🎉'}
                        </p>
                        <p className="text-xs mt-1">100% submission rate achieved.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPendingTeams.map(team => {
                      const leader = team.members?.[0]?.user;
                      const memberCount = team.members?.length || 0;
                      const hasAlert = Boolean(team.submission_alert);

                      return (
                        <tr key={team.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                          {/* Team Name & Meta */}
                          <td className="px-4 md:px-6 py-4">
                            <div className="font-black text-sm uppercase text-zinc-900 dark:text-white">{team.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-mono font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-400 dark:border-zinc-600">
                                {team.invite_code}
                              </span>
                              <span className="text-[10px] font-bold text-zinc-500">
                                {memberCount === 1 ? 'Solo Entry' : `${memberCount} Members`}
                              </span>
                            </div>
                          </td>

                          {/* Leader & Members */}
                          <td className="px-4 md:px-6 py-4">
                            {leader && (
                              <div className="space-y-0.5">
                                <div className="font-bold text-xs text-zinc-900 dark:text-white flex items-center gap-1">
                                  <span className="text-red-600 font-black">★</span>
                                  <span>{leader.name || 'Leader'}</span>
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                                  <Mail className="w-3 h-3 shrink-0" />
                                  <span>{leader.email}</span>
                                </div>
                                {leader.phone && (
                                  <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                                    <Phone className="w-3 h-3 shrink-0" />
                                    <span>{leader.phone}</span>
                                  </div>
                                )}
                                {leader.college && (
                                  <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-xs">
                                    <Building2 className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{leader.college}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-4 md:px-6 py-4">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-500 font-bold text-[11px] uppercase tracking-wider">
                              <Clock className="w-3 h-3" />
                              <span>Not Submitted</span>
                            </span>
                          </td>

                          {/* Alert Status */}
                          <td className="px-4 md:px-6 py-4">
                            {hasAlert ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-400 font-bold text-[10px] uppercase">
                                  <Bell className="w-3 h-3 text-red-600" />
                                  <span>Alert Active</span>
                                </span>
                                {team.last_notified_at && (
                                  <p className="text-[10px] text-zinc-500 font-medium">
                                    Notified: {new Date(team.last_notified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-zinc-400 italic">Not notified yet</span>
                            )}
                          </td>

                          {/* Action Button */}
                          <td className="px-4 md:px-6 py-4 text-right">
                            <button
                              onClick={() => openNotifyModal(team)}
                              className="px-3.5 py-1.5 bg-black dark:bg-white hover:bg-red-600 dark:hover:bg-red-600 text-white dark:text-black hover:text-white dark:hover:text-white font-black text-xs uppercase tracking-wider border-2 border-black dark:border-white shadow-[2px_2px_0px_rgba(220,38,38,1)] transition inline-flex items-center gap-1.5"
                            >
                              <Send className="w-3 h-3" />
                              <span>Notify</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NOTIFY MODAL                                                              */}
      {/* ========================================================================= */}
      {notifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[10px_10px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_rgba(255,255,255,0.2)] w-full max-w-lg p-6 space-y-5">
            
            <div className="flex justify-between items-start border-b-4 border-black dark:border-zinc-700 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-950 text-red-600 border-2 border-red-500 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase text-zinc-900 dark:text-white">
                    {selectedTeam ? `Notify Team: ${selectedTeam.name}` : `Broadcast Alert to All (${pendingTeams.length}) Remaining Teams`}
                  </h3>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                    {selectedTeam ? 'Send immediate urgent submission alert' : 'Broadcast to all teams pending submission'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setNotifyModalOpen(false)}
                className="p-1 border-2 border-black dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-red-600 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Template Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Quick Templates:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setCustomMessage('⚠️ URGENT: The organizers request that your team submit your project fast before the deadline closes!')}
                  className="px-2.5 py-1 text-[10px] font-bold border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:border-black text-zinc-700 dark:text-zinc-300"
                >
                  Deadline Alert (Default)
                </button>
                <button
                  type="button"
                  onClick={() => setCustomMessage('⏰ FINAL 1 HOUR: Submissions will close soon! Please upload your presentation deck and final repository now.')}
                  className="px-2.5 py-1 text-[10px] font-bold border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:border-black text-zinc-700 dark:text-zinc-300"
                >
                  1 Hour Left
                </button>
                <button
                  type="button"
                  onClick={() => setCustomMessage('🚨 SUBMISSION MANDATORY: Your team has not submitted yet. Complete and submit your project to be eligible for judging.')}
                  className="px-2.5 py-1 text-[10px] font-bold border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:border-black text-zinc-700 dark:text-zinc-300"
                >
                  Judging Warning
                </button>
              </div>
            </div>

            {/* Message Text Area */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white mb-1.5">
                Urgent Notification Message
              </label>
              <textarea
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                rows={3}
                required
                maxLength={250}
                className="w-full p-3 border-2 border-black dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-red-600 leading-relaxed"
                placeholder="Type your urgent submission reminder message..."
              />
              <span className="text-[10px] text-zinc-400 font-bold block text-right">
                {customMessage.length}/250 characters
              </span>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-500 text-amber-900 dark:text-amber-200 text-xs font-medium space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>How will participants see this?</span>
              </p>
              <p className="text-[11px] leading-relaxed">
                When notified, team members will immediately see a prominent high-priority alert banner across their Team Dashboard and Submission pages directing them to submit quickly.
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t-2 border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setNotifyModalOpen(false)}
                className="px-4 py-2 border-2 border-black dark:border-zinc-600 text-xs font-black uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white hover:bg-zinc-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={notifying || !customMessage.trim()}
                onClick={handleSendNotification}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{notifying ? 'Broadcasting...' : (selectedTeam ? 'Send Alert to Team' : 'Broadcast to All Teams')}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Leaderboard & Normalization Proof Modal */}
      {showProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[10px_10px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_rgba(255,255,255,0.2)] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b-4 border-black dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-red-600" />
                  Official Leaderboard & Score Normalization
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Z-Score rescaled (0–100 scale, Target μ=65, σ=15)</p>
              </div>
              <button
                onClick={() => setShowProofModal(false)}
                className="p-2 border-2 border-black dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-red-600 hover:text-white hover:border-red-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {loadingProof ? (
                <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                  <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="font-medium">Calculating Z-Scores & building leaderboard...</p>
                </div>
              ) : !proofData || proofData.leaderboard?.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                  <Trophy className="w-10 h-10 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
                  <p className="font-bold">No scored submissions yet.</p>
                  <p className="text-xs mt-1">Once judges submit scores, the leaderboard will appear here.</p>
                </div>
              ) : (
                <>
                  {/* Judge Statistics */}
                  {proofData.judgeStats && proofData.judgeStats.length > 0 && (
                    <div className="bg-zinc-50 dark:bg-zinc-800 border-2 border-black dark:border-zinc-700 p-4">
                      <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wide mb-3">Judge Performance Statistics</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {proofData.judgeStats.map((j: any, i: number) => (
                          <div key={i} className="bg-white dark:bg-zinc-900 p-3 border-2 border-zinc-200 dark:border-zinc-700 text-xs">
                            <div className="font-black text-zinc-900 dark:text-white">{j.judgeName}</div>
                            <div className="text-zinc-500 dark:text-zinc-400 mt-1">Mean (μ): <strong>{j.mean}</strong> | StdDev (σ): <strong>{j.stdDev}</strong></div>
                            <div className="text-red-600 dark:text-red-400 font-bold mt-0.5">Reviews: {j.reviewsCompleted}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Leaderboard Table */}
                  <div className="border-4 border-black dark:border-zinc-700 overflow-hidden">
                    <table className="min-w-full text-sm border-collapse">
                      <thead className="bg-zinc-100 dark:bg-zinc-800 border-b-4 border-black dark:border-zinc-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Rank</th>
                          <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Team</th>
                          <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Project</th>
                          <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Raw Score</th>
                          <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-wider text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-950/30">Normalized Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-zinc-200 dark:divide-zinc-800">
                        {proofData.leaderboard.map((item: any, rankIdx: number) => (
                          <tr key={item.submissionId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                            <td className="px-4 py-3 font-black text-zinc-900 dark:text-white">#{rankIdx + 1}</td>
                            <td className="px-4 py-3 font-black text-red-600 dark:text-red-400 uppercase">{item.teamName}</td>
                            <td className="px-4 py-3 text-zinc-800 dark:text-zinc-200 font-medium">{item.submissionTitle}</td>
                            <td className="px-4 py-3 text-center text-zinc-500 dark:text-zinc-400 font-mono">{item.rawScoreTotal} / 10</td>
                            <td className="px-4 py-3 text-center font-black text-red-700 dark:text-red-400 bg-red-50/50 dark:bg-red-950/10 text-base">
                              {item.normalizedScore} pts
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 bg-zinc-100 dark:bg-zinc-800 border-t-4 border-black dark:border-zinc-700 flex justify-end">
              <button
                onClick={() => setShowProofModal(false)}
                className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-wider border-2 border-black dark:border-white hover:bg-red-600 dark:hover:bg-red-600 dark:hover:text-white hover:border-red-600 dark:hover:border-red-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
