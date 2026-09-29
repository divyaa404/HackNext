/**
 * HackNext Mathematical Evaluation & Score Normalization Engine
 * 
 * CORE PRINCIPLES & FORMULAS:
 * 1. Feasibility:
 *    Hard limit: Max 25 projects per judge (maxLoad = 25).
 *    Total capacity C = J * maxLoad.
 *    Feasible K_max = floor(C / S).
 * 
 * 2. Population Standard Deviation (sigma):
 *    mu_j = (1 / N_j) * sum_{i=1}^{N_j} x_{i,j}
 *    sigma_j = sqrt( (1 / N_j) * sum_{i=1}^{N_j} (x_{i,j} - mu_j)^2 )
 *    (Uses population sigma dividing by N_j because judge j evaluates their entire assigned population).
 * 
 * 3. Zero Variance Handling (sigma = 0):
 *    If sigma_j == 0 (judge gave identical scores to all projects):
 *    z_{i,j} = 0.0 (maps to neutral baseline mean).
 * 
 * 4. Normalization vs Display Scaling:
 *    - Pure Z-Score: z_{i,j} = (x_{i,j} - mu_j) / sigma_j   (if sigma_j > 0, else 0)
 *    - Presentation Display Scaling (0-100): S_{i,j} = clamp(65 + 15 * z_{i,j}, 0, 100)
 *    - Final Project Score: S_i = (1 / |J_i|) * sum_{j in J_i} S_{i,j}
 * 
 * 5. Reproducible Deterministic Assignments:
 *    Seeded Pseudo-Random Number Generator (Mulberry32) using assignment_seed.
 */

/**
 * Deterministic Pseudo-Random Number Generator (Mulberry32)
 */
