import { useState, useEffect, useContext, useMemo, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { 
  LogOut, 
  Wifi, 
  WifiOff, 
  Download, 
  Moon, 
  Sun, 
  FileText, 
  Code2, 
  Video, 
  ExternalLink, 
  User as UserIcon, 
  Crown,
  Search,
  Maximize2,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Layers,
  ChevronRight,
  Timer,
  HelpCircle,
  Play,
  Sliders,
  Check,
  X,
  BookOpen,
  Send,
  MessageSquare,
  ArrowRight,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Standard 4-Factor Rubric (Total = 100)
interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  maxScore: number;
}

const RUBRIC_CRITERIA: RubricCriterion[] = [
  {
    id: 'innovation',
    name: 'Innovation & Problem Solving',
    description: 'Originality of the idea, depth of problem solving, and unique value proposition.',
    maxScore: 25
  },
  {
    id: 'technical',
    name: 'Technical Architecture & Code',
    description: 'Engineering complexity, code quality, stability, and use of relevant tech stack.',
    maxScore: 25
  },
  {
    id: 'ui_ux',
    name: 'UI / UX Design & Usability',
    description: 'Visual aesthetics, user intuition, interface polish, and overall user journey.',
    maxScore: 25
  },
  {
    id: 'presentation',
    name: 'Presentation & Pitch Delivery',
    description: 'Clarity of the pitch deck, demo video completeness, and articulation of vision.',
    maxScore: 25
  }
];

interface SubmittedConfirmationData {
  teamName: string;
  projectTitle: string;
  totalScore: number;
  timeSpent: string;
  factorScores: Record<string, number>;
  feedback?: string;
}

export const JudgeDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Evaluation Scores State: { [criterionId]: number }
  const [factorScores, setFactorScores] = useState<Record<string, number>>({
    innovation: 20,
    technical: 20,
    ui_ux: 20,
    presentation: 20
  });
  const [judgeFeedback, setJudgeFeedback] = useState('');
  const [submittingScore, setSubmittingScore] = useState(false);
  const [scoreSuccessMessage, setScoreSuccessMessage] = useState<string | null>(null);
  const [submittedModalData, setSubmittedModalData] = useState<SubmittedConfirmationData | null>(null);
  const [isDeckExpanded, setIsDeckExpanded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [pdfFitMode, setPdfFitMode] = useState<'Fit' | 'FitH' | 'FitV'>('Fit');

  // Timer State (auto starts when a project is selected)
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<any>(null);
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check initial dark mode preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    loadAssignedSubmissions();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handle Project Selection & Timer Reset
  useEffect(() => {
    if (selectedSub) {
      // Reset timer to 0 and start running for this specific project
      setTimerSeconds(0);
      setIsTimerRunning(true);
      setScoreSuccessMessage(null);

      // Populate existing scores if already scored
      if (selectedSub.scores && selectedSub.scores.length > 0) {
        const initialScores: Record<string, number> = {
          innovation: 20,
          technical: 20,
          ui_ux: 20,
          presentation: 20
        };

        selectedSub.scores.forEach((sc: any) => {
          if (sc.rubric_item === 'Innovation & Problem Solving') initialScores.innovation = sc.raw_score;
          else if (sc.rubric_item === 'Technical Architecture & Code') initialScores.technical = sc.raw_score;
          else if (sc.rubric_item === 'UI / UX Design & Usability') initialScores.ui_ux = sc.raw_score;
          else if (sc.rubric_item === 'Presentation & Pitch Delivery') initialScores.presentation = sc.raw_score;
          else if (sc.rubric_item === 'Overall Evaluation' || sc.rubric_item === 'Overall Score') {
            const quarter = Math.round(sc.raw_score / 4);
            initialScores.innovation = quarter;
            initialScores.technical = quarter;
            initialScores.ui_ux = quarter;
            initialScores.presentation = quarter;
          }
        });
        setFactorScores(initialScores);
      } else {
        // Default initial score set
        setFactorScores({
          innovation: 20,
          technical: 20,
          ui_ux: 20,
          presentation: 20
        });
      }
    } else {
      setIsTimerRunning(false);
      setTimerSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [selectedSub]);

  // Live Timer Effect
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const loadAssignedSubmissions = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/submissions/my-assigned', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSubmissions(res.data);
    } catch (err) {
      console.error('Failed to load assigned submissions', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (criterionId: string, val: number) => {
    setFactorScores(prev => ({
      ...prev,
      [criterionId]: Math.max(0, Math.min(25, val))
    }));
  };

  const totalCalculatedScore = useMemo(() => {
    return Object.values(factorScores).reduce((acc, curr) => acc + curr, 0);
  }, [factorScores]);

  // Progress metrics: Count evaluated vs total
  const progressMetrics = useMemo(() => {
    const total = submissions.length;
    const evaluated = submissions.filter(s => s.scores && s.scores.length > 0).length;
    const percentage = total > 0 ? Math.round((evaluated / total) * 100) : 0;
    const pending = total - evaluated;
    return { total, evaluated, percentage, pending };
  }, [submissions]);

  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;

    setSubmittingScore(true);
    setIsTimerRunning(false); // Stop timer upon submission

    const items = RUBRIC_CRITERIA.map(crit => ({
      rubric_item: crit.name,
      raw_score: factorScores[crit.id] || 0,
      weighted_score: factorScores[crit.id] || 0
    }));

    const durationStr = formatTimer(timerSeconds);

    try {
      await axios.post(`/api/submissions/${selectedSub.id}/score`, {
        items,
        time_spent_seconds: timerSeconds,
        feedback: judgeFeedback
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      // Show comprehensive submitted confirmation modal
      setSubmittedModalData({
        teamName: selectedSub.team?.name || 'Untitled Team',
        projectTitle: selectedSub.title || 'Untitled Project',
        totalScore: totalCalculatedScore,
        timeSpent: durationStr,
        factorScores: { ...factorScores },
        feedback: judgeFeedback
      });

      setScoreSuccessMessage(`Marks Submitted: ${totalCalculatedScore}/100 awarded in ${durationStr}`);
      
      // Reload submissions to reflect scored status & progress
      const updated = await axios.get('/api/submissions/my-assigned', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSubmissions(updated.data);

      // Update active selection with latest scores
      const current = updated.data.find((s: any) => s.id === selectedSub.id);
      if (current) setSelectedSub(current);

    } catch (err: any) {
      setScoreSuccessMessage(err.response?.data?.error || 'Failed to submit evaluation scores');
      setIsTimerRunning(true); // Resume timer if failed
    } finally {
      setSubmittingScore(false);
    }
  };

  const handleNextProjectFromModal = () => {
    setSubmittedModalData(null);
    // Find next unscored project
    const nextUnscored = submissions.find(s => (!s.scores || s.scores.length === 0) && s.id !== selectedSub?.id);
    if (nextUnscored) {
      setSelectedSub(nextUnscored);
    } else {
      // If all are scored, pick next in list or return to guide
      const currentIndex = submissions.findIndex(s => s.id === selectedSub?.id);
      if (currentIndex >= 0 && currentIndex < submissions.length - 1) {
        setSelectedSub(submissions[currentIndex + 1]);
      } else {
        setSelectedSub(null); // Return to guide overview
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleExportMarks = () => {
    window.open('/api/export/score', '_blank');
  };

  const judgeName = (user as any)?.name || user?.staff_id || user?.email?.split('@')[0] || 'Judge';
  const judgeEmail = user?.email || 'N/A';
  // Use only organizer-assigned staff_id (e.g. JDG-B06C884F), never the primary UUID
  const organizerJudgeId = user?.staff_id || '';

  // Filtered submissions based on search query
  const filteredSubmissions = useMemo(() => {
    if (!searchQuery.trim()) return submissions;
    const q = searchQuery.toLowerCase();
    return submissions.filter((sub) => {
      const title = (sub.title || '').toLowerCase();
      const teamName = (sub.team?.name || '').toLowerCase();
      const leaderName = (sub.team?.members?.[0]?.user?.name || '').toLowerCase();
      return title.includes(q) || teamName.includes(q) || leaderName.includes(q);
    });
  }, [submissions, searchQuery]);

  return (
    <div className={`h-screen flex flex-col ${darkMode ? 'dark bg-black text-zinc-100' : 'bg-zinc-50 text-zinc-900'} font-sans antialiased select-none`}>
      
      {/* ========================================================================= */}
      {/* TOP NAVBAR                                                                */}
      {/* ========================================================================= */}
      <header className="h-16 shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between shadow-sm">
        
        {/* Left Side: Judge Name (Primary) & Organizer ID */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black text-sm tracking-wider shadow-sm border border-zinc-800 dark:border-zinc-200">
            {judgeName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base tracking-tight text-black dark:text-white">
                {judgeName}
              </span>
              <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-widest shadow-sm">
                Judge
              </span>
            </div>
            {organizerJudgeId ? (
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                ID: <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{organizerJudgeId}</span>
              </p>
            ) : null}
          </div>
        </div>

        {/* Center: Live Sync Status, Export & Theme Toggle */}
        <div className="flex items-center space-x-3">
          {/* Submissions Sidebar Toggle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all shadow-sm ${
              isSidebarOpen 
                ? 'border-red-600 bg-red-600 text-white' 
                : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-black dark:hover:border-white'
            }`}
            title={isSidebarOpen ? "Hide Submissions List Sidebar" : "Show Submissions List Sidebar"}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isSidebarOpen ? 'Hide Submissions' : `Submissions (${submissions.length})`}</span>
          </button>

          {/* Online/Offline Status */}
          <div 
            className={`flex items-center text-xs font-semibold px-3 py-1.5 rounded-full border transition-all shadow-sm ${
              isOnline 
                ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700' 
                : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800'
            }`}
          >
            <span className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-600'}`} />
            {isOnline ? (
              <span className="flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                <span>Online Syncing</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <WifiOff className="w-3.5 h-3.5 text-red-500" />
                <span>Offline Mode</span>
              </span>
            )}
          </div>

          {/* Export Marks Button */}
          <button
            onClick={handleExportMarks}
            className="flex items-center space-x-2 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-sm active:scale-95"
            title="Export evaluation results"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Marks</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 transition-all shadow-sm active:scale-95"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-800" />}
          </button>
        </div>

        {/* Right Side: Judge Profile Info & Logout */}
        <div className="flex items-center space-x-3">
          <div className="text-right hidden md:block">
            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[180px]">
              {judgeEmail}
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
              Evaluation Panel
            </div>
          </div>

          <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 hidden md:block" />

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-red-600 hover:border-red-400 dark:hover:border-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-bold transition-all shadow-sm active:scale-95"
            title="Sign out of judge session"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

      </header>

      {/* ========================================================================= */}
      {/* MAIN BODY LAYOUT                                                          */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ========================================================================= */}
        {/* LEFT PANEL: Project Viewer OR Comprehensive "How to Use" Instructions    */}
        {/* ========================================================================= */}
        <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-black overflow-hidden relative">
          
          {selectedSub ? (
            /* PROJECT ACTIVE EVALUATION VIEW: SPLIT-SCREEN WORKSPACE */
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              
              {/* Project Top Bar (Close Button, Team Name, Progress Bar & Auto-Timer) */}
              <div className="shrink-0 px-6 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-wrap items-center justify-between gap-4">
                
                {/* Left controls */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setSelectedSub(null)}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
                    title="Close project and view Guide / Instructions"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Close to Guide</span>
                  </button>

                  <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700" />

                  <span className="text-xs font-extrabold text-red-600 uppercase tracking-wider">
                    {selectedSub.team?.name || 'Team'}
                  </span>
                </div>

                {/* Center: Progress Bar Indicator */}
                <div className="hidden lg:flex items-center space-x-3 px-4 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    <BarChart3 className="w-3.5 h-3.5 text-red-600" />
                    <span>Progress:</span>
                    <span className="font-mono text-black dark:text-white">{progressMetrics.evaluated} / {progressMetrics.total}</span>
                    <span className="text-[11px] text-zinc-400">({progressMetrics.percentage}%)</span>
                  </div>
                  <div className="w-24 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-600 rounded-full transition-all duration-300"
                      style={{ width: `${progressMetrics.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Right: Auto Evaluation Timer Corner Box */}
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2 px-3 py-1 rounded-lg border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black shadow-sm">
                    <Timer className="w-4 h-4 text-red-500 dark:text-red-600 animate-pulse" />
                    <span className="text-xs font-mono font-black tracking-widest">
                      {formatTimer(timerSeconds)}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 ml-1">
                      {isTimerRunning ? 'Reviewing' : 'Stopped'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Split-Screen Workspace */}
              <div className="flex-1 flex overflow-hidden">
                
                {/* 1. LEFT PANEL: Full 100% Height PDF Presentation Deck Viewer */}
                <div className="flex-1 h-full flex flex-col bg-zinc-900 overflow-hidden relative border-r border-zinc-800">
                  <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-800 flex flex-wrap items-center justify-between text-white shrink-0 gap-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      <FileText className="w-4 h-4 text-red-500 shrink-0" />
                      <h2 className="text-xs font-black uppercase tracking-wider truncate">
                        Presentation Deck (Whole Slide View)
                      </h2>
                    </div>

                    {selectedSub.pdf_url && (
                      <div className="flex items-center space-x-2 shrink-0">
                        {/* Fit Mode Switcher */}
                        <div className="flex items-center bg-zinc-900 rounded border border-zinc-800 p-0.5 text-[10px] font-bold">
                          <button
                            type="button"
                            onClick={() => setPdfFitMode('Fit')}
                            className={`px-2.5 py-0.5 rounded transition ${pdfFitMode === 'Fit' ? 'bg-red-600 text-white font-black' : 'text-zinc-400 hover:text-white'}`}
                            title="Fit whole slide in viewport"
                          >
                            Fit Slide
                          </button>
                          <button
                            type="button"
                            onClick={() => setPdfFitMode('FitH')}
                            className={`px-2.5 py-0.5 rounded transition ${pdfFitMode === 'FitH' ? 'bg-red-600 text-white font-black' : 'text-zinc-400 hover:text-white'}`}
                            title="Fit slide width"
                          >
                            Fit Width
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsDeckExpanded(true)}
                          className="flex items-center space-x-1.5 px-3 py-1 text-xs font-bold rounded bg-red-600 hover:bg-red-700 text-white transition-all shadow-sm active:scale-95"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">100% Fullscreen</span>
                        </button>

                        <a
                          href={selectedSub.pdf_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center space-x-1 px-2.5 py-1 text-xs font-bold rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">New Tab</span>
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 w-full bg-zinc-950 relative overflow-hidden flex items-center justify-center p-2">
                    {selectedSub.pdf_url ? (
                      <iframe
                        src={`${selectedSub.pdf_url}#toolbar=1&navpanes=0&view=${pdfFitMode}`}
                        className="w-full h-full border-0 bg-white rounded-lg shadow-2xl"
                        title="Presentation Slides Viewer"
                      />
                    ) : (
                      <div className="w-full h-full p-8 bg-zinc-950 flex flex-col items-center justify-center text-center text-zinc-400">
                        <FileText className="w-12 h-12 text-zinc-600 mb-3" />
                        <h3 className="font-extrabold text-white text-base">Presentation Slides Not Attached</h3>
                        <p className="text-xs max-w-sm mt-1 text-zinc-500">
                          The team did not attach presentation slides for this submission. Inspect demo video & code repository links on the right panel.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. RIGHT PANEL: Team Details, Abstract, Links & Evaluation Scorecard (Non-scrolling compact) */}
                <div className="w-[460px] lg:w-[520px] xl:w-[580px] shrink-0 h-full flex flex-col justify-between bg-white dark:bg-black overflow-y-auto no-scrollbar p-4 space-y-3 border-l border-zinc-200 dark:border-zinc-800">
                  
                  {/* Top Section: Header, Team Roster, Abstract & Links */}
                  <div className="space-y-2.5">
                    {/* Team & Project Header */}
                    <div className="space-y-1.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white uppercase tracking-wider shadow-sm">
                          <Layers className="w-3 h-3 mr-1" />
                          {selectedSub.team?.name || 'Unknown Team'}
                        </span>

                        {selectedSub.team?.members?.[0]?.user?.name && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400">
                            <Crown className="w-3 h-3 mr-1 text-amber-500" />
                            Leader: {selectedSub.team.members[0].user.name}
                          </span>
                        )}
                      </div>

                      <h1 className="text-lg font-black tracking-tight text-black dark:text-white leading-snug truncate">
                        {selectedSub.title}
                      </h1>

                      {/* Team Members Roster */}
                      {selectedSub.team?.members && selectedSub.team.members.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          <span className="text-[10px] font-bold text-zinc-400 mr-1 flex items-center">
                            <UserIcon className="w-3 h-3 mr-0.5 text-red-600" />
                            Roster ({selectedSub.team.members.length}):
                          </span>
                          {selectedSub.team.members.map((m: any, idx: number) => (
                            <span
                              key={m.id || idx}
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                idx === 0
                                  ? 'bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                                  : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                              }`}
                            >
                              {m.user?.name || m.user?.email || 'Member'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Idea & Abstract Description (Compact 2-line clamp) */}
                    <div className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-1">
                      <h3 className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-red-600" />
                        Idea & Abstract
                      </h3>
                      <p className="text-zinc-800 dark:text-zinc-200 text-[11px] leading-relaxed line-clamp-2 font-medium">
                        {selectedSub.description || 'No description provided by the team.'}
                      </p>
                    </div>

                    {/* Submission Links (Compact Inline Buttons) */}
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSub.repo_url && (
                        <a 
                          href={selectedSub.repo_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex-1 inline-flex items-center justify-between px-2.5 py-1.5 rounded-md border border-black dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white font-bold text-[11px] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all shadow-sm"
                        >
                          <span className="flex items-center gap-1.5">
                            <Code2 className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            <span>Code Repo</span>
                          </span>
                          <ExternalLink className="w-3 h-3 opacity-60 ml-1" />
                        </a>
                      )}
                      {selectedSub.demo_video_url && (
                        <a 
                          href={selectedSub.demo_video_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex-1 inline-flex items-center justify-between px-2.5 py-1.5 rounded-md border border-red-600 bg-red-600 text-white font-bold text-[11px] hover:bg-red-700 transition-all shadow-sm"
                        >
                          <span className="flex items-center gap-1.5">
                            <Video className="w-3.5 h-3.5 shrink-0" />
                            <span>Demo Video</span>
                          </span>
                          <ExternalLink className="w-3 h-3 opacity-80 ml-1" />
                        </a>
                      )}
                      {selectedSub.pdf_url && (
                        <a 
                          href={selectedSub.pdf_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex-1 inline-flex items-center justify-between px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-bold text-[11px] hover:border-black dark:hover:border-white transition-all shadow-sm"
                        >
                          <span className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            <span>PDF Tab</span>
                          </span>
                          <ExternalLink className="w-3 h-3 opacity-60 ml-1" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Scorecard Form (2x2 Grid Layout) */}
                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                    <form onSubmit={handleSubmitEvaluation} className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-1">
                          <Sliders className="w-3.5 h-3.5 text-red-600" />
                          Evaluation Scorecard
                        </h4>
                        <div className="flex items-center space-x-1 px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
                          <span className="text-[10px] font-bold text-zinc-500">Total:</span>
                          <span className="text-xs font-black font-mono text-black dark:text-white">{totalCalculatedScore}</span>
                          <span className="text-[10px] font-medium text-zinc-400">/ 100</span>
                        </div>
                      </div>

                      {/* Inline Confirmation */}
                      {scoreSuccessMessage && (
                        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-[11px] font-bold flex items-center justify-between shadow-sm">
                          <div className="flex items-center space-x-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{scoreSuccessMessage}</span>
                          </div>
                        </div>
                      )}

                      {/* 4 Scorecards in 1 Single Row */}
                      <div className="grid grid-cols-4 gap-2">
                        {RUBRIC_CRITERIA.map((criterion, idx) => {
                          const currentVal = factorScores[criterion.id] ?? 0;
                          const shortTitles = ['Innovation', 'Technical', 'UI / UX', 'Pitch'];
                          const pct = Math.min(100, Math.max(0, (currentVal / criterion.maxScore) * 100));

                          return (
                            <div 
                              key={criterion.id} 
                              className="p-2 rounded-lg border-2 border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 flex flex-col justify-between hover:border-red-600 dark:hover:border-red-500 transition-all shadow-[2px_2px_0px_rgba(0,0,0,0.8)] dark:shadow-[2px_2px_0px_rgba(255,255,255,0.15)] group"
                            >
                              {/* Card Header */}
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black uppercase text-zinc-900 dark:text-zinc-100 truncate" title={criterion.name}>
                                  {idx + 1}. {shortTitles[idx]}
                                </span>
                                <span className="text-[9px] font-mono font-bold text-zinc-400 shrink-0">
                                  /{criterion.maxScore}
                                </span>
                              </div>

                              {/* Number Input & Stepper Controls */}
                              <div className="flex items-center justify-between bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded my-1 px-1 py-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleScoreChange(criterion.id, Math.max(0, currentVal - 1))}
                                  className="w-5 h-6 flex items-center justify-center font-black text-xs text-zinc-600 dark:text-zinc-400 hover:text-white hover:bg-red-600 dark:hover:bg-red-600 rounded transition select-none active:scale-90"
                                  title="Decrease by 1"
                                >
                                  -
                                </button>
                                
                                <input
                                  type="number"
                                  min="0"
                                  max={criterion.maxScore}
                                  value={currentVal === 0 ? '0' : currentVal}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '') {
                                      handleScoreChange(criterion.id, 0);
                                      return;
                                    }
                                    const parsed = parseInt(val, 10);
                                    const clamped = Math.min(criterion.maxScore, Math.max(0, isNaN(parsed) ? 0 : parsed));
                                    handleScoreChange(criterion.id, clamped);
                                  }}
                                  className="w-10 text-center font-mono font-black text-sm bg-transparent text-zinc-900 dark:text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  placeholder="0"
                                />

                                <button
                                  type="button"
                                  onClick={() => handleScoreChange(criterion.id, Math.min(criterion.maxScore, currentVal + 1))}
                                  className="w-5 h-6 flex items-center justify-center font-black text-xs text-zinc-600 dark:text-zinc-400 hover:text-white hover:bg-red-600 dark:hover:bg-red-600 rounded transition select-none active:scale-90"
                                  title="Increase by 1"
                                >
                                  +
                                </button>
                              </div>

                              {/* Visual Score Fill Bar */}
                              <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full overflow-hidden mt-1">
                                <div 
                                  className="bg-red-600 h-full transition-all duration-300 rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Feedback Notes Input */}
                      <div>
                        <div className="relative">
                          <MessageSquare className="w-3.5 h-3.5 absolute left-2.5 top-2 text-zinc-400" />
                          <input
                            type="text"
                            placeholder="Optional evaluation feedback comments..."
                            value={judgeFeedback}
                            onChange={(e) => setJudgeFeedback(e.target.value)}
                            className="w-full pl-8 pr-2.5 py-1 text-[11px] rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-black dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all"
                          />
                        </div>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={submittingScore}
                        className="w-full py-2.5 rounded-lg bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-wider hover:bg-red-600 dark:hover:bg-red-600 dark:hover:text-white transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {submittingScore ? (
                          <span>Saving Evaluation...</span>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Submit Score ({totalCalculatedScore}/100)</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                </div>

              </div>

            </div>
          ) : (
            /* ========================================================================= */
            /* "HOW TO USE & JUDGE GUIDE" DASHBOARD (Shown when no project is selected)  */
            /* ========================================================================= */
            <div className="flex-1 overflow-y-auto px-6 md:px-12 py-10 space-y-10 no-scrollbar">
              
              {/* Header Banner & Left Side Progress Bar Card */}
              <div className="space-y-6 border-b border-zinc-200 dark:border-zinc-800 pb-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-extrabold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Judge Guide & Instructions</span>
                  </div>

                  {/* Evaluated Count Badge */}
                  <div className="flex items-center space-x-2 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    <TrendingUp className="w-4 h-4 text-red-600" />
                    <span>Completion Rate:</span>
                    <span className="font-mono font-black text-black dark:text-white">{progressMetrics.percentage}%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight text-black dark:text-white">
                    Evaluation Dashboard Overview
                  </h1>
                  <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
                    Review assigned projects, inspect presentation slides and demo videos, and submit scores across the 4 key evaluation factors.
                  </p>
                </div>

                {/* Left Side Comprehensive Progress Bar Card */}
                <div className="p-6 rounded-2xl border-2 border-black dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-red-600" />
                        Evaluation Progress
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {progressMetrics.evaluated} of {progressMetrics.total} assigned submissions scored ({progressMetrics.pending} remaining)
                      </p>
                    </div>

                    <div className="text-2xl font-black font-mono text-black dark:text-white">
                      {progressMetrics.evaluated} <span className="text-sm text-zinc-400">/ {progressMetrics.total}</span>
                    </div>
                  </div>

                  {/* Progress Bar Track */}
                  <div className="w-full h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5">
                    <div 
                      className="h-full bg-red-600 rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${progressMetrics.percentage}%` }}
                    />
                  </div>

                  {/* Action row */}
                  {submissions.length > 0 && (
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => {
                          const nextUnscored = submissions.find(s => !s.scores || s.scores.length === 0);
                          setSelectedSub(nextUnscored || submissions[0]);
                        }}
                        className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-black dark:bg-white text-white dark:text-black font-extrabold text-xs uppercase tracking-wider hover:bg-red-600 dark:hover:bg-red-600 dark:hover:text-white transition-all shadow-md active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{progressMetrics.pending > 0 ? `Evaluate Next Unscored Project` : `Review All Projects`}</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>

              {/* Step-by-Step Workflow Cards */}
              <div className="space-y-4">
                <h2 className="text-sm font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-red-600" />
                  Standard Evaluation Workflow
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Step 1 */}
                  <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-2">
                    <div className="w-7 h-7 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-black text-xs">
                      1
                    </div>
                    <h3 className="text-sm font-black text-black dark:text-white">Select a Project</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      Choose any assigned team from the right sidebar. Search easily by team name or leader.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-2">
                    <div className="w-7 h-7 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-black text-xs">
                      2
                    </div>
                    <h3 className="text-sm font-black text-black dark:text-white">Inspect Artifacts</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      Read through the embedded pitch deck slides, review the repository code, and watch the demo video.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-2">
                    <div className="w-7 h-7 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-black text-xs">
                      3
                    </div>
                    <h3 className="text-sm font-black text-black dark:text-white">Grade & Submit</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      Adjust scores across the 4 factors (Innovation, Tech, UI/UX, Presentation) and click Submit Evaluation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Information & Feature Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Auto Timer Section */}
                <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3 shadow-sm">
                  <div className="flex items-center space-x-2 text-red-600">
                    <Timer className="w-5 h-5" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
                      Auto Review Timer
                    </h3>
                  </div>
                  <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                      <span>Timer automatically starts from <strong>00:00</strong> as soon as a project is opened.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                      <span>Stops automatically when you click <strong>Submit Evaluation</strong> to log review duration.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                      <span>There is no strict time limit—it tracks evaluation diligence and analytics for organizers.</span>
                    </li>
                  </ul>
                </div>

                {/* Multi-Factor Rubric Section */}
                <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3 shadow-sm">
                  <div className="flex items-center space-x-2 text-red-600">
                    <Sliders className="w-5 h-5" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
                      4-Factor Evaluation Rubric
                    </h3>
                  </div>
                  <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                      <span><strong>Innovation (25 pts):</strong> Novelty, problem solving, creative perspective.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                      <span><strong>Technical (25 pts):</strong> Code architecture, stack implementation, stability.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                      <span><strong>UI/UX Design (25 pts):</strong> Visual polish, user journey, aesthetics.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                      <span><strong>Presentation (25 pts):</strong> Pitch delivery, slides clarity, video demo.</span>
                    </li>
                  </ul>
                </div>

                {/* Online / Offline Syncing */}
                <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3 shadow-sm">
                  <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
                    <Wifi className="w-5 h-5" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
                      Online & Offline Syncing
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    The top navbar displays your live connectivity status. All evaluations are transmitted securely to the server. If network connectivity is interrupted, the status turns red to alert you.
                  </p>
                </div>

                {/* Support & Contact Organizer */}
                <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3 shadow-sm">
                  <div className="flex items-center space-x-2 text-amber-500">
                    <HelpCircle className="w-5 h-5" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
                      Need Assistance or Reassignment?
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    If you forget your credentials, need project reassignments, or encounter grading conflicts, please reach out to the <strong>Event Organizer</strong> or <strong>Admin Desk</strong> directly.
                  </p>
                </div>

              </div>

            </div>
          )}
        </main>

        {/* ========================================================================= */}
        {/* RIGHT PANEL: Submissions List Sidebar                                     */}
        {/* ========================================================================= */}
        {isSidebarOpen && (
          <aside className="w-[340px] xl:w-[380px] shrink-0 border-l border-zinc-200 dark:border-zinc-800 flex flex-col h-full bg-zinc-50 dark:bg-black transition-all">
          
          {/* Sidebar Header & Search */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
                  Assigned Submissions
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-black text-white dark:bg-white dark:text-black">
                  {submissions.length}
                </span>
              </div>
              <button
                onClick={loadAssignedSubmissions}
                className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
                title="Refresh submissions list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search team, leader or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-black dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all"
              />
            </div>
          </div>

          {/* Submissions List (Scrollbar hidden) */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 no-scrollbar">
            {loading ? (
              <div className="space-y-3 p-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 rounded-xl bg-zinc-200 dark:bg-zinc-900 animate-pulse border border-zinc-300 dark:border-zinc-800" />
                ))}
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <FileText className="w-8 h-8 text-zinc-400 mx-auto" />
                <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                  {searchQuery ? 'No matching submissions found' : 'No submissions assigned to you yet'}
                </p>
                <p className="text-[11px] text-zinc-400">
                  {searchQuery ? 'Try another keyword' : 'Check back after organizer distributes teams.'}
                </p>
              </div>
            ) : (
              filteredSubmissions.map((sub) => {
                const isSelected = selectedSub?.id === sub.id;
                const leaderName = sub.team?.members?.[0]?.user?.name || 'Leader Not Assigned';
                const hasScore = sub.scores && sub.scores.length > 0;
                
                // Calculate total score from scores array
                const totalScore = hasScore 
                  ? sub.scores.reduce((sum: number, s: any) => sum + (s.raw_score || 0), 0)
                  : null;

                return (
                  <button
                    key={sub.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedSub(null); // Click to toggle / unselect back to guide
                      } else {
                        setSelectedSub(sub);
                      }
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-150 relative group ${
                      isSelected
                        ? 'border-black dark:border-white bg-white dark:bg-zinc-900 shadow-md ring-1 ring-black dark:ring-white'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-400 dark:hover:border-zinc-700 shadow-sm'
                    }`}
                  >
                    {/* Active Accent Indicator */}
                    {isSelected && (
                      <span className="absolute left-0 top-3 bottom-3 w-1.5 bg-red-600 rounded-r-full" />
                    )}

                    <div className="flex items-start justify-between gap-2 mb-1.5 pl-1.5">
                      <span className="font-extrabold text-xs uppercase tracking-wider text-red-600 dark:text-red-500 truncate max-w-[200px]">
                        {sub.team?.name || 'Untitled Team'}
                      </span>
                      
                      {hasScore ? (
                        <span className="flex items-center text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> {totalScore}/100
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 shrink-0">
                          Pending
                        </span>
                      )}
                    </div>

                    <h4 className={`font-bold text-sm line-clamp-2 mb-2 pl-1.5 transition-colors ${
                      isSelected ? 'text-black dark:text-white' : 'text-zinc-800 dark:text-zinc-200'
                    }`}>
                      {sub.title || 'Untitled Submission'}
                    </h4>

                    {/* Leader info & indicators */}
                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 pl-1.5 mt-1">
                      <div className="flex items-center space-x-1.5 truncate">
                        <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="truncate max-w-[160px] font-medium text-[11px] text-zinc-700 dark:text-zinc-300">
                          {leaderName}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        {sub.pdf_url && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            PDF
                          </span>
                        )}
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'translate-x-0.5 text-red-600' : 'text-zinc-400 opacity-0 group-hover:opacity-100'}`} />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>
        )}

      </div>

      {/* ========================================================================= */}
      {/* SUBMISSION CONFIRMATION MODAL (Rich Submitted Marks Summary)              */}
      {/* ========================================================================= */}
      {submittedModalData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl border-2 border-black dark:border-zinc-700 shadow-2xl p-6 md:p-8 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-black dark:text-white">
                    Evaluation Marks Submitted!
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Your evaluation has been recorded and synchronized with the organizer.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSubmittedModalData(null)}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score & Project Details Summary */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-600 text-white">
                    {submittedModalData.teamName}
                  </span>
                  <h4 className="font-extrabold text-sm text-black dark:text-white mt-1.5">
                    {submittedModalData.projectTitle}
                  </h4>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-black font-mono text-black dark:text-white">
                    {submittedModalData.totalScore} <span className="text-xs text-zinc-400">/ 100</span>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400">
                    Time: {submittedModalData.timeSpent}
                  </span>
                </div>
              </div>

              {/* Rubric Breakdown Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                {RUBRIC_CRITERIA.map(crit => (
                  <div key={crit.id} className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-xs">
                    <span className="text-zinc-600 dark:text-zinc-400 truncate pr-1 text-[11px] font-medium">{crit.name}:</span>
                    <span className="font-mono font-bold text-black dark:text-white">{submittedModalData.factorScores[crit.id] || 0}/25</span>
                  </div>
                ))}
              </div>

              {submittedModalData.feedback && (
                <div className="text-xs text-zinc-600 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-800 italic">
                  "{submittedModalData.feedback}"
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setSubmittedModalData(null)}
                className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Stay on Project
              </button>

              <button
                type="button"
                onClick={handleNextProjectFromModal}
                className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black font-extrabold text-xs uppercase tracking-wider hover:bg-red-600 dark:hover:bg-red-600 dark:hover:text-white transition-all shadow-md active:scale-95"
              >
                <span>Proceed to Next Project</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULLSCREEN PRESENTATION DECK MODAL (100% Viewport Inspection)             */}
      {/* ========================================================================= */}
      {isDeckExpanded && selectedSub?.pdf_url && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col p-4 md:p-6 space-y-3 animate-fadeIn">
          {/* Header Bar */}
          <div className="flex items-center justify-between text-white border-b border-zinc-800 pb-3">
            <div className="flex items-center space-x-3 min-w-0">
              <FileText className="w-5 h-5 text-red-600 shrink-0" />
              <h3 className="text-base font-black uppercase tracking-wider truncate">
                {selectedSub.team?.name || 'Team'} — {selectedSub.title} (Presentation Deck)
              </h3>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <a
                href={selectedSub.pdf_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg border border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in New Tab</span>
              </a>

              <button
                type="button"
                onClick={() => setIsDeckExpanded(false)}
                className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg bg-red-600 hover:bg-red-700 text-white transition shadow"
              >
                <X className="w-4 h-4" />
                <span>Close Fullscreen</span>
              </button>
            </div>
          </div>

          {/* Fullscreen iFrame Container */}
          <div className="flex-1 w-full bg-white rounded-2xl overflow-hidden border-2 border-white shadow-2xl">
            <iframe
              src={`${selectedSub.pdf_url}#toolbar=1&navpanes=1&scrollbar=1`}
              className="w-full h-full border-0 bg-white"
              title="Expanded Fullscreen Presentation Viewer"
            />
          </div>
        </div>
      )}

    </div>
  );
};
