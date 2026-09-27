import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { 
  Upload, 
  Code2, 
  Video, 
  FileText, 
  CheckCircle2, 
  ExternalLink, 
  Clock, 
  FileUp,
  Lock,
  AlertCircle
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { getSubmissionStatus } from '../../utils/timeline';

export const Submission = () => {
  const { user } = useContext(AuthContext);
  const [team, setTeam] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLeader, setIsLeader] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [demoVideoUrl, setDemoVideoUrl] = useState('');
  const [pdf, setPdf] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamRes, subRes] = await Promise.all([
        axios.get(`/api/teams/my-team`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        axios.get(`/api/submissions/my-submission`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      ]);
      
      const teamData = teamRes.data;
      setTeam(teamData);
      
      if (teamData && user) {
        // First member or leader can submit
        const firstMember = teamData.members[0];
        if (firstMember && firstMember.user.id === user.id) {
          setIsLeader(true);
        } else if (teamData.members.length === 1) {
          setIsLeader(true); // Solo participant
        }
      }

      if (subRes.data) {
        setSubmission(subRes.data);
        setTitle(subRes.data.title || '');
        setDescription(subRes.data.description || '');
        setRepoUrl(subRes.data.repo_url || '');
        setDemoVideoUrl(subRes.data.demo_video_url || '');
      }
    } catch (err) {
      console.error('Failed to load submission data', err);
    } finally {
      setLoading(false);
    }
  };

  const subStatus = getSubmissionStatus(team?.event);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLeader) {
      setError('Only the team leader / solo participant can submit.');
      return;
    }

    if (!subStatus.isOpen) {
      setError(subStatus.message);
      return;
    }
    
    if (!description.trim()) {
      setError('Please provide an idea abstract and project description.');
      return;
    }
    if (description.length > 1000) {
      setError(`Abstract & Description cannot exceed 1000 characters (currently ${description.length}).`);
      return;
    }
    
    setSubmitting(true);
    setError('');
    setSuccess(false);
    setProgress(0);

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('repo_url', repoUrl.trim());
    formData.append('demo_video_url', demoVideoUrl.trim());
    if (pdf) {
      formData.append('pdf', pdf);
    }

    try {
      const res = await axios.post('/api/submissions', formData, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted);
          }
        }
      });
      setSubmission(res.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit project. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-bauhaus-border border-t-bauhaus-primary rounded-full animate-spin"></div>
        <p className="font-black uppercase tracking-widest text-sm text-bauhaus-text">Loading Submission...</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto mt-12">
        <div className="bauhaus-card p-6 md:p-12 bg-bauhaus-card text-center border-4 border-bauhaus-border shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_rgba(255,255,255,0.2)]">
          <div className="w-20 h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-6 text-zinc-400">
            <Upload className="w-10 h-10" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-bauhaus-text uppercase tracking-tighter mb-3">
            Team Enrollment Required
          </h2>
          <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-8 max-w-md mx-auto">
            You must be enrolled in a team or individual participant entry before submitting a project.
          </p>
          <Link to="/participant/team/create" className="bauhaus-button px-8 py-3.5 text-sm font-black inline-block">
            Create Team / Solo Entry
          </Link>
        </div>
      </div>
    );
  }

  const isSolo = (team.event?.team_size_min === 1 && team.event?.team_size_max === 1) || team.members?.length === 1;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      
      {/* Timeline Window Status Notice */}
      {subStatus.isLocked && (
        <div className="p-5 rounded-xl border-4 border-black dark:border-white bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] flex items-start space-x-3">
          <Lock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-black uppercase tracking-tight text-base">Submission Window Locked</h3>
            <p className="text-xs font-bold leading-relaxed">{subStatus.message}</p>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
              You can draft and review your project locally until the hackathon submission window officially opens.
            </p>
          </div>
        </div>
      )}

      {subStatus.isClosed && (
        <div className="p-5 rounded-xl border-4 border-red-600 bg-red-50 dark:bg-red-950/60 text-red-900 dark:text-red-200 shadow-[6px_6px_0px_rgba(220,38,38,1)] flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-black uppercase tracking-tight text-base">Submission Period Has Ended</h3>
            <p className="text-xs font-bold leading-relaxed">{subStatus.message}</p>
            {submission ? (
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
                Your team submitted successfully before the deadline. Project details are now locked for judge evaluation.
              </p>
            ) : (
              <p className="text-[11px] text-red-700 dark:text-red-400 font-bold">
                No project submission was recorded before the deadline passed.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Toast notifications */}
      {success && (
        <div className="p-4 rounded-xl border-4 border-bauhaus-border bg-green-500 text-white shadow-[6px_6px_0px_rgba(0,0,0,1)] flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-3 font-black uppercase tracking-wider text-sm">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <span>Project Submission Saved Successfully! Judges can now evaluate your work.</span>
          </div>
          <button onClick={() => setSuccess(false)} className="font-black text-lg px-2 hover:opacity-80">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border-4 border-red-600 bg-red-100 text-red-800 font-black uppercase tracking-wider text-sm flex items-center justify-between shadow-[4px_4px_0px_rgba(220,38,38,1)]">
          <span>{error}</span>
          <button onClick={() => setError('')} className="font-black text-lg px-2">✕</button>
        </div>
      )}

      {/* Main Responsive Grid Layout (Landscape View) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ========================================================================= */}
        {/* LEFT / PREVIEW PANEL (Overview, Attachments Preview & Status)             */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          
          <div className="bauhaus-card overflow-hidden bg-bauhaus-card border-4 border-bauhaus-border shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_rgba(255,255,255,0.2)]">
            
            {/* Header Strip */}
            <div className="bg-black text-white p-6 border-b-4 border-bauhaus-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded bg-red-600 text-white">
                  {isSolo ? 'Individual Entry' : team.name}
                </span>
                
                {submission ? (
                  <span className="inline-flex items-center text-[10px] font-black px-2.5 py-0.5 rounded bg-emerald-500 text-white shadow-sm">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Submitted
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                    Not Submitted
                  </span>
                )}
              </div>

              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white line-clamp-2">
                {title || 'Project Untitled'}
              </h2>
            </div>

            {/* Submission Status & Details */}
            <div className="p-6 space-y-4 text-xs font-medium">
              
              {submission?.submitted_at && (
                <div className="flex items-center space-x-2 text-zinc-500 dark:text-zinc-400">
                  <Clock className="w-4 h-4 shrink-0 text-red-600" />
                  <span>Last Updated: <strong className="text-black dark:text-white">{new Date(submission.submitted_at).toLocaleString()}</strong></span>
                </div>
              )}

              {/* Description preview */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">
                    Idea Abstract
                  </span>
                  <span className="text-[10px] text-zinc-400 font-bold">
                    {description.length}/1000 chars
                  </span>
                </div>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap italic bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs max-h-48 overflow-y-auto">
                  {description || 'No description provided yet.'}
                </p>
              </div>

              {/* Presentation Slide Status */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">
                  Presentation Deck
                </span>
                {submission?.pdf_url ? (
                  <div className="p-3 rounded-xl border-2 border-bauhaus-border bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-red-600 shrink-0" />
                      <span className="font-bold text-black dark:text-white">Slides Attached (PDF)</span>
                    </div>
                    <a
                      href={submission.pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 text-[11px] font-black uppercase tracking-wider rounded border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 transition-colors flex items-center gap-1"
                    >
                      <span>Preview</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <p className="text-zinc-400 italic">No presentation deck uploaded yet.</p>
                )}
              </div>

              {/* External Links Preview */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">
                  Project Links
                </span>
                <div className="flex flex-wrap gap-2">
                  {repoUrl ? (
                    <a href={repoUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold text-xs flex items-center gap-1.5 hover:border-black">
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Repository</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </a>
                  ) : null}

                  {demoVideoUrl ? (
                    <a href={demoVideoUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-bold text-xs flex items-center gap-1.5 hover:border-red-600">
                      <Video className="w-3.5 h-3.5" />
                      <span>Video Demo</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </a>
                  ) : null}

                  {!repoUrl && !demoVideoUrl && (
                    <span className="text-zinc-400 italic text-[11px]">No repository or demo video added yet.</span>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* RIGHT PANEL: Submission Form & Editor                                     */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bauhaus-card bg-bauhaus-card p-6 md:p-8 border-4 border-bauhaus-border shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_rgba(255,255,255,0.2)]">
            
            <div className="border-b-4 border-bauhaus-border pb-4 mb-6">
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-bauhaus-text flex items-center gap-2">
                {subStatus.isLocked ? <Lock className="w-6 h-6 text-amber-600" /> : <Upload className="w-6 h-6 text-bauhaus-primary" />}
                <span>
                  {subStatus.isLocked
                    ? 'Submissions Locked'
                    : subStatus.isClosed
                    ? 'Project Submission (Closed)'
                    : submission
                    ? 'Edit Project Submission'
                    : 'Submit Your Project'}
                </span>
              </h1>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">
                {subStatus.isLocked
                  ? subStatus.message
                  : subStatus.isClosed
                  ? 'Deadline has ended. Form is in read-only mode.'
                  : isLeader
                  ? 'Enter your final project details and upload your presentation'
                  : 'View only — Only team leader can modify submission'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Project Title */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-black uppercase tracking-widest text-bauhaus-text">
                    Project Title *
                  </label>
                  <span className="text-[11px] font-bold text-zinc-400">
                    {title.length}/100
                  </span>
                </div>
                <input
                  type="text"
                  value={title}
                  maxLength={100}
                  onChange={e => setTitle(e.target.value.slice(0, 100))}
                  disabled={!isLeader || !subStatus.isOpen}
                  required
                  placeholder="e.g. AI-Powered Smart Assistant"
                  className="w-full px-4 py-3 border-4 border-bauhaus-border bg-bauhaus-bg text-bauhaus-text focus:outline-none focus:border-bauhaus-primary font-bold text-base disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed"
                />
              </div>

              {/* Idea Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-black uppercase tracking-widest text-bauhaus-text">
                    Idea Abstract & Description *
                  </label>
                  <span className={`text-[11px] font-black tracking-wider ${
                    description.length >= 1000 
                      ? 'text-red-600 font-bold' 
                      : description.length >= 850 
                      ? 'text-amber-500' 
                      : 'text-zinc-400'
                  }`}>
                    {description.length} / 1000 characters
                  </span>
                </div>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value.slice(0, 1000))}
                  disabled={!isLeader || !subStatus.isOpen}
                  required
                  maxLength={1000}
                  rows={5}
                  placeholder="Describe what your project does, the problem it solves, architecture, and technology stack used (Max 1000 characters)..."
                  className="w-full px-4 py-3 border-4 border-bauhaus-border bg-bauhaus-bg text-bauhaus-text focus:outline-none focus:border-bauhaus-primary font-medium text-sm leading-relaxed disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed"
                />
                <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-1">
                  <span>Keep your abstract clear and concise for judging evaluation.</span>
                  {description.length >= 950 && (
                    <span className="text-red-500 font-bold">Approaching 1000 character limit!</span>
                  )}
                </div>
              </div>

              {/* Links Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest mb-1 text-bauhaus-text">
                    <Code2 className="w-3.5 h-3.5" /> GitHub Code Repo URL
                  </label>
                  <input
                    type="url"
                    value={repoUrl}
                    onChange={e => setRepoUrl(e.target.value)}
                    disabled={!isLeader || !subStatus.isOpen}
                    placeholder="https://github.com/username/project"
                    className="w-full px-4 py-3 border-4 border-bauhaus-border bg-bauhaus-bg text-bauhaus-text focus:outline-none focus:border-bauhaus-primary font-bold text-xs disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest mb-1 text-bauhaus-text">
                    <Video className="w-3.5 h-3.5 text-red-600" /> Demo Video URL
                  </label>
                  <input
                    type="url"
                    value={demoVideoUrl}
                    onChange={e => setDemoVideoUrl(e.target.value)}
                    disabled={!isLeader || !subStatus.isOpen}
                    placeholder="https://youtube.com/watch?v=... or Loom"
                    className="w-full px-4 py-3 border-4 border-bauhaus-border bg-bauhaus-bg text-bauhaus-text focus:outline-none focus:border-bauhaus-primary font-bold text-xs disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* PDF Presentation Upload */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest mb-1 text-bauhaus-text">
                  <FileUp className="w-3.5 h-3.5 text-bauhaus-primary" /> Presentation Deck (PDF File)
                </label>
                
                {isLeader && subStatus.isOpen && (
                  <div className="mt-1">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={e => setPdf(e.target.files?.[0] || null)}
                      className="w-full px-4 py-3 border-4 border-bauhaus-border bg-bauhaus-bg text-bauhaus-text focus:outline-none focus:border-bauhaus-primary font-medium text-xs file:mr-4 file:py-2 file:px-4 file:border-2 file:border-black file:bg-black file:text-white file:font-black file:uppercase file:text-xs file:cursor-pointer hover:file:bg-zinc-800"
                    />
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Upload your pitch deck or presentation slides in PDF format.
                    </p>
                  </div>
                )}

                {(!isLeader || !subStatus.isOpen) && (
                  <p className="text-xs text-zinc-500 font-medium mt-1">
                    {submission?.pdf_url ? 'PDF Deck attached above.' : 'No presentation deck uploaded.'}
                  </p>
                )}
              </div>

              {/* Progress Bar during Upload */}
              {submitting && (
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 border-4 border-bauhaus-border h-8 mt-4 relative overflow-hidden rounded-lg">
                  <div 
                    className="bg-bauhaus-primary h-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center font-black text-white text-xs drop-shadow">
                    {progress}% UPLOADING PRESENTATION...
                  </div>
                </div>
              )}

              {/* Submit Action */}
              {isLeader && subStatus.isOpen && (
                <div className="pt-6 border-t-4 border-bauhaus-border flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bauhaus-button px-10 py-3.5 text-sm font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{submitting ? 'Submitting...' : (submission ? 'Update Submission' : 'Submit Project')}</span>
                  </button>
                </div>
              )}

            </form>

          </div>

        </div>

      </div>

    </div>
  );
};
