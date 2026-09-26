import { useState, useEffect } from 'react';
import axios from 'axios';
import { Gavel, CheckCircle } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Manage Submissions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View project submissions and divide them equally between judges for evaluation.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadNormalizationProof}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-lg shadow transition flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5 text-emerald-200" />
            View Leaderboard & Normalization Proof
          </button>
          <button
            onClick={handleEqualAssign}
            disabled={assigning || submissions.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-lg shadow transition flex items-center gap-2 disabled:opacity-50"
          >
            <Gavel className="w-5 h-5 text-indigo-200" />
            {assigning ? 'Dividing Submissions...' : 'Auto-Assign Submissions Equally'}
          </button>
        </div>
      </div>

      {assignMessage && (
        <div className="bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 p-4 rounded-lg border border-green-200 dark:border-green-800 flex items-center gap-3 font-medium">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span>{assignMessage}</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Team</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Project Title</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assigned Judge(s)</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Links</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Submitted At</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</td></tr>
              ) : submissions.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">No submissions found.</td></tr>
              ) : (
                submissions.map(sub => {
                  const assignedJudges = sub.assignments?.map((a: any) => a.judge?.user?.name || a.judge?.user?.staff_id || a.judge?.display_name).filter(Boolean) || [];
                  return (
                    <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{sub.team?.name || 'Unknown Team'}</div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2" title={sub.title}>{sub.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">{sub.description}</div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        {assignedJudges.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {assignedJudges.map((jName: string, idx: number) => (
                              <span key={idx} className="inline-flex items-center text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 px-2.5 py-1 rounded border border-indigo-200 dark:border-indigo-800">
                                {jName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-2">
                          {sub.repo_url && <a href={sub.repo_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold">GitHub</a>}
                          {sub.demo_video_url && <a href={sub.demo_video_url} target="_blank" rel="noreferrer" className="text-xs text-red-600 dark:text-red-400 hover:underline font-bold">Video</a>}
                          {sub.pdf_url && <a href={sub.pdf_url} target="_blank" rel="noreferrer" className="text-xs text-green-600 dark:text-green-400 hover:underline font-bold">PDF</a>}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : 'N/A'}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Gavel className="w-5 h-5 text-emerald-600" />
                  Official Leaderboard & Score Normalization Proof
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Z-Score rescaled (0–100 scale, Target μ=65, σ=15)</p>
              </div>
              <button onClick={() => setShowProofModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl font-bold">×</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {loadingProof ? (
                <div className="text-center py-12 text-gray-500">Calculating Z-Scores & building leaderboard...</div>
              ) : !proofData || proofData.leaderboard?.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No scored submissions found yet. Once judges submit scores, the leaderboard will render here.</div>
              ) : (
                <>
                  {/* Judge Statistics Summary */}
                  {proofData.judgeStats && proofData.judgeStats.length > 0 && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 p-4 rounded-lg">
                      <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wide mb-2">Judge Performance Statistics</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {proofData.judgeStats.map((j: any, i: number) => (
                          <div key={i} className="bg-white dark:bg-gray-800 p-3 rounded border border-emerald-100 dark:border-gray-700 text-xs shadow-sm">
                            <div className="font-bold text-gray-900 dark:text-gray-100">{j.judgeName}</div>
                            <div className="text-gray-500 dark:text-gray-400 mt-1">Mean (μ): <strong>{j.mean}</strong> | StdDev (σ): <strong>{j.stdDev}</strong></div>
                            <div className="text-emerald-600 dark:text-emerald-400 font-medium">Reviews Completed: {j.reviewsCompleted}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Leaderboard Table */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                      <thead className="bg-gray-100 dark:bg-gray-900 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                        <tr>
                          <th className="px-4 py-3 text-left">Rank</th>
                          <th className="px-4 py-3 text-left">Team Name</th>
                          <th className="px-4 py-3 text-left">Project Title</th>
                          <th className="px-4 py-3 text-center">Avg Raw Score</th>
                          <th className="px-4 py-3 text-center bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">Final Normalized Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700 font-medium">
                        {proofData.leaderboard.map((item: any, rankIdx: number) => (
                          <tr key={item.submissionId} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                            <td className="px-4 py-3 font-bold text-gray-900 dark:text-gray-100">#{rankIdx + 1}</td>
                            <td className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400">{item.teamName}</td>
                            <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{item.submissionTitle}</td>
                            <td className="px-4 py-3 text-center text-gray-500">{item.rawScoreTotal} / 10</td>
                            <td className="px-4 py-3 text-center font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10 text-base">
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

            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button onClick={() => setShowProofModal(false)} className="bg-gray-800 text-white font-bold px-5 py-2 rounded-lg hover:bg-gray-900">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
