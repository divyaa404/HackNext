import React from 'react';
import { UIModal } from './UIModal';
import { Calculator, ShieldCheck, Info } from 'lucide-react';

export interface JudgeProofItem {
  judgeId: string;
  judgeName: string;
  staffId?: string;
  rawScore: number;
  mu: number;
  sigma: number;
  isZeroSigma: boolean;
  zScore: number;
  normalizedDisplayScore: number;
  formulaZ?: string;
  formulaDisplay?: string;
}

export interface ProjectProofData {
  submissionId: string;
  title: string;
  teamName: string;
  rank?: number;
  rawScoreAvg: number;
  zScoreAvg: number;
  juryScore?: number;
  communityVotesCount?: number;
  communityVoteRank?: number | null;
  communityVoteBonus?: number;
  isVotingBonusApplied?: boolean;
  finalScore: number;
  evaluationsCount: number;
  proof?: JudgeProofItem[];
  judgeEvaluations?: JudgeProofItem[];
}

interface EvaluationProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectProofData | null;
}

export const EvaluationProofModal: React.FC<EvaluationProofModalProps> = ({
  isOpen,
  onClose,
  project
}) => {
  if (!project) return null;

  const evaluations = project.judgeEvaluations || project.proof || [];
  const hasVotingBonus = Boolean(project.isVotingBonusApplied || (project.communityVoteBonus && project.communityVoteBonus > 0));

  return (
    <UIModal
      isOpen={isOpen}
      onClose={onClose}
      title="Mathematical Score Normalization & Proof"
      type="info"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Project Header Banner */}
        <div className="bg-amber-300 dark:bg-amber-500/20 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                {project.rank && (
                  <span className="bg-black text-white text-xs font-black px-2 py-0.5 uppercase tracking-wider">
                    Rank #{project.rank}
                  </span>
                )}
                <h4 className="text-xl font-black text-black dark:text-white uppercase tracking-tight">
                  {project.title}
                </h4>
              </div>
              <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                Team: {project.teamName}
              </p>
            </div>
            <div className="flex items-center gap-4 bg-white dark:bg-zinc-800 border-2 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-right">
                <div className="text-xs font-black uppercase text-zinc-500">Final Official Score</div>
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {project.finalScore.toFixed(2)}
                  <span className="text-xs text-zinc-500"> / 100</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Community Voting Bonus Callout (If active & applied) */}
        {hasVotingBonus && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border-3 border-emerald-600 dark:border-emerald-500 rounded flex items-center justify-between gap-3 shadow-[2px_2px_0px_0px_rgba(16,185,129,1)]">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🗳️</span>
              <div>
                <div className="text-xs font-black uppercase text-emerald-900 dark:text-emerald-200">
                  Community Voting Bonus Applied (Top {project.communityVoteRank || 'Award'} in Community Votes)
                </div>
                <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                  Jury Normalized Score: <strong>{(project.juryScore ?? (project.finalScore - (project.communityVoteBonus || 0))).toFixed(2)}</strong> + Community Bonus: <strong className="text-emerald-700 dark:text-emerald-300">+{project.communityVoteBonus?.toFixed(1)} pts</strong> = <strong>{project.finalScore.toFixed(2)}</strong>
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-600 text-white font-black font-mono text-xs uppercase rounded">
              +{project.communityVoteBonus?.toFixed(1)} PTS
            </span>
          </div>
        )}

        {/* 4 Metrics Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-zinc-50 dark:bg-zinc-800 border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase text-zinc-500">Raw Average (x̄)</div>
            <div className="text-lg font-black text-zinc-900 dark:text-zinc-100">
              {project.rawScoreAvg.toFixed(2)}
            </div>
            <div className="text-[10px] text-zinc-500 font-medium">Unnormalized mean</div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800 border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase text-zinc-500">Average Z-Score (z̄)</div>
            <div className={`text-lg font-black ${project.zScoreAvg >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
              {project.zScoreAvg >= 0 ? `+${project.zScoreAvg.toFixed(4)}` : project.zScoreAvg.toFixed(4)}
            </div>
            <div className="text-[10px] text-zinc-500 font-medium">Population std deviations from mean</div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800 border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase text-zinc-500">
              {hasVotingBonus ? 'Jury Score (0-100)' : 'Scaled Score (0-100)'}
            </div>
            <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">
              {(project.juryScore ?? project.finalScore).toFixed(2)}
            </div>
            <div className="text-[10px] text-zinc-500 font-medium">clamp(65 + 15·z, 0, 100)</div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800 border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase text-zinc-500">Judges (K)</div>
            <div className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              {project.evaluationsCount}
            </div>
            <div className="text-[10px] text-zinc-500 font-medium">Independent reviews</div>
          </div>
        </div>

        {/* Step-by-Step Judge Calculations */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="font-black uppercase tracking-tight text-sm flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-600" />
              Step-by-Step Audit Breakdown per Judge
            </h5>
            <span className="text-xs bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 font-bold border border-black">
              Population σ Mode
            </span>
          </div>

          {evaluations.length === 0 ? (
            <div className="p-4 border-2 border-dashed border-zinc-400 text-center text-sm font-bold text-zinc-500">
              No individual evaluations recorded yet for this project.
            </div>
          ) : (
            <div className="space-y-3">
              {evaluations.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-zinc-800 border-3 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-zinc-200 dark:border-zinc-700 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-black text-white text-xs font-black px-2 py-0.5">
                        Judge {idx + 1}
                      </span>
                      <span className="font-black text-sm text-zinc-900 dark:text-zinc-100">
                        {item.judgeName}
                      </span>
                      {item.staffId && (
                        <span className="text-xs text-zinc-500 font-bold">
                          ({item.staffId})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="bg-zinc-100 dark:bg-zinc-700 px-2 py-0.5 border border-black">
                        Raw: {item.rawScore.toFixed(2)}
                      </span>
                      <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 border border-black">
                        Z-Score: {item.zScore >= 0 ? `+${item.zScore.toFixed(3)}` : item.zScore.toFixed(3)}
                      </span>
                      <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 border border-black">
                        Display: {item.normalizedDisplayScore.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Mathematical Trace Steps */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-900/80 p-3 border border-zinc-300 dark:border-zinc-700 rounded">
                    <div>
                      <span className="font-black text-zinc-500 block mb-1">1. Judge Population Baseline:</span>
                      <div>μ = {item.mu.toFixed(2)} (Judge Mean)</div>
                      <div>
                        σ = {item.sigma.toFixed(2)} (Population StdDev)
                        {item.isZeroSigma && (
                          <span className="ml-1 text-amber-600 font-bold">[σ = 0 rule active]</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="font-black text-zinc-500 block mb-1">2. Pure Z-Score Normalization:</span>
                      <div className="text-indigo-600 dark:text-indigo-400 font-bold">
                        {item.formulaZ || `(${item.rawScore.toFixed(2)} - ${item.mu.toFixed(2)}) / ${item.sigma.toFixed(2)} = ${item.zScore.toFixed(3)}`}
                      </div>
                    </div>

                    <div className="md:col-span-2 pt-1 border-t border-zinc-200 dark:border-zinc-700">
                      <span className="font-black text-zinc-500 block mb-1">3. Presentation Scaling (0–100 Scale):</span>
                      <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {item.formulaDisplay || `clamp(65 + 15 · (${item.zScore.toFixed(3)}), 0, 100) = ${item.normalizedDisplayScore.toFixed(2)}`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mathematical Reference Card */}
        <div className="bg-zinc-100 dark:bg-zinc-800/60 border-2 border-black p-4 text-xs space-y-2">
          <div className="font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-indigo-500" />
            Mathematical Normalization Specification
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-zinc-600 dark:text-zinc-400">
            <div>
              <span className="font-bold text-black dark:text-white">Population Variance & Std Dev:</span>
              <br />
              σ = √( (1/N) · Σ(xᵢ - μ)² )
            </div>
            <div>
              <span className="font-bold text-black dark:text-white">Zero Variance Rule (σ = 0):</span>
              <br />
              If σ = 0 ⟹ z = 0.00 ⟹ Score = 65.00
            </div>
            <div>
              <span className="font-bold text-black dark:text-white">Presentation Scaling:</span>
              <br />
              S = clamp(65 + 15 · z, 0, 100)
            </div>
            <div>
              <span className="font-bold text-black dark:text-white">Strict Capacity:</span>
              <br />
              Max 25 projects per judge (C = J · 25)
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="bg-black text-white hover:bg-zinc-800 font-black uppercase text-sm px-6 py-2.5 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
          >
            Close Proof
          </button>
        </div>
      </div>
    </UIModal>
  );
};
