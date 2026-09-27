import { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { AuthContext } from '../../context/AuthContext';
import { 
  Trophy, 
  Award, 
  Download, 
  ExternalLink, 
  Vote, 
  CheckCircle2, 
  Users, 
  FileText, 
  ShieldCheck
} from 'lucide-react';
import { UIModal } from '../../components/UIModal';

const AnimatedAmount = ({ text }: { text: string }) => {
  const [current, setCurrent] = useState<number | null>(null);
  
  const match = text.match(/([^\d]*)((?:\d+,?)+)(.*)/);
  if (!match) return <span>{text}</span>;
  
  const prefix = match[1];
  const numberStr = match[2];
  const suffix = match[3];
  const targetNumber = parseInt(numberStr.replace(/,/g, ''), 10);
  
  if (isNaN(targetNumber)) return <span>{text}</span>;

  useEffect(() => {
    let startTime: number;
    const duration = 1500;
    const startValue = Math.floor(targetNumber * 0.9);

    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = (time - startTime) / duration;

      if (progress < 1) {
        const easeOut = 1 - Math.pow(2, -10 * progress);
        setCurrent(Math.floor(startValue + (targetNumber - startValue) * easeOut));
        requestAnimationFrame(animate);
      } else {
        setCurrent(targetNumber);
      }
    };

    requestAnimationFrame(animate);
  }, [targetNumber]);

  if (current === null) return <span>{text}</span>;
  return <span>{prefix}{current.toLocaleString('en-IN')}{suffix}</span>;
};

