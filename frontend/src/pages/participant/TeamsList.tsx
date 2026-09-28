import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export const TeamsList = () => {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await axios.get('/api/teams/all', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTeams(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeams = teams.filter((team: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const teamName = team.name?.toLowerCase() || '';
    const leaderName = team.members?.[0]?.user?.name?.toLowerCase() || '';
    const leaderEmail = team.members?.[0]?.user?.email?.toLowerCase() || '';
    return teamName.includes(q) || leaderName.includes(q) || leaderEmail.includes(q);
  });

  const totalPages = Math.ceil(filteredTeams.length / ITEMS_PER_PAGE) || 1;
  const paginatedTeams = filteredTeams.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Users className="w-12 h-12 text-bauhaus-primary shrink-0" />
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-bauhaus-text uppercase tracking-tighter shadow-white drop-shadow-[2px_2px_0px_rgba(255,255,255,1)]">
              All Participating Teams
            </h1>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              {filteredTeams.length} {filteredTeams.length === 1 ? 'team' : 'teams'} registered
            </p>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search teams or leader..."
            className="w-full pl-9 pr-8 py-2.5 border-2 border-bauhaus-border bg-bauhaus-bg text-bauhaus-text font-bold text-xs focus:outline-none focus:border-bauhaus-primary placeholder:text-zinc-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 hover:text-black dark:hover:text-white px-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="bauhaus-card bg-bauhaus-card p-4 md:p-8 border-bauhaus-border">
        {loading ? (
          <div className="text-center font-bold tracking-widest uppercase py-8">Loading teams...</div>
        ) : filteredTeams.length === 0 ? (
          <div className="text-center font-bold tracking-widest uppercase py-8 text-gray-500 dark:text-gray-400">
            {searchQuery ? `No teams matching "${searchQuery}"` : 'No teams found.'}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paginatedTeams.map((team: any) => {
                const leader = team.members[0]?.user;
                const memberCount = team.members.length;
                const teamMax = team.event?.team_size_max || 4;
                return (
                  <div key={team.id} className="border-4 border-bauhaus-border p-6 bg-bauhaus-bg hover:-translate-y-1 transition-transform shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.2)]">
                    <h3 className="text-2xl font-black uppercase tracking-widest mb-4 truncate text-bauhaus-primary">{team.name}</h3>
                    <div className="space-y-2">
                      <p className="font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                        Leader: <span className="text-bauhaus-text font-black">{leader?.name || 'Unknown'}</span>
                      </p>
                      <p className="font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                        Members: <span className="text-bauhaus-text font-black">{memberCount} / {teamMax}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-4 border-t-2 border-bauhaus-border flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider text-[11px]">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredTeams.length)} of {filteredTeams.length} teams
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-2 border-2 border-bauhaus-border font-black bg-white dark:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="px-3 py-1.5 border-2 border-bauhaus-border font-black text-xs bg-bauhaus-primary text-white">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-2 border-2 border-bauhaus-border font-black bg-white dark:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
