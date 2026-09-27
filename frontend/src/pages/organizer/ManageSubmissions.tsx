import { useState, useEffect } from 'react';
import axios from 'axios';
import { Gavel, CheckCircle, Sparkles, X, Trophy } from 'lucide-react';

export const ManageSubmissions = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [assignMessage, setAssignMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const [showProofModal, setShowProofModal] = useState(false);
  const [proofData, setProofData] = useState<any>(null);
  const [loadingProof, setLoadingProof] = useState(false);

  const loadSubmissions = async () => {
    try {
      const subsRes = await axios.get('/api/submissions/all', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSubmissions(subsRes.data);
    } catch (err) {
      console.error('Failed to load submissions', err);
    } finally {
      setLoading(false);
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
      alert('Failed to load normalization proof');
    } finally {
      setLoadingProof(false);
    }
  };

  const handleEqualAssign = async () => {
    if (!confirm('Divide all project submissions equally among all registered judges?')) return;
    setAssigning(true);
    setAssignMessage(null);

    try {
      const res = await axios.post('/api/submissions/assign-equal', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAssignMessage(res.data.message || 'Submissions equally divided among judges!');
      loadSubmissions();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to assign submissions');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bauhaus-card p-6 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-2 border-red-500 font-mono text-[10px] font-black uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-red-600" />
              <span>Submissions Panel</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
              Manage Submissions
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mt-0.5">
              View project submissions and divide them equally between judges.
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
      </div>

      {assignMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 p-4 border-2 border-emerald-500 flex items-center gap-3 font-bold text-sm">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{assignMessage}</span>
        </div>
      )}

      {/* Table */}
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
                    <p className="font-bold text-sm">No submissions found.</p>
                    <p className="text-xs mt-1">Submissions will appear here once teams submit their projects.</p>
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
