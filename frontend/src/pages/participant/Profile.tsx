import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { 
  User, 
  Save, 
  CheckCircle2, 
  Mail, 
  Phone, 
  GraduationCap, 
  MapPin, 
  Globe, 
  Sparkles, 
  ExternalLink,
  Building2
} from 'lucide-react';

const GithubIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedinIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const InstagramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export const Profile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'academic' | 'social'>('personal');

  const [formData, setFormData] = useState({
    name: '',
    college: '',
    year: '',
    branch: '',
    gender: '',
    dob: '',
    phone: '',
    city: '',
    bio: '',
    github_url: '',
    linkedin_url: '',
    instagram_url: '',
    portfolio_url: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/auth/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = res.data;
      setFormData({
        name: data.name || '',
        college: data.college || '',
        year: data.year || '',
        branch: data.branch || '',
        gender: data.gender || '',
        dob: data.dob ? (data.dob.includes('T') ? data.dob.split('T')[0] : data.dob) : '',
        phone: data.phone || '',
        city: data.city || '',
        bio: data.bio || '',
        github_url: data.github_url || '',
        linkedin_url: data.linkedin_url || '',
        instagram_url: data.instagram_url || '',
        portfolio_url: data.portfolio_url || ''
      });
    } catch (err) {
      console.error('Failed to load profile', err);
      setError('Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Phone: allow digits only
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '');
      setFormData({
        ...formData,
        phone: digitsOnly
      });
      return;
    }

    // Bio: hard cap at 500 characters
    if (name === 'bio') {
      setFormData({
        ...formData,
        bio: value.slice(0, 500)
      });
      return;
    }

    if (name === 'dob' && value) {
      const parts = value.split('-');
      // Prevent year from extending beyond 4 digits when typed in Chrome/Edge
      if (parts[0] && parts[0].length > 4) {
        parts[0] = parts[0].slice(0, 4);
        setFormData({
          ...formData,
          dob: parts.join('-')
        });
        return;
      }
    }
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    // Basic required check
    if (!formData.name.trim()) {
      setError('Full Name is required.');
      setSaving(false);
      return;
    }

    if (formData.dob) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (formData.dob > todayStr) {
        setError('Date of Birth cannot be in the future.');
        setSaving(false);
        return;
      }
    }

    try {
      const res = await axios.put(`/api/users/profile`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (updateUser) {
        updateUser(res.data);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save profile. Please check your network.');
    } finally {
      setSaving(false);
    }
  };

  // Calculate profile completion percentage
  const totalRequiredFields = ['name', 'college', 'year', 'branch', 'phone', 'city', 'dob', 'gender'];
  const completedFieldsCount = totalRequiredFields.filter(f => Boolean((formData as any)[f])).length;
  const completionPercentage = Math.round((completedFieldsCount / totalRequiredFields.length) * 100);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-bauhaus-border border-t-bauhaus-primary rounded-full animate-spin"></div>
        <p className="font-black uppercase tracking-widest text-sm text-bauhaus-text">Loading Your Profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      
      {/* Top Breadcrumb & Success Toast */}
      {success && (
        <div className="p-4 rounded-xl border-4 border-bauhaus-border bg-green-500 text-white shadow-[6px_6px_0px_rgba(0,0,0,1)] flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-3 font-black uppercase tracking-wider text-sm">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <span>Profile Updated Successfully! Your public details are synced.</span>
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

      {/* Main Landscape Grid: Left Side Profile Card + Right Side Edit Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ========================================================================= */}
        {/* LEFT SIDE: Social Media Style Profile Identity Card (Sticky)              */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          
          {/* Card Frame */}
          <div className="bauhaus-card overflow-hidden bg-bauhaus-card border-4 border-bauhaus-border shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_rgba(255,255,255,0.2)]">
            
            {/* Header Cover Banner */}
            <div className="h-32 bg-gradient-to-r from-bauhaus-primary via-bauhaus-secondary to-bauhaus-accent relative border-b-4 border-bauhaus-border p-4 flex justify-between items-start">
              <span className="bg-black text-white text-[10px] font-black uppercase px-2.5 py-1 rounded shadow">
                Participant
              </span>
              <span className="bg-white text-black text-[10px] font-bold px-2 py-0.5 rounded border border-black">
                {completionPercentage}% Complete
              </span>
            </div>

            {/* Avatar & User Core Details */}
            <div className="px-6 pb-6 pt-0 relative space-y-4">
              
              {/* Profile Avatar */}
              <div className="-mt-16 mb-2 flex justify-between items-end">
                <div className="w-28 h-28 rounded-2xl bg-bauhaus-card border-4 border-bauhaus-border text-bauhaus-text flex items-center justify-center font-black text-4xl shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.2)] overflow-hidden">
                  {formData.name ? formData.name.charAt(0).toUpperCase() : <User className="w-14 h-14 text-zinc-400" />}
                </div>
                
                {/* Status indicator */}
                <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full border-2 border-bauhaus-border bg-emerald-100 text-emerald-800 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Active</span>
                </div>
              </div>

              {/* Names & Contact */}
              <div>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-bauhaus-text">
                  {formData.name || 'Anonymous Participant'}
                </h2>
                <div className="flex items-center text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1">
                  <Mail className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                  <span className="truncate">{user?.email || 'No email attached'}</span>
                </div>
                {formData.phone && (
                  <div className="flex items-center text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1">
                    <Phone className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                    <span>{formData.phone}</span>
                  </div>
                )}
              </div>

              {/* Bio snippet */}
              {formData.bio ? (
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed italic bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border-2 border-bauhaus-border">
                  "{formData.bio}"
                </p>
              ) : (
                <p className="text-xs text-zinc-400 italic bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
                  No bio added yet. Tell other hackathon teams about your skills!
                </p>
              )}

              {/* Academic Tags */}
              <div className="pt-2 border-t-2 border-bauhaus-border/60 space-y-2 text-xs">
                {formData.college && (
                  <div className="flex items-center space-x-2 text-zinc-800 dark:text-zinc-200">
                    <Building2 className="w-4 h-4 text-bauhaus-primary shrink-0" />
                    <span className="font-bold truncate">{formData.college}</span>
                  </div>
                )}
                {(formData.branch || formData.year) && (
                  <div className="flex items-center space-x-2 text-zinc-600 dark:text-zinc-400">
                    <GraduationCap className="w-4 h-4 text-bauhaus-secondary shrink-0" />
                    <span>{formData.branch ? `${formData.branch}` : ''} {formData.year ? `• ${formData.year}` : ''}</span>
                  </div>
                )}
                {formData.city && (
                  <div className="flex items-center space-x-2 text-zinc-600 dark:text-zinc-400">
                    <MapPin className="w-4 h-4 text-bauhaus-accent shrink-0" />
                    <span>{formData.city}</span>
                  </div>
                )}
              </div>

              {/* Social Media Link Chips */}
              <div className="pt-4 border-t-2 border-bauhaus-border">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">
                  Social & Portfolios
                </span>
                <div className="flex flex-wrap gap-2">
                  {formData.github_url && (
                    <a
                      href={formData.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg border-2 border-bauhaus-border bg-black text-white hover:bg-zinc-800 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                      title="GitHub Profile"
                    >
                      <GithubIcon className="w-4 h-4" />
                      <span className="text-[11px]">GitHub</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </a>
                  )}

                  {formData.linkedin_url && (
                    <a
                      href={formData.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg border-2 border-bauhaus-border bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                      title="LinkedIn Profile"
                    >
                      <LinkedinIcon className="w-4 h-4" />
                      <span className="text-[11px]">LinkedIn</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </a>
                  )}

                  {formData.instagram_url && (
                    <a
                      href={formData.instagram_url.startsWith('http') ? formData.instagram_url : `https://instagram.com/${formData.instagram_url.replace('@', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg border-2 border-bauhaus-border bg-pink-600 text-white hover:bg-pink-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                      title="Instagram Profile"
                    >
                      <InstagramIcon className="w-4 h-4" />
                      <span className="text-[11px]">Instagram</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </a>
                  )}

                  {formData.portfolio_url && (
                    <a
                      href={formData.portfolio_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg border-2 border-bauhaus-border bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white hover:border-black text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                      title="Personal Website"
                    >
                      <Globe className="w-4 h-4" />
                      <span className="text-[11px]">Portfolio</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </a>
                  )}

                  {!formData.github_url && !formData.linkedin_url && !formData.instagram_url && !formData.portfolio_url && (
                    <span className="text-xs text-zinc-400 italic">No social links added yet. Add them in the edit form!</span>
                  )}
                </div>
              </div>

              {/* Completion Progress Bar */}
              <div className="pt-2">
                <div className="flex justify-between text-[11px] font-bold text-zinc-500 mb-1">
                  <span>Profile Completion</span>
                  <span>{completionPercentage}%</span>
                </div>
                <div className="w-full h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden border border-bauhaus-border">
                  <div 
                    className="h-full bg-bauhaus-primary transition-all duration-500 rounded-full"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* RIGHT SIDE: Profile Editing & Details Workspace                           */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bauhaus-card bg-bauhaus-card p-6 md:p-8 border-4 border-bauhaus-border shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_rgba(255,255,255,0.2)]">
            
            {/* Header & Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-bauhaus-border pb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-bauhaus-text flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-bauhaus-primary" />
                  Edit Profile
                </h1>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">
                  Keep your participant information accurate and up to date
                </p>
              </div>

              {/* Navigation Tabs */}
              <div className="flex rounded-lg border-2 border-bauhaus-border bg-zinc-100 dark:bg-zinc-900 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('personal')}
                  className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-md transition-all ${
                    activeTab === 'personal'
                      ? 'bg-bauhaus-primary text-white shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  Personal
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('academic')}
                  className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-md transition-all ${
                    activeTab === 'academic'
                      ? 'bg-bauhaus-primary text-white shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  Academic
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('social')}
                  className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-md transition-all ${
                    activeTab === 'social'
                      ? 'bg-bauhaus-primary text-white shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  Social Links
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 pt-6">
              
              {/* TAB 1: PERSONAL DETAILS */}
              {activeTab === 'personal' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest mb-1 text-bauhaus-text">Full Name *</label>
                      <input 
                        type="text" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        required 
                        placeholder="e.g. Alex Morgan"
                        className="w-full px-4 py-3 border-4 border-bauhaus-border bg-bauhaus-bg text-bauhaus-text focus:outline-none focus:border-bauhaus-primary font-bold text-sm" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest mb-1 text-bauhaus-text">Email (Verified)</label>
                      <input 
                        type="email" 
                        value={user?.email || ''} 
                        disabled 
                        className="w-full px-4 py-3 border-4 border-bauhaus-border bg-zinc-200 dark:bg-zinc-800 text-zinc-500 font-bold text-sm cursor-not-allowed" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest mb-1 text-bauhaus-text">Phone Number *</label>
                      <input 
                        type="tel" 
                        name="phone" 
                        value={formData.phone} 
                        onChange={handleChange} 
                        required 
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="9876543210"
                        className="w-full px-4 py-3 border-4 border-bauhaus-border bg-bauhaus-bg text-bauhaus-text focus:outline-none focus:border-bauhaus-primary font-bold text-sm" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest mb-1 text-bauhaus-text">City *</label>
                      <input 
                        type="text" 
                        name="city" 
                        value={formData.city} 
                        onChange={handleChange} 
                        required 
                        placeholder="e.g. Bengaluru, Mumbai"
                        className="w-full px-4 py-3 border-4 border-bauhaus-border bg-bauhaus-bg text-bauhaus-text focus:outline-none focus:border-bauhaus-primary font-bold text-sm" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest mb-1 text-bauhaus-text">Date of Birth</label>
                      <input 
                        type="date" 
                        name="dob" 
                        max={new Date().toISOString().split('T')[0]}
                        min="1920-01-01"
                        value={formData.dob} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 border-4 border-bauhaus-border bg-bauhaus-bg text-bauhaus-text focus:outline-none focus:border-bauhaus-primary font-bold text-sm" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest mb-1 text-bauhaus-text">Gender</label>
                      <select 
                        name="gender" 
                        value={formData.gender} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 border-4 border-bauhaus-border bg-bauhaus-bg text-bauhaus-text focus:outline-none focus:border-bauhaus-primary font-bold text-sm"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-black uppercase tracking-widest text-bauhaus-text">About / Bio (Introduce Yourself)</label>
                      <span className={`text-[11px] font-bold ${formData.bio.length >= 500 ? 'text-red-600' : 'text-zinc-500'}`}>
                        {formData.bio.length} / 500
                      </span>
                    </div>
                    <textarea 
                      name="bio" 
                      value={formData.bio} 
                      onChange={handleChange} 
                      rows={3}
                      maxLength={500}
                      placeholder="e.g. Full-stack developer passionate about AI systems and UI design..."
                      className="w-full px-4 py-3 border-4 border-bauhaus-border bg-bauhaus-bg text-bauhaus-text focus:outline-none focus:border-bauhaus-primary font-medium text-sm leading-relaxed" 
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: ACADEMIC DETAILS */}
              {activeTab === 'academic' && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest mb-1 text-bauhaus-text">College / University *</label>
                    <input 
                      type="text" 
                      name="college" 
                      value={formData.college} 
                      onChange={handleChange} 
                      required 
                      placeholder="e.g. Indian Institute of Technology"
                      className="w-full px-4 py-3 border-4 border-bauhaus-border bg-bauhaus-bg text-bauhaus-text focus:outline-none focus:border-bauhaus-primary font-bold text-sm" 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest mb-1 text-bauhaus-text">Branch / Discipline *</label>
                      <input 
                        type="text" 
                        name="branch" 
                        value={formData.branch} 
                        onChange={handleChange} 
                        required 
                        placeholder="e.g. Computer Science & Eng."
                        className="w-full px-4 py-3 border-4 border-bauhaus-border bg-bauhaus-bg text-bauhaus-text focus:outline-none focus:border-bauhaus-primary font-bold text-sm" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest mb-1 text-bauhaus-text">Year of Study *</label>
                      <select 
                        name="year" 
                        value={formData.year} 
                        onChange={handleChange} 
                        required 
                        className="w-full px-4 py-3 border-4 border-bauhaus-border bg-bauhaus-bg text-bauhaus-text focus:outline-none focus:border-bauhaus-primary font-bold text-sm"
                      >
                        <option value="">Select Year</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SOCIAL MEDIA & PORTFOLIOS */}
              {activeTab === 'social' && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest mb-1 text-bauhaus-text">
                      <GithubIcon className="w-3.5 h-3.5" /> GitHub Profile URL
                    </label>
                    <input 
                      type="url" 
                      name="github_url" 
                      value={formData.github_url} 
                      onChange={handleChange} 
                      placeholder="https://github.com/yourhandle"
                      className="w-full px-4 py-3 border-4 border-bauhaus-border bg-bauhaus-bg text-bauhaus-text focus:outline-none focus:border-bauhaus-primary font-bold text-sm" 
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest mb-1 text-bauhaus-text">
                      <LinkedinIcon className="w-3.5 h-3.5 text-blue-600" /> LinkedIn Profile URL
                    </label>
                    <input 
                      type="url" 
                      name="linkedin_url" 
                      value={formData.linkedin_url} 
                      onChange={handleChange} 
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="w-full px-4 py-3 border-4 border-bauhaus-border bg-bauhaus-bg text-bauhaus-text focus:outline-none focus:border-bauhaus-primary font-bold text-sm" 
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest mb-1 text-bauhaus-text">
                      <InstagramIcon className="w-3.5 h-3.5 text-pink-600" /> Instagram Handle / URL
                    </label>
                    <input 
                      type="text" 
                      name="instagram_url" 
                      value={formData.instagram_url} 
                      onChange={handleChange} 
                      placeholder="https://instagram.com/yourhandle or @yourhandle"
                      className="w-full px-4 py-3 border-4 border-bauhaus-border bg-bauhaus-bg text-bauhaus-text focus:outline-none focus:border-bauhaus-primary font-bold text-sm" 
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest mb-1 text-bauhaus-text">
                      <Globe className="w-3.5 h-3.5" /> Portfolio Website URL
                    </label>
                    <input 
                      type="url" 
                      name="portfolio_url" 
                      value={formData.portfolio_url} 
                      onChange={handleChange} 
                      placeholder="https://yourportfolio.dev"
                      className="w-full px-4 py-3 border-4 border-bauhaus-border bg-bauhaus-bg text-bauhaus-text focus:outline-none focus:border-bauhaus-primary font-bold text-sm" 
                    />
                  </div>
                </div>
              )}

              {/* Submit & Navigation Footer */}
              <div className="pt-6 border-t-4 border-bauhaus-border flex flex-wrap items-center justify-between gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="bauhaus-button flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-black uppercase tracking-widest disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving Changes...' : 'Save & Update Profile'}</span>
                </button>

                <div className="flex items-center space-x-2">
                  {activeTab !== 'personal' && (
                    <button
                      type="button"
                      onClick={() => setActiveTab(activeTab === 'social' ? 'academic' : 'personal')}
                      className="px-4 py-2 border-2 border-bauhaus-border text-xs font-bold uppercase tracking-wider hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      &larr; Back
                    </button>
                  )}
                  {activeTab !== 'social' && (
                    <button
                      type="button"
                      onClick={() => setActiveTab(activeTab === 'personal' ? 'academic' : 'social')}
                      className="px-4 py-2 border-2 border-bauhaus-border text-xs font-bold uppercase tracking-wider hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Next &rarr;
                    </button>
                  )}
                </div>
              </div>

            </form>

          </div>

        </div>

      </div>

    </div>
  );
};