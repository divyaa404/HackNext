import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { EventContext } from '../../components/OrganizerLayout';
import { Calendar, PlusSquare, ArrowRight, Sparkles } from 'lucide-react';

export const ManageEvents = () => {
  const { events } = useContext(EventContext);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bauhaus-card p-6 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-2 border-red-500 font-mono text-[10px] font-black uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-red-600" />
              <span>Event Operations</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
              Manage Events
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mt-0.5">
              View, configure, and inspect all created hackathons and their live metrics.
            </p>
          </div>

          <Link
            to="/organizer/events/new"
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.2)] flex items-center gap-2 transition hover:-translate-y-0.5 active:translate-y-0"
          >
            <PlusSquare className="w-4 h-4" />
            <span>Create New Event</span>
          </Link>
        </div>
      </div>

      {/* Events Table / Card Container */}
      <div className="bauhaus-card bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-800/80 border-b-4 border-black dark:border-zinc-700">
                <th className="px-6 py-3.5 text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Event Name
                </th>
                <th className="px-6 py-3.5 text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Timeline
                </th>
                <th className="px-6 py-3.5 text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 text-center">
                  Teams
                </th>
                <th className="px-6 py-3.5 text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 text-center">
                  Submissions
                </th>
                <th className="px-6 py-3.5 text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-zinc-200 dark:divide-zinc-800">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                  <td className="px-6 py-4">
                    <div className="font-black text-sm uppercase text-zinc-900 dark:text-white">
                      {event.name}
                    </div>
                    {event.slug && (
                      <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                        /{event.slug}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      <Calendar className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      <span>
                        {new Date(event.start_date).toLocaleDateString()} – {new Date(event.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-block px-3 py-1 rounded bg-zinc-100 dark:bg-zinc-800 border-2 border-black dark:border-zinc-700 font-mono text-xs font-black">
                      {event._count?.teams || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-block px-3 py-1 rounded bg-zinc-100 dark:bg-zinc-800 border-2 border-black dark:border-zinc-700 font-mono text-xs font-black">
                      {event._count?.submissions || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/organizer/events/${event.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-black hover:bg-red-600 text-white dark:bg-zinc-800 dark:hover:bg-red-600 font-black text-xs uppercase tracking-wider border-2 border-black dark:border-zinc-700 transition shadow-sm"
                    >
                      <span>Configure</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}

              {events.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                    <Calendar className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                    <p className="font-bold text-sm">No events found.</p>
                    <p className="text-xs mt-1 mb-4">Get started by launching your first hackathon event.</p>
                    <Link
                      to="/organizer/events/new"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] transition"
                    >
                      <PlusSquare className="w-4 h-4" />
                      <span>Create your first event</span>
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
