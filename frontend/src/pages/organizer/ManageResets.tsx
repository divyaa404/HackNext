import { useState, useEffect } from 'react';
import axios from 'axios';
import { Copy, Check, Key, XCircle, ShieldAlert, Clock } from 'lucide-react';
import { UIModal } from '../../components/UIModal';

export const ManageResets = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [passkeyModal, setPasskeyModal] = useState<{passkey: string, expiresAt: string, userName?: string} | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const res = await axios.get(`/api/resets`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setRequests(res.data);
    } catch (err) {
      console.error('Failed to load reset requests', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (reqItem: any) => {
    try {
      const res = await axios.post(`/api/resets/${reqItem.id}/generate`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPasskeyModal({
        passkey: res.data.passkey,
        expiresAt: res.data.expiresAt,
        userName: reqItem.user?.name || reqItem.user?.email
      });
      loadRequests();
    } catch (err) {
      setErrorMsg('Failed to generate reset passkey. Please try again.');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await axios.post(`/api/resets/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      loadRequests();
    } catch (err) {
      console.error('Failed to cancel request', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* Top Header Card */}
      <div className="bauhaus-card p-6 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border-2 border-amber-500 font-mono text-[10px] font-black uppercase tracking-wider mb-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>Offline Recovery Service</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
              Password Reset Requests
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mt-0.5">
              Authorize and generate secure temporary passkeys for participants and staff requiring manual password resets.
            </p>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bauhaus-card bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="min-w-full divide-y-2 divide-black dark:divide-zinc-800">
            <thead className="bg-zinc-100 dark:bg-zinc-800">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                  Participant / User
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                  Requested At
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-zinc-500 font-bold uppercase text-xs">
                    Loading requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-zinc-500 font-bold uppercase text-xs">
                    No pending reset requests found.
                  </td>
                </tr>
              ) : (
                requests.map(req => (
                  <tr key={req.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-sm font-black uppercase text-zinc-900 dark:text-white">{req.user?.name || 'Participant'}</div>
                      <div className="text-xs text-zinc-500 font-mono">{req.user?.email || req.user?.staff_id}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400">
                      {new Date(req.requested_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {req.status === 'PENDING' && (
                        <span className="px-2.5 py-0.5 inline-flex text-[10px] font-black uppercase tracking-wider rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-400">
                          Pending Approval
                        </span>
                      )}
                      {req.status === 'PASSKEY_GENERATED' && (
                        <span className="px-2.5 py-0.5 inline-flex text-[10px] font-black uppercase tracking-wider rounded bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 border border-blue-400">
                          Passkey Active
                        </span>
                      )}
                      {req.status === 'RESOLVED' && (
                        <span className="px-2.5 py-0.5 inline-flex text-[10px] font-black uppercase tracking-wider rounded bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-400">
                          Resolved
                        </span>
                      )}
                      {req.status === 'CANCELLED' && (
                        <span className="px-2.5 py-0.5 inline-flex text-[10px] font-black uppercase tracking-wider rounded bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-400">
                          Cancelled
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right text-xs font-bold">
                      {req.status !== 'RESOLVED' && req.status !== 'CANCELLED' && (
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => handleGenerate(req)}
                            className="px-3 py-1.5 bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-black text-xs uppercase tracking-wider border-2 border-black dark:border-white shadow-[2px_2px_0px_rgba(220,38,38,1)] flex items-center gap-1.5 transition"
                          >
                            <Key className="w-3.5 h-3.5 text-red-500" />
                            <span>Generate Passkey</span>
                          </button>
                          <button 
                            onClick={() => handleCancel(req.id)}
                            className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-black text-xs uppercase tracking-wider border-2 border-black dark:border-zinc-600 flex items-center gap-1.5 transition"
                          >
                            <XCircle className="w-3.5 h-3.5 text-red-600" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Passkey Modal */}
      {passkeyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_rgba(255,255,255,0.2)] p-6 md:p-8 w-full max-w-md space-y-5">
            <div className="flex items-center space-x-2 text-red-600">
              <Key className="w-6 h-6" />
              <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
                Temporary Reset Passkey
              </h2>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
              Provide this one-time passkey to <span className="font-bold text-zinc-900 dark:text-white">{passkeyModal.userName}</span>. This passkey expires in 15 minutes.
            </p>
            
            <div className="bg-zinc-50 dark:bg-zinc-800 border-2 border-black dark:border-zinc-700 p-4 rounded space-y-2">
              <div className="flex justify-between items-center">
                <code className="text-xl font-black text-red-600 dark:text-red-400 font-mono tracking-widest select-all">
                  {passkeyModal.passkey}
                </code>
                <button 
                  onClick={() => copyToClipboard(passkeyModal.passkey)} 
                  className="px-3 py-1.5 bg-white dark:bg-zinc-900 border-2 border-black dark:border-zinc-600 font-bold text-xs uppercase tracking-wider flex items-center gap-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                  title="Copy passkey"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-red-600" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="text-[11px] text-zinc-500 font-mono font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Expires: {new Date(passkeyModal.expiresAt).toLocaleTimeString()}</span>
              </div>
            </div>

            <button 
              onClick={() => setPasskeyModal(null)} 
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] transition text-center"
            >
              Done & Close
            </button>
          </div>
        </div>
      )}

      <UIModal
        isOpen={!!errorMsg}
        title="Operation Failed"
        type="error"
        onClose={() => setErrorMsg(null)}
      >
        <div className="space-y-4">
          <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{errorMsg}</p>
          <button
            onClick={() => setErrorMsg(null)}
            className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs border-2 border-black tracking-wider transition shadow-[2px_2px_0px_rgba(0,0,0,1)]"
          >
            Acknowledge
          </button>
        </div>
      </UIModal>
    </div>
  );
};