export function createSeededRandom(seed: string | number): () => number {
  let h = 2166136261 >>> 0;
  const str = String(seed);
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  }
  return function() {
    h += 0x6D2B79F5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface FeasibilityCheck {
  isFeasible: boolean;
  requestedK: number;
  effectiveK: number;
  maxFeasibleK: number;
  maxLoadPerJudge: number;
  totalSubmissions: number;
  totalJudges: number;
  totalCapacity: number;
  totalEvaluationsNeeded: number;
  message: string;
}

/**
 * Check and enforce K feasibility against judge capacity
 */
export function checkKFeasibility(
  submissionsCount: number,
  judgesCount: number,
  requestedK: number = 2,
  maxLoadPerJudge: number = 25
): FeasibilityCheck {
  const S = Math.max(0, submissionsCount);
  const J = Math.max(0, judgesCount);

  if (S === 0 || J === 0) {
    return {
      isFeasible: false,
      requestedK,
      effectiveK: 0,
      maxFeasibleK: 0,
      maxLoadPerJudge,
      totalSubmissions: S,
      totalJudges: J,
      totalCapacity: J * maxLoadPerJudge,
      totalEvaluationsNeeded: S * requestedK,
      message: J === 0 ? 'No judges available for evaluation.' : 'No submissions available to assign.'
    };
  }

  const totalCapacity = J * maxLoadPerJudge;
  // Maximum integer K such that S * K <= totalCapacity and K <= J
  const maxFeasibleK = Math.min(J, Math.floor(totalCapacity / S));
  const effectiveK = Math.max(1, Math.min(requestedK, maxFeasibleK > 0 ? maxFeasibleK : 1));
  const totalEvaluationsNeeded = S * effectiveK;
  const isFeasible = totalEvaluationsNeeded <= totalCapacity && effectiveK <= J && maxFeasibleK >= 1;

  let message = `Feasible: K = ${effectiveK} judges/project requires ${totalEvaluationsNeeded} evaluations across ${J} judges (Capacity: ${totalCapacity}, Max load: ${maxLoadPerJudge}/judge).`;
  if (!isFeasible) {
    message = `Infeasible: ${S} projects with requested K=${requestedK} exceeds judge capacity (${totalCapacity}). Max feasible K is ${maxFeasibleK}.`;
  } else if (requestedK > maxFeasibleK) {
    message = `Requested K=${requestedK} clamped to maximum feasible K=${maxFeasibleK} to strictly honor the ${maxLoadPerJudge} project/judge limit.`;
  }

  return {
    isFeasible,
    requestedK,
    effectiveK,
    maxFeasibleK,
    maxLoadPerJudge,
    totalSubmissions: S,
    totalJudges: J,
    totalCapacity,
    totalEvaluationsNeeded,
    message
  };
}

export interface AssignmentResult {
  assignments: Array<{ judge_id: string; submission_id: string }>;
  feasibility: FeasibilityCheck;
  seed: string;
  judgeWorkloads: Record<string, number>;
  minWorkload: number;
  maxWorkload: number;
}

/**
 * Generate reproducible, balanced judge assignments strictly respecting capacity
 */
export function generateReproducibleAssignments(
  submissions: Array<{ id: string }>,
  judges: Array<{ id: string }>,
  options: {
    k?: number;
    seed?: string;
    maxLoadPerJudge?: number;
  } = {}
): AssignmentResult {
  const seed = options.seed || `HNX-SEED-${Date.now()}`;
  const maxLoad = options.maxLoadPerJudge || 25;
  const rng = createSeededRandom(seed);

  const feasibility = checkKFeasibility(submissions.length, judges.length, options.k || 2, maxLoad);
  const K = feasibility.effectiveK;

  if (K === 0 || submissions.length === 0 || judges.length === 0) {
    return {
      assignments: [],
      feasibility,
      seed,
      judgeWorkloads: {},
      minWorkload: 0,
      maxWorkload: 0
    };
  }

  const assignments: Array<{ judge_id: string; submission_id: string }> = [];
  const judgeWorkloads: Record<string, number> = {};
  judges.forEach(j => { judgeWorkloads[j.id] = 0; });

  // Deterministically shuffle submissions using seeded Fisher-Yates
  const shuffledSubmissions = [...submissions];
  for (let i = shuffledSubmissions.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffledSubmissions[i], shuffledSubmissions[j]] = [shuffledSubmissions[j], shuffledSubmissions[i]];
  }

  shuffledSubmissions.forEach((sub) => {
    const assignedJudges = new Set<string>();

    for (let kIndex = 0; kIndex < K; kIndex++) {
      // Find candidate judges: not yet assigned to this submission AND under maxLoad
      const candidateJudges = judges
        .filter(j => !assignedJudges.has(j.id) && judgeWorkloads[j.id] < maxLoad)
        .sort((a, b) => {
          const loadDiff = judgeWorkloads[a.id] - judgeWorkloads[b.id];
          if (loadDiff !== 0) return loadDiff;
          // Deterministic tie-breaking using seeded PRNG
          return rng() - 0.5;
        });

      if (candidateJudges.length > 0) {
        const selectedJudge = candidateJudges[0];
        assignedJudges.add(selectedJudge.id);
        judgeWorkloads[selectedJudge.id]++;
        assignments.push({
          judge_id: selectedJudge.id,
          submission_id: sub.id
        });
      }
    }
  });

  const workloads = Object.values(judgeWorkloads);
  const minWorkload = workloads.length > 0 ? Math.min(...workloads) : 0;
  const maxWorkload = workloads.length > 0 ? Math.max(...workloads) : 0;

  return {
    assignments,
    feasibility,
    seed,
    judgeWorkloads,
    minWorkload,
    maxWorkload
  };
}

export interface JudgeStats {
  judgeId: string;
  judgeName: string;
  staffId?: string;
  count: number;
  rawScores: number[];
  mu: number;       // Population Mean
  variance: number; // Population Variance
  sigma: number;    // Population Standard Deviation
  isZeroSigma: boolean;
}

