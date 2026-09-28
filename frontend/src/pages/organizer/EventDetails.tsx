import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';

const toLocalInputValue = (dateVal: string | Date | null | undefined): string => {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return '';
  }
};

const formatPreviewDatetime = (dateVal: string | Date | null | undefined): string => {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return '';
  }
};

export const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // States for dynamic arrays
  const [prizes, setPrizes] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [eligibility, setEligibility] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [availableAdmins, setAvailableAdmins] = useState<any[]>([]);
  
  // Drag and Drop State
  const [draggedItemIdx, setDraggedItemIdx] = useState<number | null>(null);
  const [draggedItemType, setDraggedItemType] = useState<string | null>(null);

  // Live Team Size State for dynamic Individual Participant indicator
  const [minTeamSize, setMinTeamSize] = useState<number>(1);
  const [maxTeamSize, setMaxTeamSize] = useState<number>(4);

  const onDragStart = (idx: number, type: string) => {
    setDraggedItemIdx(idx);
    setDraggedItemType(type);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // allow drop
  };

  const onDrop = (dropIdx: number, type: string, array: any[], setter: any) => {
    if (draggedItemIdx === null || draggedItemType !== type || draggedItemIdx === dropIdx) return;
    const newArray = [...array];
    const draggedItem = newArray[draggedItemIdx];
    newArray.splice(draggedItemIdx, 1);
    newArray.splice(dropIdx, 0, draggedItem);
    newArray.forEach((item, i) => item.sort_order = i + 1);
    setter(newArray);
    setDraggedItemIdx(null);
    setDraggedItemType(null);
  };

  // Toast Notification State
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type }), 3000);
  };

  useEffect(() => {
    if (id) loadEventDetails();
  }, [id]);

  const loadEventDetails = async () => {
    try {
      const response = await api.get(`/events/${id}/organizer-details`);
      setEvent(response.data);
      setMinTeamSize(response.data.team_size_min !== undefined && response.data.team_size_min !== null ? response.data.team_size_min : 1);
      setMaxTeamSize(response.data.team_size_max !== undefined && response.data.team_size_max !== null ? response.data.team_size_max : 4);
      
      setPrizes(response.data.prizes || []);
      setRules(response.data.rules || []);
      setEligibility(response.data.eligibility_items || []);
      setTimeline(response.data.timeline_items || []);
      setContacts(response.data.admin_contacts || []);

      const adminsRes = await api.get('/organizer/users/admins');
      setAvailableAdmins(adminsRes.data || []);
    } catch (err) {
      console.error('Failed to load event details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEvent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const form = document.getElementById('basic-info-form') as HTMLFormElement;
    if (!form) return;
    const formData = new FormData(form);
    const data: any = Object.fromEntries(formData.entries());
    data.team_size_min = data.team_size_min ? parseInt(data.team_size_min, 10) : null;
    data.team_size_max = data.team_size_max ? parseInt(data.team_size_max, 10) : null;
    if (data.start_date) {
      const parsedStart = new Date(data.start_date);
      data.start_date = !isNaN(parsedStart.getTime()) ? parsedStart.toISOString() : undefined;
    }
    if (data.end_date) {
      const parsedEnd = new Date(data.end_date);
      data.end_date = !isNaN(parsedEnd.getTime()) ? parsedEnd.toISOString() : undefined;
    }
    setIsSaving(true);
    try {
      await api.patch(`/organizer/events/${id}`, data);
      showToast('Event details updated successfully!', 'success');
      await loadEventDetails();
    } catch (error) {
      showToast('Failed to update event details', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateContent = async (type: string, items: any[], e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await api.put(`/organizer/events/${id}/content/${type}`, { items });
      showToast(`${type} updated successfully!`, 'success');
      await loadEventDetails();
    } catch (error) {
      showToast(`Failed to update ${type}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const form = document.getElementById('basic-info-form') as HTMLFormElement;
      if (form) {
        const formData = new FormData(form);
        const data: any = Object.fromEntries(formData.entries());
        data.team_size_min = data.team_size_min ? parseInt(data.team_size_min, 10) : null;
        data.team_size_max = data.team_size_max ? parseInt(data.team_size_max, 10) : null;
        if (data.start_date) {
          const parsedStart = new Date(data.start_date);
          data.start_date = !isNaN(parsedStart.getTime()) ? parsedStart.toISOString() : undefined;
        }
        if (data.end_date) {
          const parsedEnd = new Date(data.end_date);
          data.end_date = !isNaN(parsedEnd.getTime()) ? parsedEnd.toISOString() : undefined;
        }
        await api.patch(`/organizer/events/${id}`, data);
      }
      await api.put(`/organizer/events/${id}/content/prizes`, { items: prizes });
      await api.put(`/organizer/events/${id}/content/rules`, { items: rules });
      await api.put(`/organizer/events/${id}/content/eligibility`, { items: eligibility });
      await api.put(`/organizer/events/${id}/content/timeline`, { items: timeline });
      await api.put(`/organizer/events/${id}/content/contacts`, { items: contacts });
      showToast('All changes saved successfully!', 'success');
      await loadEventDetails();
    } catch (e) {
      showToast('Failed to save some changes. Check the sections.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading event details...</div>;
  if (!event) return <div className="p-8">Event not found</div>;

  return (
    <div className="max-w-4xl mx-auto pb-20 relative">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg font-bold text-white transition-opacity ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-8 sticky top-0 bg-white dark:bg-zinc-900 p-4 z-40 border-b-4 border-black dark:border-zinc-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">Edit Event</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">Manage all event details in one place.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleSaveAll} disabled={isSaving} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] flex items-center justify-center min-w-[140px] disabled:opacity-75 disabled:cursor-not-allowed transition">
            {isSaving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : 'Save All Changes'}
          </button>
          <Link to="/" target="_blank" className="px-4 py-2.5 bg-black hover:bg-zinc-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 font-black text-xs uppercase tracking-wider border-2 border-black dark:border-zinc-600 transition">
            View Public &rarr;
          </Link>
        </div>
      </div>

      <div className="space-y-12">
        {/* Basic Information Section */}
        <div className="bauhaus-card bg-white dark:bg-zinc-900 p-6 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)]">
          <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-white mb-6">Event Details</h2>
          <form id="basic-info-form" className="space-y-6" onSubmit={handleUpdateEvent}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">Event Name</label>
                <input name="name" defaultValue={event.name} className="mt-1 block w-full rounded-md border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm focus:border-red-600 focus:ring-1 focus:ring-red-600 sm:text-sm p-3 border" required />
              </div>
              <div>
                <label className="block text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">Organizer Name</label>
                <input name="organizer_name" defaultValue={event.organizer_name} className="mt-1 block w-full rounded-md border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm focus:border-red-600 focus:ring-1 focus:ring-red-600 sm:text-sm p-3 border" />
              </div>
              <div>
                <label className="block text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">Event Start Date & Time</label>
                <input 
                  type="datetime-local" 
                  name="start_date" 
                  defaultValue={event.start_date ? toLocalInputValue(event.start_date) : ''} 
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm focus:border-red-600 focus:ring-1 focus:ring-red-600 sm:text-sm p-3 border" 
                />
              </div>
              <div>
                <label className="block text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">Event End Date & Time</label>
                <input 
                  type="datetime-local" 
                  name="end_date" 
                  defaultValue={event.end_date ? toLocalInputValue(event.end_date) : ''} 
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm focus:border-red-600 focus:ring-1 focus:ring-red-600 sm:text-sm p-3 border" 
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Banner Image Upload <span className="text-zinc-400 dark:text-zinc-500 font-normal normal-case">(1920x1080px, 16:9 ratio. Upload multiple times to add sliding banners)</span>
                </label>
                <div className="flex flex-col gap-4 mt-1">
                  <div className="flex gap-4 overflow-x-auto py-2">
                    {event.banner_url && event.banner_url.split(',').filter(Boolean).map((url: string, i: number) => (
                      <div key={i} className="relative group shrink-0">
                        <img src={url.startsWith('/uploads') ? `${url}` : url} alt={`Banner ${i+1}`} className="h-32 aspect-video object-contain bg-gray-100 border rounded shadow-sm" />
                        <button type="button" onClick={() => {
                          const urls = event.banner_url.split(',').filter(Boolean);
                          urls.splice(i, 1);
                          setEvent({...event, banner_url: urls.join(',')});
                        }} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">X</button>
                      </div>
                    ))}
                  </div>
                  <input type="file" accept="image/*" disabled={uploadProgress !== null} onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append('image', file);
                    try {
                      setUploadProgress(0);
                      const res = await api.post('/organizer/upload', formData, {
                        onUploadProgress: (progressEvent) => {
                          if (progressEvent.total) {
                            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                            setUploadProgress(percentCompleted);
                          }
                        }
                      });
                      const newUrl = res.data.url;
                      const currentUrls = event.banner_url ? event.banner_url.split(',').filter(Boolean) : [];
                      if (currentUrls.length >= 5) {
                        showToast('Maximum 5 banners allowed', 'error');
                        setUploadProgress(null);
                        return;
                      }
                      currentUrls.push(newUrl);
                      setEvent({ ...event, banner_url: currentUrls.join(',') });
                      showToast('Image added! Click Save Details to apply.', 'success');
                    } catch (err) {
                      showToast('Failed to upload image', 'error');
                    } finally {
                      setUploadProgress(null);
                      // Reset the file input
                      e.target.value = '';
                    }
                  }} className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 ${uploadProgress !== null ? 'opacity-50 cursor-not-allowed' : ''}`} />
                  
                  {uploadProgress !== null && (
                    <div className="w-full bg-gray-200 rounded-full h-5 mt-3 mb-2 overflow-hidden border border-gray-300 relative shadow-inner">
                      <div 
                        className="h-full rounded-full transition-all duration-300 flex items-center justify-center text-xs font-bold text-white relative overflow-hidden" 
                        style={{ 
                          width: `${uploadProgress}%`,
                          backgroundColor: '#4f46e5',
                          backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)',
                          backgroundSize: '1rem 1rem',
                          animation: 'progress-stripes 1s linear infinite'
                        }}
                      >
                        {uploadProgress === 100 ? 'Processing...' : (uploadProgress > 10 ? `${uploadProgress}%` : '')}
                      </div>
                      <style>{`
                        @keyframes progress-stripes {
                          from { background-position: 1rem 0; }
                          to { background-position: 0 0; }
                        }
                      `}</style>
                    </div>
                  )}
                  
                  {/* Hidden input to submit the banner_url with the form */}
                  <input type="hidden" name="banner_url" value={event.banner_url || ''} />
                </div>
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">About Details (Full Description, supports HTML)</label>
                <textarea name="full_description" defaultValue={event.full_description} rows={6} className="mt-1 block w-full rounded-md border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm focus:border-red-600 focus:ring-1 focus:ring-red-600 sm:text-sm p-3 border" />
              </div>
              <div>
                <label className="block text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">Category</label>
                <input name="category" defaultValue={event.category} className="mt-1 block w-full rounded-md border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm focus:border-red-600 focus:ring-1 focus:ring-red-600 sm:text-sm p-3 border" />
              </div>
              <div>
                <label className="block text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">Prize Pool / Sponsor Details</label>
                <input name="prize_pool" defaultValue={event.prize_pool} className="mt-1 block w-full rounded-md border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm focus:border-red-600 focus:ring-1 focus:ring-red-600 sm:text-sm p-3 border" />
              </div>
              <div>
                <label className="block text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">Minimum Team Size</label>
                <input 
                  type="number" 
                  min="1" 
                  name="team_size_min" 
                  value={minTeamSize} 
                  onChange={(e) => setMinTeamSize(parseInt(e.target.value) || 1)} 
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm focus:border-red-600 focus:ring-1 focus:ring-red-600 sm:text-sm p-3 border" 
                />
              </div>
              <div>
                <label className="block text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">Maximum Team Size</label>
                <input 
                  type="number" 
                  min="1" 
                  name="team_size_max" 
                  value={maxTeamSize} 
                  onChange={(e) => setMaxTeamSize(parseInt(e.target.value) || 1)} 
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm focus:border-red-600 focus:ring-1 focus:ring-red-600 sm:text-sm p-3 border" 
                />
              </div>

              {/* Dynamic Participation Mode Indicator */}
              <div className="col-span-1 md:col-span-2">
                {minTeamSize === 1 && maxTeamSize === 1 ? (
                  <div className="p-3.5 rounded-lg bg-emerald-50 border-2 border-emerald-400 text-emerald-900 text-xs font-bold flex flex-wrap items-center justify-between gap-2 shadow-sm animate-fadeIn">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Participation Mode: <strong className="text-emerald-950 uppercase tracking-wide">Individual Participant</strong> (1 Member Only)</span>
                    </div>
                    <span className="text-[11px] font-medium text-emerald-700">Public event page will automatically display "Individual Participant"</span>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs font-bold flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      <span>Participation Mode: <strong>Team ({minTeamSize} to {maxTeamSize} Members)</strong></span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMinTeamSize(1);
                        setMaxTeamSize(1);
                      }}
                      className="text-[11px] text-red-600 hover:text-red-800 underline font-bold"
                    >
                      Click to set as Individual Participant (1-1)
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="pt-4 flex justify-end">
              <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.2)] flex items-center justify-center min-w-[140px] disabled:opacity-75 disabled:cursor-not-allowed transition">
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : 'Save Details'}
              </button>
            </div>
          </form>
        </div>

        {/* Prizing & Winners Section */}
        <div className="bauhaus-card bg-white dark:bg-zinc-900 p-6 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] border-t-4 border-t-yellow-500">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">Prizing & Winner Categories</h2>
            <button 
              onClick={() => setPrizes([...prizes, { title: 'New Prize', amount: '₹0', description: '', sort_order: prizes.length + 1 }])}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 border-2 border-black dark:border-zinc-600 text-xs font-black uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
            >
              + Add Prize
            </button>
          </div>
          
          <form onSubmit={(e) => handleUpdateContent('prizes', prizes, e)} className="space-y-6">
            {prizes.map((prize, idx) => (
              <div 
                key={idx} 
                draggable
                onDragStart={() => onDragStart(idx, 'prizes')}
                onDragOver={onDragOver}
                onDrop={() => onDrop(idx, 'prizes', prizes, setPrizes)}
                className="flex gap-4 items-start p-4 border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 cursor-move hover:border-yellow-400 dark:hover:border-yellow-500 transition-colors"
              >
                <div className="flex flex-col justify-center text-gray-400 py-2">
                  <span className="text-xl">≡</span>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">Category Title</label>
                      <input 
                        value={prize.title}
                        onChange={(e) => {
                          const newPrizes = [...prizes];
                          newPrizes[idx].title = e.target.value;
                          setPrizes(newPrizes);
                        }}
                        className="mt-1 w-full p-2 border-2 border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm focus:border-red-500 focus:outline-none" 
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">Prize Amount</label>
                      <input 
                        value={prize.amount}
                        onChange={(e) => {
                          const newPrizes = [...prizes];
                          newPrizes[idx].amount = e.target.value;
                          setPrizes(newPrizes);
                        }}
                        className="mt-1 w-full p-2 border-2 border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm focus:border-red-500 focus:outline-none" 
                      />
                    </div>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setPrizes(prizes.filter((_, i) => i !== idx))}
                  className="text-red-500 hover:text-red-700 font-bold p-2"
                >
                  Remove
                </button>
              </div>
            ))}
            {prizes.length === 0 && <p className="text-zinc-500 dark:text-zinc-400 italic text-sm">No prizes configured.</p>}
            <div className="pt-4 flex justify-end">
              <button type="submit" className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] transition">Save Prizes</button>
            </div>
          </form>
        </div>

        {/* Rules Section */}
        <div className="bauhaus-card bg-white dark:bg-zinc-900 p-6 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] border-t-4 border-t-blue-500">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">Rules</h2>
            <button onClick={() => setRules([...rules, { title: 'New Rule', description: '', sort_order: rules.length + 1 }])} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 border-2 border-black dark:border-zinc-600 text-xs font-black uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">+ Add Rule</button>
          </div>
          <form onSubmit={(e) => handleUpdateContent('rules', rules, e)} className="space-y-4">
            {rules.map((item, idx) => (
              <div 
                key={idx} 
                draggable
                onDragStart={() => onDragStart(idx, 'rules')}
                onDragOver={onDragOver}
                onDrop={() => onDrop(idx, 'rules', rules, setRules)}
                className="flex gap-4 p-4 border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 cursor-move hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
              >
                <div className="flex flex-col justify-center text-zinc-400 dark:text-zinc-500">
                  <span className="text-xl">≡</span>
                </div>
                <div className="flex-1 space-y-2">
                  <input value={item.title} onChange={(e) => { const n = [...rules]; n[idx].title = e.target.value; setRules(n); }} placeholder="Rule Title" className="w-full p-2 border-2 border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm font-bold focus:border-red-500 focus:outline-none" required />
                  <textarea value={item.description || ''} onChange={(e) => { const n = [...rules]; n[idx].description = e.target.value; setRules(n); }} placeholder="Description" className="w-full p-2 border-2 border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm focus:border-red-500 focus:outline-none" />
                </div>
                <button type="button" onClick={() => setRules(rules.filter((_, i) => i !== idx))} className="text-red-500 font-bold">X</button>
              </div>
            ))}
            {rules.length === 0 && <p className="text-zinc-500 dark:text-zinc-400 italic text-sm">No rules configured.</p>}
            <div className="flex justify-end"><button type="submit" className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] transition">Save Rules</button></div>
          </form>
        </div>

        {/* Eligibility Section */}
        <div className="bauhaus-card bg-white dark:bg-zinc-900 p-6 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] border-t-4 border-t-green-500">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">Eligibility</h2>
            <button onClick={() => setEligibility([...eligibility, { title: 'New Requirement', description: '', sort_order: eligibility.length + 1 }])} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 border-2 border-black dark:border-zinc-600 text-xs font-black uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">+ Add Requirement</button>
          </div>
          <form onSubmit={(e) => handleUpdateContent('eligibility', eligibility, e)} className="space-y-4">
            {eligibility.map((item, idx) => (
              <div 
                key={idx} 
                draggable
                onDragStart={() => onDragStart(idx, 'eligibility')}
                onDragOver={onDragOver}
                onDrop={() => onDrop(idx, 'eligibility', eligibility, setEligibility)}
                className="flex gap-4 p-4 border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 cursor-move hover:border-green-400 dark:hover:border-green-500 transition-colors"
              >
                <div className="flex flex-col justify-center text-zinc-400 dark:text-zinc-500">
                  <span className="text-xl">≡</span>
                </div>
                <div className="flex-1 space-y-2">
                  <input value={item.title} onChange={(e) => { const n = [...eligibility]; n[idx].title = e.target.value; setEligibility(n); }} placeholder="Requirement" className="w-full p-2 border-2 border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm font-bold focus:border-red-500 focus:outline-none" required />
                  <textarea value={item.description || ''} onChange={(e) => { const n = [...eligibility]; n[idx].description = e.target.value; setEligibility(n); }} placeholder="Details" className="w-full p-2 border-2 border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm focus:border-red-500 focus:outline-none" />
                </div>
                <button type="button" onClick={() => setEligibility(eligibility.filter((_, i) => i !== idx))} className="text-red-500 font-bold">X</button>
              </div>
            ))}
            {eligibility.length === 0 && <p className="text-zinc-500 dark:text-zinc-400 italic text-sm">No requirements configured.</p>}
            <div className="flex justify-end"><button type="submit" className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] transition">Save Eligibility</button></div>
          </form>
        </div>

        {/* Timeline & Rounds Section */}
        <div className="bauhaus-card bg-white dark:bg-zinc-900 p-6 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] border-t-4 border-t-purple-500">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">Dates, Rounds & Deadlines</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">Manage predefined Registration & Submission windows and create custom hackathon rounds.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button 
                type="button"
                onClick={() => {
                  const sorted = [...timeline].sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());
                  sorted.forEach((item, i) => item.sort_order = i + 1);
                  setTimeline(sorted);
                }}
                className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 border-2 border-zinc-300 dark:border-zinc-600 text-xs font-black hover:border-black dark:hover:border-zinc-400 transition"
              >
                Sort by Date
              </button>
              <button 
                type="button"
                onClick={() => {
                  const defaultStart = event?.start_date || new Date().toISOString();
                  const defaultEnd = event?.end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
                  setTimeline([...timeline, { 
                    title: `Round ${timeline.length + 1}`, 
                    description: '', 
                    start_datetime: defaultStart, 
                    end_datetime: defaultEnd, 
                    sort_order: timeline.length + 1 
                  }]);
                }} 
                className="px-3 py-1.5 bg-black dark:bg-zinc-800 text-white border-2 border-black dark:border-zinc-600 text-xs font-black hover:bg-red-600 dark:hover:bg-red-600 hover:border-red-600 transition"
              >
                + Add Round
              </button>
            </div>
          </div>

          {/* Quick Round Templates & Predefined Re-add Bar */}
          <div className="mb-6 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wide mr-1">Quick Add:</span>
            {!timeline.some(it => (it.title || '').toLowerCase().includes('registration') || (it.title || '').toLowerCase().includes('register')) && (
              <button
                type="button"
                onClick={() => {
                  const defaultStart = event?.start_date || new Date().toISOString();
                  const defaultEnd = event?.end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
                  setTimeline([
                    {
                      title: 'Registration',
                      description: 'Team registration and team formation period',
                      start_datetime: defaultStart,
                      end_datetime: defaultEnd,
                      sort_order: 1
                    },
                    ...timeline
                  ]);
                }}
                className="px-2.5 py-1 rounded bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition"
              >
                + Registration (Predefined)
              </button>
            )}
            {!timeline.some(it => (it.title || '').toLowerCase().includes('submission')) && (
              <button
                type="button"
                onClick={() => {
                  const defaultStart = event?.start_date || new Date().toISOString();
                  const defaultEnd = event?.end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
                  setTimeline([
                    ...timeline,
                    {
                      title: 'Submission',
                      description: 'Project and demo video submission period',
                      start_datetime: defaultStart,
                      end_datetime: defaultEnd,
                      sort_order: timeline.length + 1
                    }
                  ]);
                }}
                className="px-2.5 py-1 rounded bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 shadow-sm transition"
              >
                + Submission (Predefined)
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                const defaultStart = event?.start_date || new Date().toISOString();
                const defaultEnd = event?.end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
                setTimeline([...timeline, {
                  title: 'Round 1: Idea / PPT Submission',
                  description: 'Submit your project synopsis and pitch presentation.',
                  start_datetime: defaultStart,
                  end_datetime: defaultEnd,
                  sort_order: timeline.length + 1
                }]);
              }}
              className="px-2.5 py-1 rounded bg-white dark:bg-zinc-800 border border-purple-300 text-purple-900 dark:text-purple-200 text-xs font-bold hover:bg-purple-100 dark:hover:bg-zinc-700 transition"
            >
              + Round 1: Idea / PPT
            </button>
            <button
              type="button"
              onClick={() => {
                const defaultStart = event?.start_date || new Date().toISOString();
                const defaultEnd = event?.end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
                setTimeline([...timeline, {
                  title: 'Round 2: Prototype Evaluation',
                  description: 'Submit working GitHub repository and video walkthrough.',
                  start_datetime: defaultStart,
                  end_datetime: defaultEnd,
                  sort_order: timeline.length + 1
                }]);
              }}
              className="px-2.5 py-1 rounded bg-white dark:bg-zinc-800 border border-purple-300 text-purple-900 dark:text-purple-200 text-xs font-bold hover:bg-purple-100 dark:hover:bg-zinc-700 transition"
            >
              + Round 2: Prototype Evaluation
            </button>
            <button
              type="button"
              onClick={() => {
                const defaultStart = event?.start_date || new Date().toISOString();
                const defaultEnd = event?.end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
                setTimeline([...timeline, {
                  title: 'Round 3: Final Demo & Pitching',
                  description: 'Live jury presentation and Q&A session.',
                  start_datetime: defaultStart,
                  end_datetime: defaultEnd,
                  sort_order: timeline.length + 1
                }]);
              }}
              className="px-2.5 py-1 rounded bg-white dark:bg-zinc-800 border border-purple-300 text-purple-900 dark:text-purple-200 text-xs font-bold hover:bg-purple-100 dark:hover:bg-zinc-700 transition"
            >
              + Round 3: Final Demo
            </button>
          </div>

          <form onSubmit={(e) => handleUpdateContent('timeline', timeline, e)} className="space-y-4">
            {timeline.map((item, idx) => {
              const isReg = (item.title || '').toLowerCase().includes('registration') || (item.title || '').toLowerCase().includes('register');
              const isSub = (item.title || '').toLowerCase().includes('submission');

              return (
                <div 
                  key={idx} 
                  draggable
                  onDragStart={() => onDragStart(idx, 'timeline')}
                  onDragOver={onDragOver}
                  onDrop={() => onDrop(idx, 'timeline', timeline, setTimeline)}
                  className={`flex gap-4 p-4 border-2 rounded-md cursor-move transition-colors ${
                    isReg ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800 hover:border-blue-500 dark:hover:border-blue-600' :
                    isSub ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800 hover:border-purple-500 dark:hover:border-purple-600' :
                    'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
                  }`}
                >
                  <div className="flex flex-col justify-center text-zinc-400 dark:text-zinc-500">
                    <span className="text-xl select-none">≡</span>
                  </div>
                  <div className="flex-1 space-y-3">
                    {/* Badge and Title */}
                    <div className="flex flex-wrap items-center gap-2">
                      {isReg && (
                        <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider">
                          Predefined Registration
                        </span>
                      )}
                      {isSub && (
                        <span className="px-2 py-0.5 rounded bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider">
                          Predefined Submission
                        </span>
                      )}
                      {!isReg && !isSub && (
                        <span className="px-2 py-0.5 rounded bg-zinc-700 text-white text-[10px] font-black uppercase tracking-wider">
                          Custom Round #{idx + 1}
                        </span>
                      )}
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 font-bold">Sort Order: {idx + 1}</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">Round / Milestone Title</label>
                      <input 
                        value={item.title} 
                        onChange={(e) => { const n = [...timeline]; n[idx].title = e.target.value; setTimeline(n); }} 
                        placeholder="e.g. Registration, Submission, Round 1: PPT Submission" 
                        className="w-full p-2 border-2 border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm font-bold focus:border-red-500 focus:outline-none" 
                        required 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">Description (Optional)</label>
                      <textarea 
                        value={item.description || ''} 
                        onChange={(e) => { const n = [...timeline]; n[idx].description = e.target.value; setTimeline(n); }} 
                        placeholder="Provide details or instructions for this round..." 
                        rows={2}
                        className="w-full p-2 border-2 border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm focus:border-red-500 focus:outline-none" 
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">
                          Start Date & Time {isReg && '(Registration Opens)'} {isSub && '(Submissions Unlock)'}
                        </label>
                        <input 
                          type="datetime-local" 
                          value={toLocalInputValue(item.start_datetime)} 
                          onChange={(e) => { 
                            if (!e.target.value) return;
                            const d = new Date(e.target.value);
                            if (isNaN(d.getTime())) return;
                            const n = [...timeline]; 
                            n[idx].start_datetime = d.toISOString(); 
                            setTimeline(n); 
                          }} 
                          className="w-full p-2 border-2 border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm focus:border-red-500 focus:outline-none" 
                          required 
                        />
                        {item.start_datetime && (
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-1">
                            Starts: <strong className="text-zinc-800 dark:text-zinc-200">{formatPreviewDatetime(item.start_datetime)}</strong>
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">
                          End Date & Time {isReg && '(Registration Deadline)'} {isSub && '(Submission Deadline)'}
                        </label>
                        <input 
                          type="datetime-local" 
                          value={toLocalInputValue(item.end_datetime)} 
                          onChange={(e) => { 
                            const n = [...timeline]; 
                            if (!e.target.value) {
                              n[idx].end_datetime = null;
                            } else {
                              const d = new Date(e.target.value);
                              if (!isNaN(d.getTime())) {
                                n[idx].end_datetime = d.toISOString();
                              }
                            }
                            setTimeline(n); 
                          }} 
                          className="w-full p-2 border-2 border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm focus:border-red-500 focus:outline-none" 
                        />
                        {item.end_datetime && (
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-1">
                            Ends: <strong className="text-zinc-800 dark:text-zinc-200">{formatPreviewDatetime(item.end_datetime)}</strong>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col justify-start">
                    <button 
                      type="button" 
                      title="Delete this round"
                      onClick={() => setTimeline(timeline.filter((_, i) => i !== idx))} 
                      className="px-3 py-1.5 rounded bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs border border-red-300 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
            {timeline.length === 0 && (
              <div className="p-8 text-center border-2 border-dashed rounded-lg bg-gray-50">
                <p className="text-gray-500 font-bold mb-3">No dates or rounds configured.</p>
                <div className="flex justify-center gap-2">
                  <button 
                    type="button"
                    onClick={() => {
                      const defaultStart = event?.start_date || new Date().toISOString();
                      const defaultEnd = event?.end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
                      setTimeline([
                        {
                          title: 'Registration',
                          description: 'Team registration and team formation period',
                          start_datetime: defaultStart,
                          end_datetime: defaultEnd,
                          sort_order: 1
                        },
                        {
                          title: 'Submission',
                          description: 'Project and demo video submission period',
                          start_datetime: defaultStart,
                          end_datetime: defaultEnd,
                          sort_order: 2
                        }
                      ]);
                    }}
                    className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded hover:bg-purple-700"
                  >
                    + Initialize Default Predefined Rounds
                  </button>
                </div>
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={isSaving} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded font-bold transition shadow">
                Save Dates & Rounds
              </button>
            </div>
          </form>
        </div>

        {/* Contacts Section */}
        <div className="bauhaus-card bg-white dark:bg-zinc-900 p-6 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] border-t-4 border-t-pink-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">Admin Contacts</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">Assigned organizers/admins displayed on the public event page.</p>
            </div>
            <div className="flex gap-2">
              <select 
                className="border-2 border-black dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded p-2 text-xs font-black uppercase tracking-wider"
                onChange={(e) => {
                  const selectedId = e.target.value;
                  if (!selectedId) return;
                  const admin = availableAdmins.find(a => a.id === selectedId);
                  if (admin) {
                    setContacts([...contacts, { name: admin.name, email: admin.email, phone: admin.phone || '', role: 'Admin', sort_order: contacts.length + 1 }]);
                  }
                  e.target.value = ''; // reset
                }}
              >
                <option value="">+ Assign Existing Admin</option>
                {availableAdmins.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                ))}
              </select>
            </div>
          </div>
          <form onSubmit={(e) => handleUpdateContent('contacts', contacts, e)} className="space-y-4">
            {contacts.map((item, idx) => (
              <div 
                key={idx} 
                draggable
                onDragStart={() => onDragStart(idx, 'contacts')}
                onDragOver={onDragOver}
                onDrop={() => onDrop(idx, 'contacts', contacts, setContacts)}
                className="flex gap-4 p-4 border-2 border-black dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-800/60 items-start cursor-move hover:border-pink-500 transition-colors"
              >
                <div className="flex flex-col justify-center text-zinc-400 py-2 font-mono">
                  <span className="text-xl">≡</span>
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">Name (Auto-filled)</label>
                    <input value={item.name} readOnly className="w-full p-2.5 border-2 border-black dark:border-zinc-700 rounded text-xs bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white font-black" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">Email</label>
                    <input value={item.email || ''} onChange={(e) => { const n = [...contacts]; n[idx].email = e.target.value; setContacts(n); }} placeholder="Email" className="w-full p-2.5 border-2 border-black dark:border-zinc-700 rounded text-xs bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-medium" />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">Phone Number</label>
                    <input value={item.phone || ''} onChange={(e) => { const n = [...contacts]; n[idx].phone = e.target.value; setContacts(n); }} placeholder="Phone Number" className="w-full p-2.5 border-2 border-black dark:border-zinc-700 rounded text-xs bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-medium" />
                  </div>
                </div>
                <button type="button" onClick={() => setContacts(contacts.filter((_, i) => i !== idx))} className="text-red-600 dark:text-red-400 font-black p-2 border-2 border-transparent hover:border-red-600 rounded transition">X</button>
              </div>
            ))}
            {contacts.length === 0 && <p className="text-xs font-bold text-zinc-500 italic">No contacts configured.</p>}
            <div className="flex justify-end">
              <button type="submit" disabled={isSaving} className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] transition">
                Save Contacts
              </button>
            </div>
          </form>
        </div>

        {/* Visibility Toggles Section */}
        <div className="bauhaus-card bg-white dark:bg-zinc-900 p-6 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] border-t-4 border-t-blue-500">
          <div className="mb-6">
            <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">Public Page Visibility</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">Toggle visibility of specific sections and features on the public hackathon page and navigation.</p>
          </div>
          <form className="space-y-6" onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const data = {
              show_public_teams: formData.get('show_public_teams') === 'true',
              show_public_projects: formData.get('show_public_projects') === 'true',
              show_public_results: formData.get('show_public_results') === 'true',
              show_prizes: formData.get('show_prizes') === 'true',
              show_eligibility: formData.get('show_eligibility') === 'true',
              show_rules: formData.get('show_rules') === 'true',
              show_timeline: formData.get('show_timeline') === 'true',
              show_contacts: formData.get('show_contacts') === 'true',
              show_certificates: formData.get('show_certificates') === 'true',
              show_public_judges: false
            };
            setIsSaving(true);
            api.patch(`/organizer/events/${id}`, data)
              .then(() => {
                showToast('Visibility settings saved!', 'success');
                loadEventDetails();
              })
              .catch((err) => showToast(err.response?.data?.error || 'Failed to update visibility', 'error'))
              .finally(() => setIsSaving(false));
          }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'show_public_results', label: 'Publish Leaderboard & Results', desc: 'Display official ranking and results tab in navigation and public portal' },
                { key: 'show_certificates', label: 'Participant Certificates', desc: 'Enable participant download of official certificates once generated in Certificate Studio' },
                { key: 'show_public_teams', label: 'Public Teams Directory', desc: 'Display registered teams on public page' },
                { key: 'show_public_projects', label: 'Public Projects Gallery', desc: 'Display submitted hackathon projects publicly' },
                { key: 'show_prizes', label: 'Prizes & Rewards', desc: 'Display prize pool and category tracks' },
                { key: 'show_eligibility', label: 'Eligibility Criteria', desc: 'Display participant eligibility requirements' },
                { key: 'show_rules', label: 'Rules & Guidelines', desc: 'Display hackathon guidelines and rules' },
                { key: 'show_timeline', label: 'Dates & Deadlines Timeline', desc: 'Display schedule, timeline, and rounds' },
                { key: 'show_contacts', label: 'Admin Contacts', desc: 'Display organizer contact information' }
              ].map((item) => {
                const isChecked = !!event[item.key];
                return (
                  <div 
                    key={item.key} 
                    className="flex items-center justify-between p-4 border-2 border-black dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 rounded-md gap-4 hover:border-black dark:hover:border-zinc-500 transition-colors"
                  >
                    <div className="flex-1 pr-3">
                      <span className="block text-xs font-black uppercase text-zinc-900 dark:text-white">
                        {item.label}
                      </span>
                      <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                        {item.desc}
                      </span>
                    </div>

                    <input type="hidden" name={item.key} value={event[item.key] ? 'true' : 'false'} />

                    <button
                      type="button"
                      role="switch"
                      aria-checked={isChecked}
                      onClick={() => {
                        const updatedVal = !event[item.key];
                        setEvent({ ...event, [item.key]: updatedVal });
                      }}
                      className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-black dark:border-white p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                        isChecked ? 'bg-red-600' : 'bg-zinc-300 dark:bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white border border-black shadow-sm ring-0 transition duration-200 ease-in-out ${
                          isChecked ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="pt-2 flex justify-end">
              <button 
                type="submit" 
                disabled={isSaving}
                className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-wider border-2 border-black dark:border-white shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
              >
                {isSaving ? 'Saving...' : 'Update Visibility Settings'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};
