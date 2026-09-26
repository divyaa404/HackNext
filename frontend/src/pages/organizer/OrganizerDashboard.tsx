import { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { EventContext } from '../../components/OrganizerLayout';
import { 
  PlusSquare, 
  Calendar, 
  Users, 
  Gavel, 
  FileSpreadsheet, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Sliders, 
  ShieldCheck, 
  Sparkles, 
  FileText,
  Award,
  Edit3
} from 'lucide-react';

export const OrganizerDashboard = () => {
  const { events, selectedEventId } = useContext(EventContext);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    if (selectedEventId) {
      setIsSwitching(true);
      const timer = setTimeout(() => setIsSwitching(false), 300);
      return () => clearTimeout(timer);
    }
  }, [selectedEventId]);

  const selectedEvent = events.find(e => e.id === selectedEventId) || (events.length > 0 ? events[0] : null);

  // =========================================================================
  // 1. FIRST-RUN / NO EVENT CREATED STATE: ORGANIZER CAPABILITIES & SETUP GUIDE
  // =========================================================================
  if (!selectedEvent && events.length === 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        
        {/* Top Header Card */}
        <div className="bauhaus-card p-6 md:p-8 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_rgba(255,255,255,0.2)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-2 border-red-500 font-mono text-xs font-black uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
                <span>Root Organizer Command Center</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
                Platform Initialized & Ready
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium max-w-2xl leading-relaxed">
                Welcome to your self-hosted hackathon operations console. As the lead organizer, you have full administrative authority over event configuration, staff delegation, judging criteria, and final results.
              </p>
            </div>

            <Link
              to="/organizer/events/new"
              className="inline-flex items-center justify-center space-x-2 px-6 py-4 bg-red-600 hover:bg-red-700 text-white font-black text-sm uppercase tracking-wider border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 transition-all shrink-0"
            >
              <PlusSquare className="w-5 h-5" />
              <span>Create Your First Event</span>
            </Link>
          </div>
        </div>

        {/* Section Heading */}
        <div className="flex items-center justify-between pt-2">
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-red-600" />
            <span>Organizer Capabilities & Workflow</span>
          </h2>
        </div>

        {/* Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Event Lifecycle */}
          <div className="bauhaus-card p-6 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center font-black border-2 border-red-500 shadow-sm">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-white">
                1. Event Configuration
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                Set up hackathons with custom start/end timelines, registration deadlines, team limits (min/max size or solo mode), guidelines, and presentation deck requirements.
              </p>
            </div>
            <Link
              to="/organizer/events/new"
              className="inline-flex items-center text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400 hover:underline gap-1 pt-2"
            >
              <span>Setup New Event</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2: Staff & Judge Provisioning */}
          <div className="bauhaus-card p-6 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white flex items-center justify-center font-black border-2 border-black dark:border-white shadow-sm">
                <Gavel className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-white">
                2. Judge & Admin Staffing
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                Provision judges and assistant admins with secure, human-friendly Staff IDs (e.g. <span className="font-mono font-bold text-red-600">JDG-B06C884F</span>) and temporary passkeys with zero manual credential sharing.
              </p>
            </div>
            <Link
              to="/organizer/judges"
              className="inline-flex items-center text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-200 hover:underline gap-1 pt-2"
            >
              <span>Manage Judges</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 3: Multi-Factor Rubrics */}
          <div className="bauhaus-card p-6 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white flex items-center justify-center font-black border-2 border-black dark:border-white shadow-sm">
                <Sliders className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-white">
                3. Evaluation Rubrics
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                Configure 4-factor scoring rubrics (Innovation, Technical Complexity, UI/UX Polish, Presentation Delivery) totaling 100 points, tracked with real-time per-project evaluation timers.
              </p>
            </div>
            <Link
              to="/organizer/rubrics"
              className="inline-flex items-center text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-200 hover:underline gap-1 pt-2"
            >
              <span>Review Rubrics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 4: Participants & Submissions */}
          <div className="bauhaus-card p-6 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white flex items-center justify-center font-black border-2 border-black dark:border-white shadow-sm">
                <Users className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-white">
                4. Team & Submission Roster
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                Oversee student registrations, solo vs team enrollments, manage join requests, and inspect project slide decks, video demos, and repositories in a unified dashboard.
              </p>
            </div>
            <Link
              to="/organizer/participants"
              className="inline-flex items-center text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-200 hover:underline gap-1 pt-2"
            >
              <span>View Participants</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 5: Export Data & Analytics */}
          <div className="bauhaus-card p-6 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white flex items-center justify-center font-black border-2 border-black dark:border-white shadow-sm">
                <FileSpreadsheet className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-white">
                5. Data Export & CSV Reports
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                Export all evaluation marksheets, weighted scores, team rosters, and audit logs into standard CSV spreadsheets ready for external reporting or awards ceremony computation.
              </p>
            </div>
            <Link
              to="/organizer/export"
              className="inline-flex items-center text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-200 hover:underline gap-1 pt-2"
            >
              <span>Export Reports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 6: Offline-First Reliability */}
          <div className="bauhaus-card p-6 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white flex items-center justify-center font-black border-2 border-black dark:border-white shadow-sm">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-white">
                6. Online / Offline Sync
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                Built-in connection monitoring keeps judges and organizers informed of network status with local cache safety, ensuring score inputs are never lost during intermittent wifi outages.
              </p>
            </div>
            <div className="inline-flex items-center text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 gap-1 pt-2">
              <span>Always Active</span>
            </div>
          </div>

        </div>

      </div>
    );
  }

  // =========================================================================
  // 2. ACTIVE EVENT OVERVIEW DASHBOARD
  // =========================================================================
  const teamCount = selectedEvent?._count?.teams || 0;
  const submissionCount = selectedEvent?._count?.submissions || 0;
  const daysLeft = selectedEvent?.end_date 
    ? Math.max(0, Math.ceil((new Date(selectedEvent.end_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)))
    : 0;
  const submissionRate = teamCount > 0 ? Math.round((submissionCount / teamCount) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-black dark:border-white pb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 bg-red-600 text-white rounded">
            Active Event Dashboard
          </span>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-zinc-900 dark:text-white mt-1">
            {selectedEvent?.name || 'Event Overview'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link 
            to={`/organizer/events/${selectedEvent?.id}`} 
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_rgba(220,38,38,1)] transition"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Event</span>
          </Link>

          <Link 
            to="/organizer/events/new" 
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] transition"
          >
            <PlusSquare className="w-4 h-4" />
            <span>New Event</span>
          </Link>
        </div>
      </div>

      {isSwitching ? (
        <div className="bauhaus-card p-12 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white text-center space-y-4">
          <div className="w-10 h-10 border-4 border-black border-t-red-600 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
            Switching Event Metrics...
          </p>
        </div>
      ) : (
        <>
          {/* Top 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Total Teams */}
            <div className="bauhaus-card p-6 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] space-y-2">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                <span className="text-[11px] font-black uppercase tracking-wider">Registered Teams</span>
                <Users className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-3xl md:text-4xl font-black font-mono text-zinc-900 dark:text-white">
                {teamCount}
              </div>
              <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                {selectedEvent?.team_size_min === 1 && selectedEvent?.team_size_max === 1 ? 'Solo Participants' : `Team size ${selectedEvent?.team_size_min || 1}–${selectedEvent?.team_size_max || 4}`}
              </p>
            </div>

            {/* Submissions */}
            <div className="bauhaus-card p-6 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] space-y-2">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                <span className="text-[11px] font-black uppercase tracking-wider">Project Decks</span>
                <FileText className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-3xl md:text-4xl font-black font-mono text-zinc-900 dark:text-white">
                {submissionCount}
              </div>
              <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                {submissionRate}% submission rate
              </p>
            </div>

            {/* Judging Status */}
            <div className="bauhaus-card p-6 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] space-y-2">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                <span className="text-[11px] font-black uppercase tracking-wider">Judges System</span>
                <Gavel className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-3xl md:text-4xl font-black font-mono text-zinc-900 dark:text-white">
                Active
              </div>
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Multi-factor rubric ready</span>
              </p>
            </div>

            {/* Timeline Days */}
            <div className="bauhaus-card p-6 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] space-y-2">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                <span className="text-[11px] font-black uppercase tracking-wider">Days Remaining</span>
                <Clock className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-3xl md:text-4xl font-black font-mono text-zinc-900 dark:text-white">
                {daysLeft}
              </div>
              <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                {daysLeft === 0 ? 'Event Concluding Today' : `${daysLeft} days until deadline`}
              </p>
            </div>

          </div>

          {/* Quick Operations Strip */}
          <div className="bauhaus-card p-6 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] space-y-4">
            <h3 className="text-base font-black uppercase tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-red-600" />
              <span>Event Operations Quick Access</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Link
                to="/organizer/judges"
                className="p-3 bg-zinc-50 dark:bg-zinc-800 border-2 border-black dark:border-zinc-700 rounded-lg hover:border-red-600 transition flex flex-col items-center text-center space-y-1"
              >
                <Gavel className="w-5 h-5 text-red-600" />
                <span className="text-xs font-black uppercase text-zinc-900 dark:text-white">Judges</span>
                <span className="text-[10px] text-zinc-500">Provision Staff IDs</span>
              </Link>

              <Link
                to="/organizer/participants"
                className="p-3 bg-zinc-50 dark:bg-zinc-800 border-2 border-black dark:border-zinc-700 rounded-lg hover:border-red-600 transition flex flex-col items-center text-center space-y-1"
              >
                <Users className="w-5 h-5 text-red-600" />
                <span className="text-xs font-black uppercase text-zinc-900 dark:text-white">Participants</span>
                <span className="text-[10px] text-zinc-500">Inspect Teams</span>
              </Link>

              <Link
                to="/organizer/submissions"
                className="p-3 bg-zinc-50 dark:bg-zinc-800 border-2 border-black dark:border-zinc-700 rounded-lg hover:border-red-600 transition flex flex-col items-center text-center space-y-1"
              >
                <FileSpreadsheet className="w-5 h-5 text-red-600" />
                <span className="text-xs font-black uppercase text-zinc-900 dark:text-white">Submissions</span>
                <span className="text-[10px] text-zinc-500">View Decks</span>
              </Link>

              <Link
                to="/organizer/export"
                className="p-3 bg-zinc-50 dark:bg-zinc-800 border-2 border-black dark:border-zinc-700 rounded-lg hover:border-red-600 transition flex flex-col items-center text-center space-y-1"
              >
                <Award className="w-5 h-5 text-red-600" />
                <span className="text-xs font-black uppercase text-zinc-900 dark:text-white">Export Marks</span>
                <span className="text-[10px] text-zinc-500">CSV Sheet</span>
              </Link>
            </div>
          </div>
        </>
      )}

    </div>
  );
};