export interface JudgeScoreEvaluationProof {
  judgeId: string;
  judgeName: string;
  staffId?: string;
  rawScore: number;
  mu: number;
  sigma: number;
  isZeroSigma: boolean;
  zScore: number;
  normalizedDisplayScore: number;
  formulaZ: string;
  formulaDisplay: string;
}

export interface ProjectLeaderboardProof {
  submissionId: string;
  title: string;
  description?: string;
  teamName: string;
  repo_url?: string | null;
  demo_video_url?: string | null;
  pdf_url?: string | null;
  evaluationsCount: number;
  rawScoreAvg: number;
  zScoreAvg: number;
  juryScore: number;          // Pure normalized jury score (0-100)
  communityVotesCount: number; // Total community votes received
  communityVoteRank?: number | null; // 1, 2, 3 rank in community votes (if any)
  communityVoteBonus: number; // Bonus points added (+5, +3, +1 or 0)
  isVotingBonusApplied: boolean; // True only if voting has ended and bonus is active
  finalScore: number;         // min(100, juryScore + communityVoteBonus)
  rank?: number;
  judgeEvaluations: JudgeScoreEvaluationProof[];
}

export interface LeaderboardCalculationResult {
  eventId: string;
  eventName: string;
  isVotingEnded: boolean;
  displayParameters: {
    targetMean: number;
    targetStdDev: number;
    formula: string;
    populationSigmaNote: string;
    zeroSigmaRule: string;
    communityVoteBonusNote: string;
  };
  judgeStats: Record<string, JudgeStats>;
  leaderboard: ProjectLeaderboardProof[];
}

export interface LeaderboardCalculationOptions {
  isVotingEnded?: boolean;
  votingBonusTop1?: number;
  votingBonusTop2?: number;
  votingBonusTop3?: number;
}

/**
 * Compute rigorous population Z-score normalization, community voting bonus (Top 3), and step-by-step proofs
 */
