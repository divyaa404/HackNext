import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Clock, 
  Plus, 
  Trash2, 
  FastForward, 
  Sparkles, 
  XCircle,
  Save
} from 'lucide-react';

export const ManageTimeline = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [timeline, setTimeline] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type }), 3500);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadTimeline(selectedEventId);
    }
  }, [selectedEventId]);

  const loadEvents = async () => {
    try {
      const res = await axios.get('/api/events/my-events', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setEvents(res.data || []);
      if (res.data?.length > 0) {
        setSelectedEventId(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  };

  const loadTimeline = async (eventId: string) => {
    try {
      const res = await axios.get(`/api/events/${eventId}/organizer-details`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTimeline(res.data?.timeline_items || []);
    } catch (err) {
      console.error('Failed to load timeline:', err);
    }
  };

  const handleInitDefault5Steps = async () => {
    if (!selectedEventId) return;
    setIsSaving(true);
    try {
      const res = await axios.post(`/api/organizer/events/${selectedEventId}/timeline/init-default`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      showToast(res.data.message || 'Predefined 5-step timeline initialized!', 'success');
      loadTimeline(selectedEventId);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to initialize default timeline', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExtendHour = async (itemId?: string) => {
    if (!selectedEventId) return;
    try {
      const res = await axios.post(`/api/organizer/events/${selectedEventId}/timeline/extend-hour`, { itemId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      showToast(res.data.message || 'Timeline successfully extended +1 hour!', 'success');
      loadTimeline(selectedEventId);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to extend timeline', 'error');
    }
  };

  const handleClosePhase = async (itemId?: string) => {
    if (!selectedEventId) return;
    try {
      const res = await axios.post(`/api/organizer/events/${selectedEventId}/timeline/close-phase`, { itemId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      showToast(res.data.message || 'Phase closed immediately.', 'success');
      loadTimeline(selectedEventId);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to close phase', 'error');
    }
  };

  const handleSaveTimeline = async () => {
    if (!selectedEventId) return;
    setIsSaving(true);
    try {
      await axios.put(`/api/organizer/events/${selectedEventId}/content/timeline`, { items: timeline }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      showToast('Timeline schedule saved successfully!', 'success');
      loadTimeline(selectedEventId);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to save timeline', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const toLocalInput = (d: string | null | undefined) => {
    if (!d) return '';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg font-bold text-white transition-opacity ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      {/* Header Banner */}
      <div className="bauhaus-card p-6 md:p-8 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_rgba(255,255,255,0.2)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 border-2 border-purple-500 font-mono text-xs font-black uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-purple-600" />
              <span>Event Operations Control</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
              Event Timeline &amp; Deadlines
            </h1>
            <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 font-medium max-w-2xl leading-relaxed">
              Manage the 5-step lifecycle: <strong className="text-purple-600 dark:text-purple-400 font-black">Registration → Project Submission → Evaluation → Community Voting → Result Out</strong>. Extend deadlines by +1 hour or close phases with a single click.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleExtendHour()}
              className="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-black font-black text-xs uppercase tracking-wider border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] transition flex items-center gap-1.5"
            >
              <FastForward className="w-4 h-4" />
              <span>Extend +1 Hour</span>
            </button>
            <button
              onClick={handleSaveTimeline}
              disabled={isSaving}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] disabled:opacity-50 transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Timeline'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Event Select & Predefined Setup Bar */}
      <div className="bauhaus-card p-6 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5 flex-1 max-w-md">
            <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Active Hackathon Event
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full p-3 border-2 border-black dark:border-zinc-700 rounded bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold text-sm focus:outline-none"
            >
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleInitDefault5Steps}
              disabled={isSaving}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider rounded border-2 border-black shadow flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Reset to Predefined 5-Step Flow</span>
            </button>
            <button
              onClick={() => {
                setTimeline([...timeline, {
                  title: `Milestone ${timeline.length + 1}`,
                  description: '',
                  start_datetime: new Date().toISOString(),
                  end_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                  sort_order: timeline.length + 1
                }]);
              }}
              className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-black text-xs uppercase tracking-wider rounded border-2 border-black dark:border-zinc-600 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Round</span>
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Interactive List */}
      <div className="space-y-4">
        {timeline.map((item, idx) => {
          const now = new Date().getTime();
          const start = new Date(item.start_datetime).getTime();
          const end = item.end_datetime ? new Date(item.end_datetime).getTime() : start + 24 * 3600 * 1000;
          const isLive = now >= start && now <= end;
          const isCompleted = now > end;

          return (
            <div
              key={idx}
              className={`bauhaus-card p-6 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] space-y-4 transition-all ${
                isLive ? 'border-emerald-500 shadow-[6px_6px_0px_rgba(16,185,129,1)]' : ''
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-zinc-200 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-black text-white dark:bg-white dark:text-black font-black text-sm flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black uppercase text-zinc-900 dark:text-white">{item.title}</h3>
                      {isLive && (
                        <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider rounded animate-pulse">
                          Active Phase
                        </span>
                      )}
                      {isCompleted && (
                        <span className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold uppercase tracking-wider rounded">
                          Ended
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Instant Actions for Phase */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExtendHour(item.id)}
                    className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950 dark:text-amber-200 text-xs font-black uppercase tracking-wider rounded border border-amber-400 flex items-center gap-1"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    <span>+1 Hour</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleClosePhase(item.id)}
                    className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-950 dark:text-red-300 text-xs font-black uppercase tracking-wider rounded border border-red-400 flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Close Now</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeline(timeline.filter((_, i) => i !== idx))}
                    className="text-red-500 hover:text-red-700 p-1.5 ml-2"
                    title="Delete Round"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title & Dates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                    Round / Milestone Title
                  </label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => {
                      const n = [...timeline];
                      n[idx].title = e.target.value;
                      setTimeline(n);
                    }}
                    className="w-full p-2.5 border-2 border-black dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 font-bold text-sm"
                    required
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                    Phase Description
                  </label>
                  <input
                    type="text"
                    value={item.description || ''}
                    onChange={(e) => {
                      const n = [...timeline];
                      n[idx].description = e.target.value;
                      setTimeline(n);
                    }}
                    className="w-full p-2.5 border-2 border-black dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                    Start Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={toLocalInput(item.start_datetime)}
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const d = new Date(e.target.value);
                      if (isNaN(d.getTime())) return;
                      const n = [...timeline];
                      n[idx].start_datetime = d.toISOString();
                      setTimeline(n);
                    }}
                    className="w-full p-2.5 border-2 border-black dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 font-bold text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                    End Date &amp; Time (Deadline)
                  </label>
                  <input
                    type="datetime-local"
                    value={toLocalInput(item.end_datetime)}
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
                    className="w-full p-2.5 border-2 border-black dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 font-bold text-sm"
                  />
                </div>

                <div className="flex items-end">
                  <p className="text-xs font-bold text-zinc-500 pb-3">
                    {item.end_datetime ? `Duration: ${Math.round((new Date(item.end_datetime).getTime() - new Date(item.start_datetime).getTime()) / (3600 * 1000))} hours` : 'Ongoing'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
