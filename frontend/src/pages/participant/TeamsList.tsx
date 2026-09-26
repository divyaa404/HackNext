import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users } from 'lucide-react';

export const TeamsList = () => {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Users className="w-12 h-12 text-bauhaus-primary" />
        <h1 className="text-3xl md:text-4xl font-black text-bauhaus-text uppercase tracking-tighter shadow-white drop-shadow-[2px_2px_0px_rgba(255,255,255,1)]">All Participating Teams</h1>
      </div>

      <div className="bauhaus-card bg-bauhaus-card p-4 md:p-8 border-bauhaus-border">
        {loading ? (
          <div className="text-center font-bold tracking-widest uppercase py-8">Loading teams...</div>
        ) : teams.length === 0 ? (
          <div className="text-center font-bold tracking-widest uppercase py-8 text-gray-500 dark:text-gray-400">No teams found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teams.map((team: any) => {
              const leader = team.members[0]?.user;
              const memberCount = team.members.length;
              return (
                <div key={team.id} className="border-4 border-bauhaus-border p-6 bg-bauhaus-bg hover:-translate-y-1 transition-transform shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.2)]">
                  <h3 className="text-2xl font-black uppercase tracking-widest mb-4 truncate text-bauhaus-primary">{team.name}</h3>
                  <div className="space-y-2">
                    <p className="font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                      Leader: <span className="text-bauhaus-text font-black">{leader?.name || 'Unknown'}</span>
                    </p>
                    <p className="font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                      Members: <span className="text-bauhaus-text font-black">{memberCount} / 4</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
