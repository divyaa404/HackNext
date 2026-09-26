import { useState, useEffect } from 'react';
import axios from 'axios';
import { Copy, Check, Key, XCircle } from 'lucide-react';

export const ManageResets = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [passkeyModal, setPasskeyModal] = useState<{passkey: string, expiresAt: string} | null>(null);
  const [copied, setCopied] = useState(false);

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

  const handleGenerate = async (id: string) => {
    try {
      const res = await axios.post(`/api/resets/${id}/generate`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPasskeyModal(res.data);
      loadRequests();
    } catch (err) {
      alert('Failed to generate passkey');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this reset request?')) return;
    try {
      await axios.post(`/api/resets/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      loadRequests();
    } catch (err) {
      alert('Failed to cancel request');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Password Reset Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Manage offline password recovery for participants.</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-500">Loading...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-500">No reset requests found.</td></tr>
            ) : (
              requests.map(req => (
                <tr key={req.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{req.user.name || '-'}</div>
                    <div className="text-xs text-gray-500">{req.user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(req.requested_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {req.status === 'PENDING' && <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>}
                    {req.status === 'PASSKEY_GENERATED' && <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Passkey Generated</span>}
                    {req.status === 'RESOLVED' && <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Resolved</span>}
                    {req.status === 'CANCELLED' && <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Cancelled</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {req.status !== 'RESOLVED' && req.status !== 'CANCELLED' && (
                      <div className="flex justify-end space-x-3">
                        <button 
                          onClick={() => handleGenerate(req.id)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center"
                        >
                          <Key className="w-4 h-4 mr-1" /> Generate Passkey
                        </button>
                        <button 
                          onClick={() => handleCancel(req.id)}
                          className="text-red-600 hover:text-red-900 flex items-center"
                        >
                          <XCircle className="w-4 h-4 mr-1" /> Cancel
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

      {passkeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Temporary Reset Passkey</h2>
            <p className="text-sm text-gray-600 mb-4">
              Give this passkey to the participant. It expires in 15 minutes.
            </p>
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-md mb-6 relative">
              <div className="flex justify-between items-center">
                <code className="text-lg font-bold text-gray-900 font-mono tracking-widest">{passkeyModal.passkey}</code>
                <button 
                  onClick={() => copyToClipboard(passkeyModal.passkey)} 
                  className="text-gray-400 hover:text-indigo-600 focus:outline-none"
                >
                  {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <div className="mt-2 text-xs text-red-500 font-medium">
                Expires: {new Date(passkeyModal.expiresAt).toLocaleTimeString()}
              </div>
            </div>
            <button 
              onClick={() => setPasskeyModal(null)} 
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