export const HackathonDetails = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const activeSlug = slug || 'hacknext-72-hour-hackathon';
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Projects & Voting State
  const [projectsModal, setProjectsModal] = useState(false);
  const [projectsData, setProjectsData] = useState<any[]>([]);
  const [userVote, setUserVote] = useState<any>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);

  // Results State
  const [resultsData, setResultsData] = useState<any[]>([]);

  // Participant Certificates State
  const [myCertificates, setMyCertificates] = useState<any[]>([]);

  // Toast State
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type }), 3500);
  };

  useEffect(() => {
    fetchEvent();
  }, [activeSlug]);

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/public/events/${activeSlug}/public`);
      setEvent(response.data);

      if (response.data?.show_public_results) {
        fetchResults(activeSlug);
      }
      if (response.data?.show_certificates && user) {
        fetchMyCertificates();
      }
    } catch (error) {
      console.error("Failed to fetch event", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async (eventSlug: string) => {
    try {
      const res = await api.get(`/public/events/${eventSlug}/public/results`);
      setResultsData(res.data.results || []);
    } catch (e) {
      console.error('Failed to load public results:', e);
    }
  };

  const fetchMyCertificates = async () => {
    try {
      const res = await api.get('/certificates/my-certificates');
      setMyCertificates(res.data || []);
    } catch (e) {
      // participant might not have certs
    }
  };

  const openProjectsVoting = async () => {
    setProjectsModal(true);
    setProjectsLoading(true);
    try {
      const [projRes, voteRes] = await Promise.all([
        api.get(`/voting/events/${activeSlug}/projects`),
        user ? api.get(`/voting/events/${event.id}/my-vote`) : Promise.resolve({ data: { hasVoted: false } })
      ]);
      setProjectsData(projRes.data.projects || []);
      setUserVote(voteRes.data);
    } catch (e) {
      console.error('Failed to load projects for voting:', e);
      showToast('Failed to load projects', 'error');
    } finally {
      setProjectsLoading(false);
    }
  };

  const handleCastVote = async (projectId: string) => {
    if (!user) {
      setProjectsModal(false);
      navigate('/login');
      return;
    }

    setIsVoting(true);
    try {
      const res = await api.post(`/voting/events/${event.id}/vote`, { projectId });
      showToast(res.data.message || 'Vote successfully cast!', 'success');
      // refresh user vote
      const voteRes = await api.get(`/voting/events/${event.id}/my-vote`);
      setUserVote(voteRes.data);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to record vote', 'error');
    } finally {
      setIsVoting(false);
    }
  };

  const [bannerIndex, setBannerIndex] = useState(0);
  
  useEffect(() => {
    if (!event?.banner_url) return;
    const urls = event.banner_url.split(',').filter(Boolean);
    if (urls.length <= 1) return;
    
    const interval = setInterval(() => {
      setBannerIndex(prev => (prev + 1) % urls.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [event?.banner_url, bannerIndex]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bauhaus-bg text-bauhaus-fg">
        <div className="text-4xl font-black uppercase tracking-widest animate-pulse">Loading Hackathon...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bauhaus-bg text-bauhaus-fg">
        <div className="text-4xl font-black uppercase">Event Not Found</div>
      </div>
    );
  }

  const bannerUrls = event.banner_url 
    ? event.banner_url.split(',').filter(Boolean).map((u: string) => u.startsWith('/uploads') ? `${u}` : u) 
    : [];

  return (
    <div className="min-h-screen bg-bauhaus-bg text-bauhaus-fg font-sans selection:bg-bauhaus-primary selection:text-white pb-24">
      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[150] px-6 py-3 rounded shadow-lg font-bold text-white transition-opacity ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      {/* Banner */}
      {bannerUrls.length > 0 && (
        <div className="relative w-full overflow-hidden border-b-8 border-bauhaus-border bg-bauhaus-card group">
          {bannerUrls.map((url: string, idx: number) => (
            <img 
              key={idx}
              src={url} 
              alt={`Hackathon Banner ${idx + 1}`} 
              className={`w-full h-auto object-cover transition-opacity duration-500 ease-in-out ${idx === bannerIndex ? 'opacity-100 z-10 relative' : 'opacity-0 z-0 absolute top-0 left-0'}`} 
            />
          ))}
          {bannerUrls.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {bannerUrls.map((_: any, idx: number) => (
                <button 
                  key={idx} 
                  onClick={() => setBannerIndex(idx)}
                  className={`w-3 h-3 rounded-full border-2 border-white transition-colors ${idx === bannerIndex ? 'bg-white' : 'bg-transparent'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
      {bannerUrls.length === 0 && <div className="pt-20"></div>}

      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 relative">
        
        {/* Geometric Decorations */}
        <div className="absolute top-0 right-10 w-20 h-20 bg-bauhaus-accent border-4 border-bauhaus-border transform rotate-12 -z-10 hidden md:block"></div>
        <div className="absolute top-40 left-10 w-16 h-16 rounded-full bg-bauhaus-primary border-4 border-bauhaus-border -z-10 hidden md:block"></div>

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-20">
          <div className="flex-1 space-y-6">
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">
              {event.name}
            </h1>

            <div className="flex flex-wrap gap-3">
              {event.team_size_min && event.team_size_max && (
                <div className="bauhaus-card px-4 py-2 font-bold uppercase text-xs">
                  <span className="text-bauhaus-primary">
                    {event.team_size_min === 1 && event.team_size_max === 1 ? 'Mode:' : 'Team Limits:'}
                  </span>{' '}
                  {event.team_size_min === 1 && event.team_size_max === 1
                    ? 'Individual Participant'
                    : `${event.team_size_min}–${event.team_size_max} Members`}
                </div>
              )}
              {event.category && (
                <div className="bauhaus-card px-4 py-2 font-bold uppercase text-xs">
                  <span className="text-bauhaus-primary">Category:</span> {event.category}
                </div>
              )}
              {event.prize_pool && (
                <div className="bauhaus-card px-4 py-2 font-bold uppercase text-xs">
                  <span className="text-bauhaus-primary">Prize Pool:</span> <AnimatedAmount text={event.prize_pool} />
                </div>
              )}
              {event.mode && (
                <div className="bauhaus-card px-4 py-2 font-bold uppercase text-xs">
                  <span className="text-bauhaus-primary">Format:</span> {event.mode}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              {user?.role === 'participant' ? (
                <>
                  <Link to="/participant/team" className="bauhaus-button inline-block text-center">
                    My Team &amp; Workspace →
                  </Link>
                  <Link to="/participant/submission" className="px-5 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-black text-xs uppercase tracking-wider border-4 border-black dark:border-white shadow-[4px_4px_0px_rgba(0,0,0,1)] inline-block text-center">
                    Submit Project
                  </Link>
                  <button onClick={openProjectsVoting} className="px-5 py-3 bg-amber-400 hover:bg-amber-500 text-black font-black text-xs uppercase tracking-wider border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] inline-block text-center">
                    Community Projects &amp; Vote
                  </button>
                </>
              ) : (
                <>
                  <Link to="/signup" className="bauhaus-button inline-block text-center">
                    Register &amp; Participate →
                  </Link>
                  <Link to="/login" className="px-5 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-black text-xs uppercase tracking-wider border-4 border-black dark:border-white shadow-[4px_4px_0px_rgba(0,0,0,1)] inline-block text-center">
                    Sign In
                  </Link>
                  <button onClick={openProjectsVoting} className="px-5 py-3 bg-amber-400 hover:bg-amber-500 text-black font-black text-xs uppercase tracking-wider border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] inline-block text-center">
                    Browse Projects
                  </button>
                </>
              )}
            </div>
          </div>
          
          {(event.organizer_logo || event.organizer_name) && (
            <div className="bauhaus-card p-6 min-w-[250px] relative">
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-bauhaus-secondary border-4 border-bauhaus-border transform rotate-45"></div>
              <p className="text-xs font-black uppercase tracking-widest text-bauhaus-primary mb-3">Organized By</p>
              {event.organizer_logo && (
                <img src={event.organizer_logo} alt={event.organizer_name} className="h-16 object-contain mb-4" />
              )}
              {event.organizer_name && (
                <p className="font-black text-xl uppercase text-zinc-900 dark:text-white">{event.organizer_name}</p>
              )}
            </div>
          )}
        </div>

        {/* Navigation Cards Strip (Teams / Projects / Results / Certificates) */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-20">
          {event.show_public_teams && (
            <div onClick={() => navigate('/participant/team/join')} className="bauhaus-card p-8 text-center flex flex-col items-center justify-center hover:bg-red-600 hover:text-white transition-colors group cursor-pointer border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)]">
              <Users className="w-8 h-8 mb-2" />
              <h3 className="text-xl font-black uppercase mb-1">Teams Roster</h3>
              <div className="text-5xl font-black font-mono mb-4 group-hover:scale-110 transition-transform">{event.team_count || 0}</div>
              <span className="font-black uppercase tracking-widest text-xs border-b-2 border-transparent group-hover:border-white pb-0.5">Explore Teams →</span>
            </div>
          )}

          {event.show_public_projects && (
            <div onClick={openProjectsVoting} className="bauhaus-card p-8 text-center flex flex-col items-center justify-center hover:bg-amber-500 hover:text-black transition-colors group cursor-pointer border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)]">
              <FileText className="w-8 h-8 mb-2" />
              <h3 className="text-xl font-black uppercase mb-1">Project Gallery</h3>
              <div className="text-5xl font-black font-mono mb-4 group-hover:scale-110 transition-transform">{event.project_count || 0}</div>
              <span className="font-black uppercase tracking-widest text-xs border-b-2 border-transparent group-hover:border-black pb-0.5">View Projects &amp; Vote →</span>
            </div>
          )}

          {event.show_public_results && (
            <div 
              onClick={() => {
                const el = document.getElementById('leaderboard-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else navigate('/participant/results');
              }} 
              className="bauhaus-card p-8 text-center flex flex-col items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors group cursor-pointer border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)]"
            >
              <Trophy className="w-8 h-8 mb-2" />
              <h3 className="text-xl font-black uppercase mb-1">Results &amp; Podium</h3>
              <div className="text-5xl font-black mb-4 group-hover:scale-110 transition-transform">🏆</div>
              <span className="font-black uppercase tracking-widest text-xs border-b-2 border-transparent group-hover:border-white pb-0.5">View Leaderboard →</span>
            </div>
          )}
        </section>

        {/* Participant Certificates Banner (If enabled & participant has certificates) */}
        {event.show_certificates && myCertificates.length > 0 && (
          <section className="mb-20 bauhaus-card p-8 bg-amber-50 dark:bg-amber-950/40 border-4 border-amber-500 shadow-[8px_8px_0px_rgba(245,158,11,1)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-400 text-black flex items-center justify-center font-black">
                  <Award className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
                    Your Official Certificates ({myCertificates.length})
                  </h2>
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                    Official verified certificates issued by HackNext Jury.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myCertificates.map(cert => (
                <div key={cert.id} className="p-4 bg-white dark:bg-zinc-900 border-2 border-black dark:border-zinc-700 rounded-lg flex flex-col justify-between space-y-3 shadow-sm">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 text-[10px] font-black uppercase rounded">
                        {cert.title}
                      </span>
                      <span className="text-xs font-mono font-bold text-red-600">{cert.certificate_no}</span>
                    </div>
                    <h3 className="text-base font-black uppercase mt-2 text-zinc-900 dark:text-white">{cert.recipient_name}</h3>
                    <p className="text-xs text-zinc-500">{cert.team_name ? `Team: ${cert.team_name}` : 'Individual Participant'}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <a
                      href={`/verify/certificate/${cert.certificate_no}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verify Authenticity</span>
                    </a>
                    {cert.file_url && (
                      <a
                        href={cert.file_url}
                        download={`Certificate_${cert.certificate_no}.svg`}
                        className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-wider rounded flex items-center gap-1 hover:bg-zinc-800"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Results & Leaderboard Section (Visible on Main Page when enabled) */}
        {event.show_public_results && resultsData.length > 0 && (
          <section id="leaderboard-section" className="mb-24 space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-2 border-amber-500 rounded font-mono text-xs font-black uppercase tracking-wider">
                <Trophy className="w-3.5 h-3.5 text-amber-600" />
                <span>Official Ranking &amp; Awards</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
                Hackathon Results &amp; Winners
              </h2>
            </div>

            {/* Top 3 Podium Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {resultsData.slice(0, 3).map((res, i) => {
                const isGold = i === 0;
                const isSilver = i === 1;

                const bgHeader = isGold ? 'bg-amber-400 text-black' : isSilver ? 'bg-slate-300 text-black' : 'bg-amber-600 text-white';
                const medal = isGold ? '🥇 1ST PLACE' : isSilver ? '🥈 2ND PLACE' : '🥉 3RD PLACE';

                return (
                  <div 
                    key={res.id} 
                    className={`bauhaus-card bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_rgba(255,255,255,0.2)] overflow-hidden flex flex-col justify-between ${
                      isGold ? 'md:-translate-y-4 ring-4 ring-amber-400' : ''
                    }`}
                  >
                    <div>
                      <div className={`p-4 font-black text-center text-sm uppercase tracking-wider ${bgHeader}`}>
                        {medal}
                      </div>
                      <div className="p-6 space-y-3">
                        <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">Team: <strong className="text-zinc-900 dark:text-white">{res.teamName}</strong></div>
                        <h3 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">{res.title}</h3>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium line-clamp-3 leading-relaxed">{res.description}</p>
                      </div>
                    </div>

                    <div className="p-6 pt-0 space-y-4">
                      <div className="flex items-center justify-between p-3 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700">
                        <span className="text-xs font-black uppercase text-zinc-600 dark:text-zinc-400">Jury Score</span>
                        <span className="text-2xl font-black font-mono text-red-600">{res.totalScore} <span className="text-xs text-zinc-400">/ 100</span></span>
                      </div>

                      <div className="flex gap-2">
                        {res.repo_url && (
                          <a href={res.repo_url} target="_blank" rel="noreferrer" className="flex-1 py-2 text-center text-xs font-black uppercase bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded border border-black dark:border-zinc-600 flex items-center justify-center gap-1">
                            <ExternalLink className="w-3.5 h-3.5" /> Repo
                          </a>
                        )}
                        {res.demo_video_url && (
                          <a href={res.demo_video_url} target="_blank" rel="noreferrer" className="flex-1 py-2 text-center text-xs font-black uppercase bg-red-600 hover:bg-red-700 text-white rounded flex items-center justify-center gap-1">
                            <ExternalLink className="w-3.5 h-3.5" /> Video
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <hr className="border-t-4 border-bauhaus-border mb-20" />

        {/* About Section */}
        {event.full_description && (
          <section className="mb-20">
            <h2 className="text-3xl md:text-4xl font-black uppercase mb-6 flex items-center gap-3">
              <span className="w-6 h-6 bg-bauhaus-accent border-4 border-bauhaus-border block"></span>
              About The Hackathon
            </h2>
            <div className="prose prose-lg dark:prose-invert max-w-none font-medium leading-relaxed">
              <div dangerouslySetInnerHTML={{ __html: event.full_description }} />
            </div>
          </section>
        )}

        {/* Prizes Section */}
        {event.show_prizes && event.prizes?.length > 0 && (
          <section className="mb-20">
            <h2 className="text-3xl md:text-4xl font-black uppercase mb-8 flex items-center gap-3">
              <span className="w-6 h-6 bg-amber-400 border-4 border-bauhaus-border block rotate-45"></span>
              Prizes &amp; Category Tracks
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {event.prizes.map((prize: any, i: number) => (
                <div key={prize.id} className="bauhaus-card p-6 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-black text-white dark:bg-white dark:text-black font-black flex items-center justify-center text-lg">
                    {i + 1}
                  </div>
                  <h3 className="text-xl font-black uppercase text-zinc-900 dark:text-white">{prize.title}</h3>
                  {prize.amount && (
                    <div className="text-3xl font-black font-mono text-red-600">
                      <AnimatedAmount text={prize.amount} />
                    </div>
                  )}
                  {prize.description && <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">{prize.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Dates & Deadlines Timeline */}
        {event.show_timeline && event.timeline_items?.length > 0 && (
          <section className="mb-20">
            <h2 className="text-3xl md:text-4xl font-black uppercase mb-8 flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-purple-600 border-4 border-bauhaus-border block"></span>
              Dates, Rounds &amp; Deadlines
            </h2>
            <div className="relative border-l-8 border-bauhaus-border ml-4 md:ml-8 pl-8 md:pl-12 space-y-10">
              {event.timeline_items.map((item: any) => {
                const now = new Date().getTime();
                const startTime = new Date(item.start_datetime).getTime();
                const endTime = item.end_datetime ? new Date(item.end_datetime).getTime() : startTime + 24 * 3600 * 1000;
                const isLive = now >= startTime && now <= endTime;
                const isOver = now > endTime;

                return (
                  <div key={item.id} className={`relative group ${isOver ? 'opacity-60' : ''}`}>
                    <div className={`absolute -left-[40px] md:-left-[56px] top-1 w-6 h-6 rounded-full border-4 border-bauhaus-border bg-white ${
                      isLive ? 'bg-emerald-500 border-emerald-600 ring-4 ring-emerald-300 animate-pulse' : ''
                    }`} />
                    
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className={`text-2xl font-black uppercase ${isLive ? 'text-emerald-600' : ''}`}>
                        {item.title}
                      </h3>
                      {isLive && (
                        <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-black uppercase rounded tracking-wider">
                          Live Now
                        </span>
                      )}
                    </div>

                    <div className="text-xs md:text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-2">
                      <span>{new Date(item.start_datetime).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      {item.end_datetime && (
                        <span> → {new Date(item.end_datetime).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>

                    {item.description && <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 font-medium max-w-2xl">{item.description}</p>}
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </div>

      {/* Community Projects & Voting Modal (Clean Title & Description list with 1-Vote Constraint) */}
      {projectsModal && (
        <UIModal
          isOpen={projectsModal}
          onClose={() => setProjectsModal(false)}
          title="Submitted Projects &amp; Community Voting"
          maxWidth="max-w-4xl"
        >
          <div className="space-y-6">
            <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg border-2 border-black dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-black uppercase text-zinc-700 dark:text-zinc-300">Community Voting Rules</span>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  Every participant can cast <strong>strictly 1 vote</strong> for their favorite project.
                </p>
              </div>
              {userVote?.hasVoted && (
                <div className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded border border-emerald-500 text-xs font-black uppercase">
                  ✓ Voted: {userVote.projectTitle}
                </div>
              )}
            </div>

            {projectsLoading ? (
              <div className="p-12 text-center text-zinc-500">
                <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span className="text-xs font-bold uppercase tracking-wider">Loading project submissions...</span>
              </div>
            ) : projectsData.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 border-2 border-dashed rounded-lg">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="font-bold text-sm">No submitted projects found yet.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {projectsData.map((proj) => {
                  const isVotedForThis = userVote?.hasVoted && userVote.projectId === proj.id;

                  return (
                    <div
                      key={proj.id}
                      className={`p-6 bg-zinc-50 dark:bg-zinc-800/80 border-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                        isVotedForThis 
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' 
                          : 'border-zinc-300 dark:border-zinc-700 hover:border-black dark:hover:border-zinc-500'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded">
                            Team: {proj.teamName}
                          </span>
                          {proj.votesCount !== undefined && (
                            <span className="text-[10px] font-mono font-bold text-red-600">
                              {proj.votesCount} votes
                            </span>
                          )}
                        </div>
                        <h4 className="text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-white">
                          {proj.title}
                        </h4>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                          {proj.description}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center">
                        <button
                          type="button"
                          disabled={isVoting || isVotedForThis}
                          onClick={() => handleCastVote(proj.id)}
                          className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded border-2 transition flex items-center gap-1.5 ${
                            isVotedForThis
                              ? 'bg-emerald-600 text-white border-emerald-700 cursor-default'
                              : 'bg-black text-white hover:bg-red-600 border-black shadow'
                          }`}
                        >
                          {isVotedForThis ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Voted</span>
                            </>
                          ) : (
                            <>
                              <Vote className="w-4 h-4" />
                              <span>Vote</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </UIModal>
      )}

    </div>
  );
};