export function calculateEventLeaderboardWithProof(
  eventId: string,
  eventName: string,
  submissions: Array<{
    id: string;
    title: string;
    description?: string;
    repo_url?: string | null;
    demo_video_url?: string | null;
    pdf_url?: string | null;
    team?: { name?: string };
    votesCount?: number;
    _count?: { votes?: number };
    scores: Array<{
      judge_id: string;
      raw_score: number;
      weighted_score?: number;
      judge?: {
        id: string;
        user?: { name?: string | null; email?: string | null; staff_id?: string | null };
      };
    }>;
  }>,
  options: LeaderboardCalculationOptions = {}
): LeaderboardCalculationResult {
  const TARGET_MEAN = 65.0;
  const TARGET_STD = 15.0;
  const isVotingEnded = options.isVotingEnded ?? false;
  const BONUS_TOP_1 = options.votingBonusTop1 ?? 5.0;
  const BONUS_TOP_2 = options.votingBonusTop2 ?? 3.0;
  const BONUS_TOP_3 = options.votingBonusTop3 ?? 1.0;

  // 1. Group raw scores per judge
  const judgeScoresMap: Record<string, {
    judgeName: string;
    staffId?: string;
    rawScores: number[];
  }> = {};

  submissions.forEach(sub => {
    sub.scores.forEach(s => {
      const jId = s.judge_id;
      const jUser = s.judge?.user;
      const judgeName = jUser?.name || jUser?.email?.split('@')[0] || jUser?.staff_id || `Judge-${jId.substring(0, 6)}`;
      const staffId = jUser?.staff_id || undefined;

      if (!judgeScoresMap[jId]) {
        judgeScoresMap[jId] = { judgeName, staffId, rawScores: [] };
      }
      judgeScoresMap[jId].rawScores.push(Number(s.raw_score));
    });
  });

  // 2. Compute POPULATION statistics (mu and sigma) per judge
  const judgeStats: Record<string, JudgeStats> = {};

  Object.keys(judgeScoresMap).forEach(jId => {
    const { judgeName, staffId, rawScores } = judgeScoresMap[jId];
    const count = rawScores.length;
    const sum = rawScores.reduce((a, b) => a + b, 0);
    const mu = count > 0 ? sum / count : 0;
    const variance = count > 0 
      ? rawScores.reduce((acc, x) => acc + Math.pow(x - mu, 2), 0) / count 
      : 0;
    const sigma = Math.sqrt(variance);
    const isZeroSigma = sigma < 1e-9;

    judgeStats[jId] = {
      judgeId: jId,
      judgeName,
      staffId,
      count,
      rawScores,
      mu: Number(mu.toFixed(4)),
      variance: Number(variance.toFixed(4)),
      sigma: Number(sigma.toFixed(4)),
      isZeroSigma
    };
  });

  // 3. Determine Community Voting Ranks & Bonuses (Strictly applied ONLY if isVotingEnded is true)
  const voteCountMap = new Map<string, number>();
  submissions.forEach(sub => {
    const count = sub.votesCount ?? sub._count?.votes ?? 0;
    voteCountMap.set(sub.id, count);
  });

  const voteRankMap = new Map<string, { rank: number; bonus: number }>();

  if (isVotingEnded) {
    // Only rank submissions that have at least 1 vote
    const sortedByVotes = [...submissions]
      .map(s => ({ id: s.id, votes: voteCountMap.get(s.id) || 0 }))
      .filter(item => item.votes > 0)
      .sort((a, b) => b.votes - a.votes);

    // Assign dense ranks for top 3 vote counts
    const distinctVoteCounts = Array.from(new Set(sortedByVotes.map(v => v.votes)));
    const top1Votes = distinctVoteCounts[0];
    const top2Votes = distinctVoteCounts[1];
    const top3Votes = distinctVoteCounts[2];

    sortedByVotes.forEach(item => {
      if (top1Votes !== undefined && item.votes === top1Votes) {
        voteRankMap.set(item.id, { rank: 1, bonus: BONUS_TOP_1 });
      } else if (top2Votes !== undefined && item.votes === top2Votes) {
        voteRankMap.set(item.id, { rank: 2, bonus: BONUS_TOP_2 });
      } else if (top3Votes !== undefined && item.votes === top3Votes) {
        voteRankMap.set(item.id, { rank: 3, bonus: BONUS_TOP_3 });
      }
    });
  }

  // 4. Compute per-project Z-scores, scaled display scores, and mathematical proof trace
  const leaderboard: ProjectLeaderboardProof[] = submissions.map(sub => {
    const teamName = sub.team?.name || 'Unknown Team';
    const evaluations = sub.scores;

    let sumRaw = 0;
    let sumZ = 0;
    let sumDisplay = 0;

    const judgeEvaluations: JudgeScoreEvaluationProof[] = evaluations.map(s => {
      const stats = judgeStats[s.judge_id];
      const raw = Number(s.raw_score);
      sumRaw += raw;

      let zScore = 0;
      let formulaZ = `(${raw.toFixed(2)} - ${stats?.mu.toFixed(2) || '0.00'}) / 0.00 = 0.000 [sigma = 0 rule]`;

      if (stats && !stats.isZeroSigma && stats.sigma > 0) {
        zScore = (raw - stats.mu) / stats.sigma;
        formulaZ = `(${raw.toFixed(2)} - ${stats.mu.toFixed(2)}) / ${stats.sigma.toFixed(2)} = ${zScore.toFixed(3)}`;
      }

      // Display presentation scaling: clamp(65 + 15 * z, 0, 100)
      const rawScaled = TARGET_MEAN + (TARGET_STD * zScore);
      const normalizedDisplayScore = Math.min(100, Math.max(0, rawScaled));
      const formulaDisplay = `clamp(65 + 15 * (${zScore.toFixed(3)}), 0, 100) = ${normalizedDisplayScore.toFixed(2)}`;

      sumZ += zScore;
      sumDisplay += normalizedDisplayScore;

      return {
        judgeId: s.judge_id,
        judgeName: stats?.judgeName || 'Unknown Judge',
        staffId: stats?.staffId,
        rawScore: Number(raw.toFixed(2)),
        mu: stats?.mu || 0,
        sigma: stats?.sigma || 0,
        isZeroSigma: stats?.isZeroSigma ?? true,
        zScore: Number(zScore.toFixed(4)),
        normalizedDisplayScore: Number(normalizedDisplayScore.toFixed(2)),
        formulaZ,
        formulaDisplay
      };
    });

    const evalCount = evaluations.length;
    const rawScoreAvg = evalCount > 0 ? sumRaw / evalCount : 0;
    const zScoreAvg = evalCount > 0 ? sumZ / evalCount : 0;
    const juryScore = evalCount > 0 ? sumDisplay / evalCount : 0;

    const votesCount = voteCountMap.get(sub.id) || 0;
    const voteInfo = voteRankMap.get(sub.id);
    const communityVoteBonus = isVotingEnded && voteInfo ? voteInfo.bonus : 0;
    const communityVoteRank = isVotingEnded && voteInfo ? voteInfo.rank : null;

    // Final score: min(100, juryScore + communityVoteBonus)
    const finalScore = Math.min(100, Math.max(0, juryScore + communityVoteBonus));

    return {
      submissionId: sub.id,
      title: sub.title,
      description: sub.description,
      teamName,
      repo_url: sub.repo_url,
      demo_video_url: sub.demo_video_url,
      pdf_url: sub.pdf_url,
      evaluationsCount: evalCount,
      rawScoreAvg: Number(rawScoreAvg.toFixed(2)),
      zScoreAvg: Number(zScoreAvg.toFixed(4)),
      juryScore: Number(juryScore.toFixed(2)),
      communityVotesCount: votesCount,
      communityVoteRank,
      communityVoteBonus: Number(communityVoteBonus.toFixed(2)),
      isVotingBonusApplied: isVotingEnded && communityVoteBonus > 0,
      finalScore: Number(finalScore.toFixed(2)),
      judgeEvaluations
    };
  });

  // Sort descending by finalScore, tie-break by juryScore, zScoreAvg, rawScoreAvg, then votesCount
  leaderboard.sort((a, b) => {
    if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
    if (b.juryScore !== a.juryScore) return b.juryScore - a.juryScore;
    if (b.zScoreAvg !== a.zScoreAvg) return b.zScoreAvg - a.zScoreAvg;
    if (b.rawScoreAvg !== a.rawScoreAvg) return b.rawScoreAvg - a.rawScoreAvg;
    return b.communityVotesCount - a.communityVotesCount;
  });

  // Assign official final ranks
  leaderboard.forEach((item, index) => {
    item.rank = index + 1;
  });

  return {
    eventId,
    eventName,
    isVotingEnded,
    displayParameters: {
      targetMean: TARGET_MEAN,
      targetStdDev: TARGET_STD,
      formula: isVotingEnded 
        ? 'Final Score = clamp(Jury Normalized Score + Community Voting Bonus, 0, 100)'
        : 'S = clamp(65 + 15 * z, 0, 100)',
      populationSigmaNote: 'Population standard deviation sigma = sqrt( (1/N) * sum((x - mu)^2) ) is used across all N assigned project evaluations per judge.',
      zeroSigmaRule: 'When a judge assigns identical scores to all projects (sigma = 0), z is defined as 0.0, mapping to the neutral baseline mean score of 65.0.',
      communityVoteBonusNote: isVotingEnded 
        ? `Community voting concluded. Top 3 voted projects awarded bonus points: 1st place (+${BONUS_TOP_1.toFixed(1)} pts), 2nd place (+${BONUS_TOP_2.toFixed(1)} pts), 3rd place (+${BONUS_TOP_3.toFixed(1)} pts).`
        : 'Community voting in progress or pending closure. Voting bonus will be calculated and added upon voting conclusion.'
    },
    judgeStats,
    leaderboard
  };
}
