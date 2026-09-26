import { useState, FormEvent, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createEvent } from '../../api/events';
import { EventContext } from '../../components/OrganizerLayout';
import { Calendar, PlusCircle, ArrowLeft, Clock, Sparkles, AlertCircle } from 'lucide-react';

const toLocalInputValue = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const CreateEvent = () => {
  const [name, setName] = useState('');
  // Default start to current time, end to +7 days 23:59
  const [startDate, setStartDate] = useState(() => toLocalInputValue(new Date()));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(23, 59, 0, 0);
    return toLocalInputValue(d);
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { refreshEvents } = useContext(EventContext);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) {
      setError('Please fill in all required fields.');
      return;
    }

    const startDt = new Date(startDate);
    const endDt = new Date(endDate);

    if (startDt > endDt) {
      setError('Start date & time cannot be after end date & time.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const created = await createEvent({
        name: name.trim(),
        start_date: startDt.toISOString(),
        end_date: endDt.toISOString(),
        tracks: [],
        prizes_config: {}
      });
      refreshEvents?.();
      navigate(`/organizer/events/${created.id || ''}`);
    } catch (err: any) {
      console.error('Failed to create event', err);
      setError(err.response?.data?.error || 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bauhaus-card p-6 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-2 border-red-500 font-mono text-[10px] font-black uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-red-600" />
              <span>Event Provisioning</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
              Create New Event
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mt-0.5">
              Launch a new hackathon instance with customized timelines, tracks, and judging rubrics.
            </p>
          </div>

          <Link
            to="/organizer/events"
            className="self-start sm:self-auto px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-black text-xs uppercase tracking-wider border-2 border-black dark:border-zinc-600 flex items-center gap-1.5 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Events</span>
          </Link>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bauhaus-card p-6 md:p-8 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)]">
        {error && (
          <div className="mb-6 p-4 border-4 border-red-600 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 flex items-center gap-3 shadow-[4px_4px_0px_rgba(220,38,38,1)]">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <p className="text-xs font-black uppercase tracking-wider">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Name */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300 mb-2">
              Event Name <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. HackNext Hackathon 2026"
                className="w-full px-4 py-3 border-2 border-black dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition shadow-sm rounded-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-1">
              Give your event a clear, recognizable title.
            </p>
          </div>

          {/* Date Range Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-red-600" />
                <span>Start Date & Time</span> <span className="text-red-600">*</span>
              </label>
              <input
                type="datetime-local"
                required
                className="w-full px-4 py-3 border-2 border-black dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition shadow-sm rounded-none"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-red-600" />
                <span>End Date & Time</span> <span className="text-red-600">*</span>
              </label>
              <input
                type="datetime-local"
                required
                className="w-full px-4 py-3 border-2 border-black dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition shadow-sm rounded-none"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t-2 border-zinc-200 dark:border-zinc-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
            <Link
              to="/organizer/events"
              className="w-full sm:w-auto px-6 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-black text-xs uppercase tracking-wider border-2 border-black dark:border-zinc-600 transition text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{loading ? 'Creating Event...' : 'Create Event'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
