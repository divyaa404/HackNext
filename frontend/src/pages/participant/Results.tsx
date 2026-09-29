import { useEffect, useState } from 'react';
import axios from 'axios';
import { Trophy, Medal, Award, ExternalLink, RefreshCw, Calculator } from 'lucide-react';
import { EvaluationProofModal, ProjectProofData } from '../../components/EvaluationProofModal';

export const Results = () => {
  const [data, setData] = useState<{ eventName?: string; results?: any[]; displayParameters?: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProofProject, setSelectedProofProject] = useState<ProjectProofData | null>(null);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get('/api/public/events/latest/public/results');
      setData(res.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Results for this hackathon have not been published by the organizer yet. Check back soon!');
      } else {
        setError('Failed to load results.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 space-y-8">
      {/* Header Banner */}
      <div className="bauhaus-card p-6 md:p-8 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border-2 border-amber-500 font-mono text-[10px] font-black uppercase tracking-wider mb-2">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>Official Leaderboard</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
              {data?.eventName ? `${data.eventName} Results` : 'Hackathon Results & Rankings'}
            </h1>
            <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 font-medium mt-1">
              Statistically normalized Z-score rankings (Population σ, Baseline Mean = 65.0, StdDev = 15.0).
            </p>
          </div>

          <button
            onClick={loadResults}
            className="self-start md:self-auto px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white border-2 border-black dark:border-zinc-600 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-black dark:border-white border-t-red-600 rounded-full animate-spin mx-auto"></div>
          <p className="font-black text-xs uppercase tracking-widest text-zinc-500">Compiling official leaderboard scores...</p>
        </div>
      ) : error ? (
        <div className="bauhaus-card p-12 text-center bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] space-y-4">
          <div className="w-16 h-16 bg-amber-100 text-amber-700 border-4 border-black rounded-full flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black uppercase text-zinc-900 dark:text-white">Results Pending</h2>
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">{error}</p>
        </div>
      ) : (!data?.results || data.results.length === 0) ? (
        <div className="bauhaus-card p-12 text-center bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)]">
          <p className="text-sm font-black uppercase text-zinc-500">No project evaluations recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.results.map((item: any, index: number) => {
            const isFirst = index === 0;
            const isSecond = index === 1;
            const isThird = index === 2;

            return (
              <div
                key={item.id}
                className={`bauhaus-card p-5 md:p-6 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.2)] flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isFirst ? 'border-amber-400 dark:border-amber-400 bg-gradient-to-r from-amber-50/50 to-white dark:from-amber-950/20 dark:to-zinc-900' : ''
                }`}
              >
                <div className="flex items-start md:items-center space-x-4">
                  {/* Rank Badge */}
                  <div
                    className={`w-12 h-12 flex-shrink-0 border-3 border-black flex items-center justify-center font-black text-lg rounded shadow-[2px_2px_0px_rgba(0,0,0,1)] ${
                      isFirst
                        ? 'bg-amber-400 text-black'
                        : isSecond
                        ? 'bg-zinc-300 text-black'
                        : isThird
                        ? 'bg-amber-700 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {isFirst ? <Trophy className="w-6 h-6" /> : isSecond ? <Medal className="w-6 h-6" /> : isThird ? <Award className="w-6 h-6" /> : `#${index + 1}`}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
                        {item.title}
                      </h3>
                      {isFirst && (
                        <span className="px-2 py-0.5 bg-amber-400 text-black text-[10px] font-black uppercase tracking-wider border border-black rounded">
                          Winner
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-red-600 dark:text-red-400 mt-0.5">
                      Team: {item.teamName}
                    </p>
                    {item.description && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium line-clamp-1 mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Score & Links */}
                <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-zinc-200 dark:border-zinc-800 flex-wrap">
                  <div className="text-left md:text-right">
                    <span className="text-xs font-black uppercase text-zinc-500 block">Normalized</span>
                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      {typeof item.totalScore === 'number' ? item.totalScore.toFixed(1) : item.totalScore} <span className="text-xs text-zinc-400">/ 100</span>
                    </span>
                  </div>

                  {item.proof && item.proof.length > 0 && (
                    <button
                      onClick={() => setSelectedProofProject({
                        submissionId: item.id,
                        title: item.title,
                        teamName: item.teamName,
                        rank: item.rank || (index + 1),
                        rawScoreAvg: item.rawScoreAvg || 0,
                        zScoreAvg: item.zScoreAvg || 0,
                        finalScore: item.totalScore || 0,
                        evaluationsCount: item.evaluationsCount || item.proof.length,
                        proof: item.proof
                      })}
                      className="px-3 py-1.5 bg-amber-300 hover:bg-amber-400 text-black border-2 border-black font-black text-xs uppercase flex items-center gap-1 transition shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      <span>Math Proof</span>
                    </button>
                  )}

                  {item.repo_url && (
                    <a
                      href={item.repo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white border-2 border-black dark:border-zinc-600 font-black text-xs uppercase flex items-center gap-1 transition"
                    >
                      <span>Code</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Proof Modal */}
      <EvaluationProofModal
        isOpen={!!selectedProofProject}
        onClose={() => setSelectedProofProject(null)}
        project={selectedProofProject}
      />
    </div>
  );
};
