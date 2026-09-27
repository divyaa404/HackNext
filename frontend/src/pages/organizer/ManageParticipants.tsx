import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserCheck, Sparkles } from 'lucide-react';

export const ManageParticipants = () => {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParticipants();
  }, []);

  const loadParticipants = async () => {
    try {
      const res = await axios.get(`/api/users?role=participant`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setParticipants(res.data);
    } catch (err) {
      console.error('Failed to load participants', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bauhaus-card p-6 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-2 border-red-500 font-mono text-[10px] font-black uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-red-600" />
              <span>User Access</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
              Participants
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mt-0.5">
              View all registered participants across the platform.
            </p>
          </div>
          <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-2 border-black dark:border-zinc-700 font-mono text-sm font-black text-zinc-900 dark:text-white">
            {participants.length} <span className="text-zinc-500 dark:text-zinc-400 font-medium">total</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bauhaus-card bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-800/80 border-b-4 border-black dark:border-zinc-700">
                <th className="px-6 py-3.5 text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-red-600" />
                    Email
                  </div>
                </th>
                <th className="px-6 py-3.5 text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Joined At
                </th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-zinc-200 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={2} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-medium">Loading participants...</span>
                    </div>
                  </td>
                </tr>
              ) : participants.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                    <Users className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                    <p className="font-bold text-sm">No participants yet.</p>
                    <p className="text-xs mt-1">Participants will appear here once they register.</p>
                  </td>
                </tr>
              ) : (
                participants.map(user => (
                  <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-red-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                          {user.email?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="text-sm font-bold text-zinc-900 dark:text-white font-mono">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                      {new Date(user.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
