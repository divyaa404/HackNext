import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Copy, 
  RefreshCw, 
  PlusCircle, 
  Check, 
  Edit2, 
  Save, 
  X, 
  ShieldCheck, 
  Gavel, 
  Key, 
  Share2,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { getPublicOrigin } from '../../utils/origin';

interface ManageStaffProps {
  role: 'admin' | 'judge';
}

export const ManageStaff = ({ role }: ManageStaffProps) => {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedStaffId, setCopiedStaffId] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Passkey reveal state per row
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  
  // Inline editing state
  const [isEditing, setIsEditing] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  // For provisioning modal
  const [showModal, setShowModal] = useState(false);
  const [provisionResult, setProvisionResult] = useState<{staff_id: string, tempPassword: string, name?: string} | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({ name: '', email: '', designation: '' });

  useEffect(() => {
    loadStaff();
    setFormData({ name: '', email: '', designation: '' });
    setIsEditing(false);
  }, [role]);

  const loadStaff = async () => {
    try {
      const res = await axios.get(`/api/users?role=${role}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStaff(res.data);
    } catch (err) {
      console.error('Failed to load staff', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`/api/invites/create`, { 
        role, 
        name: formData.name.trim(), 
        email: formData.email.trim() || undefined, 
        designation: formData.designation.trim() || undefined 
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProvisionResult({
        staff_id: res.data.staff_id,
        tempPassword: res.data.tempPassword,
        name: formData.name.trim()
      });
      loadStaff();
    } catch (err: any) {
      console.error('Failed to create staff/judge:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to generate account';
      alert(msg);
    }
  };

  const handleReset = async (userToReset: any) => {
    if (!confirm(`Are you sure you want to reset credentials for ${userToReset.name || userToReset.staff_id}? This will generate a new passkey.`)) return;
    try {
      const res = await axios.post(`/api/users/${userToReset.id}/reset`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProvisionResult({ 
        staff_id: res.data.staff_id, 
        tempPassword: res.data.tempPassword,
        name: userToReset.name 
      });
      setShowModal(true);
      loadStaff();
    } catch (err: any) {
      console.error('Failed to reset account:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to reset account';
      alert(msg);
    }
  };

  const handleDelete = async (userToDelete: any) => {
    if (!confirm(`Are you sure you want to delete ${role} "${userToDelete.name || userToDelete.staff_id}"? This action cannot be undone.`)) return;
    try {
      await axios.delete(`/api/users/${userToDelete.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      loadStaff();
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      const msg = err.response?.data?.error || err.message || `Failed to delete ${role}`;
      alert(msg);
    }
  };

  // Toggle passkey reveal
  const toggleRevealKey = (id: string) => {
    setRevealedKeys(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Direct Staff ID copy
  const copyDirectStaffId = (userId: string, idVal: string) => {
    if (!idVal) return;
    navigator.clipboard.writeText(idVal);
    setCopiedStaffId(userId);
    setTimeout(() => setCopiedStaffId(null), 2000);
  };

  // Direct passkey copy
  const copyDirectPasskey = (userId: string, keyVal: string) => {
    if (!keyVal) return;
    navigator.clipboard.writeText(keyVal);
    setCopiedKeyId(userId);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  // Format single staff credential message
  const copySingleStaffMessage = (userItem: any, tempPass?: string) => {
    const origin = getPublicOrigin();
    const roleTitle = role === 'admin' ? 'Admin' : 'Judge';
    const staffName = userItem.name ? userItem.name.trim() : (formData.name || `${roleTitle} Member`);
    const staffId = userItem.staff_id;
    const passkey = tempPass || userItem.temp_pass_key || (userItem.must_change_password ? '(Temporary passkey required)' : '(Active - Password Already Set)');

    const message = `${roleTitle}: ${staffName}\nPortal: ${origin}/admin/login\nStaff ID: ${staffId}\nTemporary Passkey: ${passkey}\n\nPlease log in using your Staff ID and passkey. You will be prompted to set your permanent password on first login.`;
    
    navigator.clipboard.writeText(message);
    setCopiedMsgId(userItem.id || 'modal');
    setTimeout(() => setCopiedMsgId(null), 2500);
  };

  // Format ALL staff members into a clean list
  const handleCopyAllStaff = () => {
    if (staff.length === 0) return;
    const origin = getPublicOrigin();
    const roleTitle = role === 'admin' ? 'Admin' : 'Judge';
    const header = `=== Hackathon ${roleTitle} Roster & Credentials ===\nPortal: ${origin}/admin/login\nTotal ${roleTitle}s: ${staff.length}\n`;
    
    const items = staff.map((s, idx) => {
      const passkeyDisplay = s.temp_pass_key ? `Passkey: ${s.temp_pass_key}` : (s.must_change_password ? 'Passkey: (Pending First Login)' : 'Passkey: (Password Configured)');
      const statusText = s.must_change_password ? 'Pending First Login' : 'Active (Password configured)';
      return `${idx + 1}. ${roleTitle}: ${s.name || 'Unnamed'}\n   Staff ID: ${s.staff_id}\n   ${passkeyDisplay}\n   Email: ${s.email || 'N/A'}\n   Designation: ${s.designation || '-'}\n   Status: ${statusText}\n   Login: ${origin}/admin/login`;
    }).join('\n\n');

    const footer = `\n==========================================\nLog in at ${origin}/admin/login with your Staff ID and passkey to set your permanent password.`;
    const fullMessage = `${header}\n${items}\n${footer}`;

    navigator.clipboard.writeText(fullMessage);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 3000);
  };

  const toggleEditMode = () => {
    if (isEditing) {
      setIsEditing(false);
      setDrafts({});
    } else {
      const newDrafts: Record<string, any> = {};
      staff.forEach(s => {
        newDrafts[s.id] = { name: s.name || '', email: s.email || '', designation: s.designation || '' };
      });
      setDrafts(newDrafts);
      setIsEditing(true);
    }
  };

  const saveEdits = async () => {
    setSaving(true);
    try {
      await Promise.all(
        Object.keys(drafts).map(id => 
          axios.put(`/api/users/${id}`, drafts[id], {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          })
        )
      );
      setIsEditing(false);
      loadStaff();
    } catch (err) {
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const updateDraft = (id: string, field: string, value: string) => {
    setDrafts(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const uniqueDesignations = Array.from(new Set(staff.map(s => s.designation).filter(Boolean)));
  const origin = getPublicOrigin();

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* Top Header Card */}
      <div className="bauhaus-card p-6 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-2 border-red-500 font-mono text-[10px] font-black uppercase tracking-wider mb-1">
              {role === 'admin' ? <ShieldCheck className="w-3.5 h-3.5 text-red-600" /> : <Gavel className="w-3.5 h-3.5 text-red-600" />}
              <span>Staff Delegation & Access</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
              Manage {role}s
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mt-0.5">
              Provision, reset, and distribute credentials for your hackathon {role}s.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Copy All Credentials Button */}
            {staff.length > 0 && !isEditing && (
              <button
                onClick={handleCopyAllStaff}
                className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-black text-xs uppercase tracking-wider border-2 border-black dark:border-zinc-600 flex items-center gap-1.5 transition shadow-sm"
                title={`Copy formatted list of all ${role} credentials to clipboard`}
              >
                {copiedAll ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-red-600" />}
                <span>{copiedAll ? `Copied All ${role}s!` : `Copy All ${role}s`}</span>
              </button>
            )}

            {isEditing ? (
              <>
                <button 
                  onClick={toggleEditMode}
                  className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-black text-xs uppercase tracking-wider border-2 border-black dark:border-zinc-600 flex items-center gap-1.5 transition"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                <button 
                  onClick={saveEdits}
                  disabled={saving}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider border-2 border-black flex items-center gap-1.5 shadow-[3px_3px_0px_rgba(0,0,0,1)] transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={toggleEditMode}
                  className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-black text-xs uppercase tracking-wider border-2 border-black dark:border-zinc-600 flex items-center gap-1.5 transition shadow-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Table</span>
                </button>
                <button 
                  onClick={() => { setProvisionResult(null); setFormData({ name: '', email: '', designation: '' }); setShowModal(true); }}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Provision New {role}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bauhaus-card bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="min-w-full divide-y-2 divide-black dark:divide-zinc-800">
            <thead className="bg-zinc-100 dark:bg-zinc-800">
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                  Staff ID
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                  Name & Email
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                  Designation / Role
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                  Temporary Passkey
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-zinc-500 font-bold uppercase text-xs">
                    Loading {role}s...
                  </td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-zinc-500 font-bold uppercase text-xs">
                    No {role} accounts provisioned yet.
                  </td>
                </tr>
              ) : (
                staff.map(userItem => (
                  <tr key={userItem.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                    
                    {/* Staff ID */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-black text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 border border-red-300 dark:border-red-800 rounded select-all">
                          {userItem.staff_id}
                        </span>
                        <button
                          onClick={() => copyDirectStaffId(userItem.id, userItem.staff_id)}
                          className="p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition"
                          title="Copy Staff ID"
                        >
                          {copiedStaffId === userItem.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    {/* Name & Email */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <div className="space-y-1.5">
                          <input 
                            type="text" 
                            placeholder="Name" 
                            className="block w-full px-2.5 py-1 text-xs border-2 border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 font-bold"
                            value={drafts[userItem.id]?.name ?? ''}
                            onChange={(e) => updateDraft(userItem.id, 'name', e.target.value)}
                          />
                          <input 
                            type="email" 
                            placeholder="Email" 
                            className="block w-full px-2.5 py-1 text-xs border-2 border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                            value={drafts[userItem.id]?.email ?? ''}
                            onChange={(e) => updateDraft(userItem.id, 'email', e.target.value)}
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm font-black uppercase text-zinc-900 dark:text-white">
                            {userItem.name || 'Unnamed'}
                          </div>
                          <div className="text-xs text-zinc-500 font-mono">
                            {userItem.email || 'N/A'}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Designation */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <input 
                          list="designations"
                          type="text" 
                          placeholder={role === 'admin' ? 'Role' : 'Designation'}
                          className="block w-full px-2.5 py-1 text-xs border-2 border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 font-bold"
                          value={drafts[userItem.id]?.designation ?? ''}
                          onChange={(e) => updateDraft(userItem.id, 'designation', e.target.value)}
                        />
                      ) : (
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 border border-zinc-300 dark:border-zinc-700 rounded">
                          {userItem.designation || (role === 'admin' ? 'Co-Admin' : 'Judge')}
                        </span>
                      )}
                    </td>

                    {/* Temporary Passkey Column */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {userItem.must_change_password ? (
                        userItem.temp_pass_key ? (
                          <div className="inline-flex items-center space-x-1.5 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded border border-zinc-300 dark:border-zinc-700">
                            <span className="font-mono font-bold text-xs text-red-600 dark:text-red-400 select-all">
                              {revealedKeys[userItem.id] ? userItem.temp_pass_key : '••••••••••••'}
                            </span>
                            <button
                              onClick={() => toggleRevealKey(userItem.id)}
                              className="p-0.5 text-zinc-400 hover:text-black dark:hover:text-white transition"
                              title={revealedKeys[userItem.id] ? 'Hide passkey' : 'Reveal passkey'}
                            >
                              {revealedKeys[userItem.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => copyDirectPasskey(userItem.id, userItem.temp_pass_key)}
                              className="p-0.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition"
                              title="Copy passkey to clipboard"
                            >
                              {copiedKeyId === userItem.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleReset(userItem)}
                            className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                            title="Passkey not recorded in memory. Click to reset."
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Reset to view key</span>
                          </button>
                        )
                      ) : (
                        <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 italic">
                          Password Set by User
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {userItem.must_change_password ? (
                        <span className="px-2.5 py-0.5 inline-flex text-[10px] font-black uppercase tracking-wider rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                          Pending First Login
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 inline-flex text-[10px] font-black uppercase tracking-wider rounded bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                          Active (Password Set)
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 whitespace-nowrap text-right text-xs font-bold">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => copySingleStaffMessage(userItem)}
                          className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white border border-black dark:border-zinc-600 rounded text-[11px] font-bold flex items-center gap-1 transition shadow-sm"
                          title="Copy full invite message"
                        >
                          {copiedMsgId === userItem.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-red-600" />}
                          <span>{copiedMsgId === userItem.id ? 'Copied' : 'Invite'}</span>
                        </button>
                        <button 
                          onClick={() => handleReset(userItem)}
                          disabled={isEditing}
                          className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded text-[11px] font-bold flex items-center gap-1 transition disabled:opacity-30"
                          title="Generate new temporary passkey"
                        >
                          <RefreshCw className="w-3 h-3 text-amber-600" />
                          <span>Reset</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(userItem)}
                          disabled={isEditing}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-600 hover:text-white dark:bg-red-950/60 dark:hover:bg-red-600 text-red-600 dark:text-red-300 border border-red-300 dark:border-red-800 rounded text-[11px] font-bold flex items-center gap-1 transition disabled:opacity-30"
                          title={`Delete this ${role}`}
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <datalist id="designations">
        {uniqueDesignations.map((d, i) => (
          <option key={i} value={String(d)}>
            {String(d)}
          </option>
        ))}
      </datalist>

      {/* Provision / Reset Credentials Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="max-w-md w-full bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[10px_10px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_rgba(255,255,255,0.2)] p-6 md:p-8 space-y-6">
            
            <div className="flex items-center justify-between border-b-2 border-zinc-200 dark:border-zinc-800 pb-3">
              <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-red-600" />
                <span>{provisionResult ? `${role} Credentials Generated` : `Provision New ${role}`}</span>
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 text-zinc-500 hover:text-black dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {!provisionResult ? (
              <form onSubmit={handleProvision} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    Full Name
                  </label>
                  <input 
                    type="text" 
                    className="w-full px-3.5 py-2 text-sm border-2 border-black dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-medium focus:outline-none focus:border-red-600" 
                    placeholder="e.g. Indresh Suresh"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    Email Address (Optional)
                  </label>
                  <input 
                    type="email" 
                    className="w-full px-3.5 py-2 text-sm border-2 border-black dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-medium focus:outline-none focus:border-red-600" 
                    placeholder="e.g. judge@university.edu"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    {role === 'admin' ? 'Role / Title' : 'Designation'}
                  </label>
                  <input 
                    list="designations"
                    type="text" 
                    className="w-full px-3.5 py-2 text-sm border-2 border-black dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-medium focus:outline-none focus:border-red-600" 
                    placeholder={role === 'admin' ? 'e.g. Co-Organizer' : 'e.g. Senior Tech Judge'}
                    value={formData.designation}
                    onChange={e => setFormData({...formData, designation: e.target.value})}
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)} 
                    className="flex-1 py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-black text-xs uppercase tracking-wider border-2 border-black dark:border-zinc-600 transition"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] transition"
                  >
                    Generate ID & Key
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                
                {/* Individual Field Copy Cards */}
                <div className="space-y-2.5">
                  
                  {/* Staff ID Row */}
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/90 border-2 border-black dark:border-zinc-700 rounded flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Staff ID
                      </div>
                      <div className="font-mono font-black text-base text-red-600 dark:text-red-400 truncate select-all">
                        {provisionResult.staff_id}
                      </div>
                    </div>
                    <button
                      onClick={() => copyDirectStaffId('modal-staff-id', provisionResult.staff_id)}
                      className="px-3 py-1.5 bg-white dark:bg-zinc-900 border-2 border-black dark:border-zinc-600 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition shrink-0"
                      title="Copy Staff ID directly"
                    >
                      {copiedStaffId === 'modal-staff-id' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-red-600" />}
                      <span>{copiedStaffId === 'modal-staff-id' ? 'Copied' : 'Copy ID'}</span>
                    </button>
                  </div>

                  {/* Temporary Passkey Row */}
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/90 border-2 border-black dark:border-zinc-700 rounded flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Temporary Passkey
                      </div>
                      <div className="font-mono font-black text-base text-red-600 dark:text-red-400 truncate select-all">
                        {provisionResult.tempPassword}
                      </div>
                    </div>
                    <button
                      onClick={() => copyDirectPasskey('modal-passkey', provisionResult.tempPassword)}
                      className="px-3 py-1.5 bg-white dark:bg-zinc-900 border-2 border-black dark:border-zinc-600 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition shrink-0"
                      title="Copy Passkey directly"
                    >
                      {copiedKeyId === 'modal-passkey' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-red-600" />}
                      <span>{copiedKeyId === 'modal-passkey' ? 'Copied' : 'Copy Key'}</span>
                    </button>
                  </div>

                </div>

                {/* Formatted Message Preview */}
                <div className="p-3 bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded">
                  <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">
                    Portal Login URL
                  </div>
                  <div className="font-mono text-xs text-zinc-700 dark:text-zinc-300 truncate">
                    {origin}/admin/login
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => copySingleStaffMessage({ staff_id: provisionResult.staff_id, name: provisionResult.name || formData.name }, provisionResult.tempPassword)}
                    className="flex-1 py-2.5 px-4 bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-black text-xs uppercase tracking-wider border-2 border-black flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    {copiedMsgId === 'modal' ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                    <span>{copiedMsgId === 'modal' ? 'Copied Full Message!' : 'Copy Full Invite'}</span>
                  </button>

                  <button 
                    onClick={() => setShowModal(false)} 
                    className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] transition text-center"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
