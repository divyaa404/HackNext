import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Award, 
  Sparkles, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Download, 
  Eye, 
  Layers, 
  ExternalLink
} from 'lucide-react';
import { UIModal } from '../../components/UIModal';

export const ManageCertificates = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [status, setStatus] = useState<any>({ has_generated: false, count: 0, show_certificates: false });
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [previewCert, setPreviewCert] = useState<any>(null);
  const [newTemplateModal, setNewTemplateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ type: 'CUSTOM', title: 'Special Recognition Award', template_image_url: '' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type }), 3500);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadEventCertificates(selectedEventId);
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

  const loadEventCertificates = async (eventId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [tmplRes, certsRes, statRes] = await Promise.all([
        axios.get(`/api/certificates/event/${eventId}/templates`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`/api/certificates/event/${eventId}/list`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`/api/certificates/event/${eventId}/status`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setTemplates(tmplRes.data || []);
      setCertificates(certsRes.data || []);
      setStatus(statRes.data || { has_generated: false, count: 0, show_certificates: false });
    } catch (err) {
      console.error('Failed to load certificate data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAll = async () => {
    if (!selectedEventId) return;
    setIsGenerating(true);
    try {
      const res = await axios.post(`/api/certificates/event/${selectedEventId}/generate`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      showToast(res.data.message || 'Certificates generated successfully!', 'success');
      await loadEventCertificates(selectedEventId);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to generate certificates', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleShowToParticipants = async () => {
    if (!selectedEventId) return;
    if (status.count === 0) {
      showToast('Cannot enable certificate visibility until certificates are generated!', 'error');
      return;
    }

    try {
      const updatedVal = !status.show_certificates;
      await axios.patch(`/api/organizer/events/${selectedEventId}`, {
        show_certificates: updatedVal
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStatus((prev: any) => ({ ...prev, show_certificates: updatedVal }));
      showToast(`Certificates are now ${updatedVal ? 'VISIBLE' : 'HIDDEN'} for participants.`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update toggle', 'error');
    }
  };

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`/api/certificates/event/${selectedEventId}/templates`, newTemplate, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNewTemplateModal(false);
      showToast('New template category added!', 'success');
      loadEventCertificates(selectedEventId);
    } catch (err) {
      showToast('Failed to add template category', 'error');
    }
  };

  const handleDeleteTemplate = async (tmplId: string) => {
    try {
      await axios.delete(`/api/certificates/templates/${tmplId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      showToast('Template category removed', 'success');
      loadEventCertificates(selectedEventId);
    } catch (err) {
      showToast('Failed to delete template', 'error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg font-bold text-white transition-opacity ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      {/* Header Banner */}
      <div className="bauhaus-card p-6 md:p-8 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_rgba(255,255,255,0.2)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border-2 border-amber-500 font-mono text-xs font-black uppercase tracking-wider">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>Certificate Generation Engine</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
              Certificate Studio
            </h1>
            <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 font-medium max-w-2xl leading-relaxed">
              Generate, store, and manage tamper-proof certificates locally with automated winner ranking selection (1st, 2nd, 3rd, and participation) and cryptographic public verification.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleGenerateAll}
              disabled={isGenerating || !selectedEventId}
              className="px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating Locally...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate All Certificates</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Event Selection & Visibility Control Bar */}
      <div className="bauhaus-card p-6 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Event Select Dropdown */}
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

          {/* Participant Access Toggle Switch */}
          <div className="flex items-center justify-between sm:justify-start gap-4 p-4 border-2 border-black dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
            <div>
              <span className="block text-xs font-black uppercase text-zinc-900 dark:text-white">
                Show to Participants
              </span>
              <span className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                {status.has_generated 
                  ? (status.show_certificates ? 'Participants can download their certificates' : 'Certificates are hidden from participants')
                  : 'Requires generating certificates first'}
              </span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={status.show_certificates}
              onClick={handleToggleShowToParticipants}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-black dark:border-white p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                status.show_certificates ? 'bg-red-600' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white border border-black shadow-sm transition duration-200 ease-in-out ${
                  status.show_certificates ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

        </div>
      </div>

      {/* Template Categories (Winner 1, Winner 2, Winner 3, Participant, Custom) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-red-600" />
            <span>Award Categories &amp; Template Sets</span>
          </h2>
          <button
            onClick={() => setNewTemplateModal(true)}
            className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-black text-xs uppercase tracking-wider border-2 border-black dark:border-zinc-600 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Template</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {templates.map((tmpl) => {
            const isWinner1 = tmpl.type === 'WINNER_1';
            const isWinner2 = tmpl.type === 'WINNER_2';
            const isWinner3 = tmpl.type === 'WINNER_3';
            const isParticipant = tmpl.type === 'PARTICIPANT';

            const badgeColor = isWinner1 ? 'bg-amber-400 text-black' : isWinner2 ? 'bg-slate-300 text-black' : isWinner3 ? 'bg-amber-600 text-white' : isParticipant ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white';

            return (
              <div
                key={tmpl.id}
                className="bauhaus-card p-5 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] flex flex-col justify-between space-y-4 hover:-translate-y-1 transition-transform"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-black ${badgeColor}`}>
                      {tmpl.type.replace('_', ' ')}
                    </span>
                    {!isWinner1 && !isWinner2 && !isWinner3 && !isParticipant && (
                      <button
                        onClick={() => handleDeleteTemplate(tmpl.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Delete template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <h3 className="text-base font-black uppercase tracking-tight text-zinc-900 dark:text-white">
                    {tmpl.title}
                  </h3>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    {isWinner1 && 'Automatically awarded to team securing Rank 1 on leaderboard.'}
                    {isWinner2 && 'Automatically awarded to team securing Rank 2 on leaderboard.'}
                    {isWinner3 && 'Automatically awarded to team securing Rank 3 on leaderboard.'}
                    {isParticipant && 'Awarded to all registered and submitted team members.'}
                    {!isWinner1 && !isWinner2 && !isWinner3 && !isParticipant && 'Custom category issued to selected teams.'}
                  </p>
                </div>

                <div className="pt-2 border-t-2 border-zinc-200 dark:border-zinc-800 text-[11px] font-bold text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
                  <span>Layout Engine</span>
                  <span className="font-mono text-red-600 font-black">SVG Vector (1200x800)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Generated Certificates Roster */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
              Generated Event Certificates ({certificates.length})
            </h2>
            {status.has_generated && (
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider rounded border border-emerald-400">
                Ready on Disk
              </span>
            )}
          </div>
          <button
            onClick={() => loadEventCertificates(selectedEventId)}
            disabled={loading}
            className="p-2 border-2 border-black dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 transition rounded"
            title="Refresh Roster"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="bauhaus-card bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-800/80 border-b-4 border-black dark:border-zinc-700">
                  <th className="px-4 py-3.5 text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Recipient</th>
                  <th className="px-4 py-3.5 text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Team</th>
                  <th className="px-4 py-3.5 text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Category</th>
                  <th className="px-4 py-3.5 text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Certificate ID</th>
                  <th className="px-4 py-3.5 text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Issue Date</th>
                  <th className="px-4 py-3.5 text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-zinc-200 dark:divide-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                      <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <span>Loading certificate records...</span>
                    </td>
                  </tr>
                ) : certificates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                      <Award className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
                      <p className="font-bold text-sm">No certificates generated yet for this event.</p>
                      <p className="text-xs text-zinc-400 mt-1">Click "Generate All Certificates" to compute ranking and issue certificates.</p>
                    </td>
                  </tr>
                ) : (
                  certificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                      <td className="px-4 py-3 text-sm font-bold text-zinc-900 dark:text-white">
                        <div>{cert.recipient_name}</div>
                        <div className="text-xs text-zinc-500 font-normal">{cert.user?.email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {cert.team_name || 'Individual'}
                      </td>
                      <td className="px-4 py-3 text-xs font-black">
                        <span className={`px-2 py-0.5 rounded uppercase tracking-wider ${
                          cert.type.includes('WINNER') ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200'
                        }`}>
                          {cert.title}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono font-bold text-red-600">
                        {cert.certificate_no}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-zinc-500">
                        {new Date(cert.issue_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-right space-x-2">
                        <button
                          onClick={() => setPreviewCert(cert)}
                          className="px-2.5 py-1 text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded border border-zinc-300 dark:border-zinc-600 inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>
                        {cert.file_url && (
                          <a
                            href={cert.file_url}
                            download={`Certificate_${cert.certificate_no}.svg`}
                            className="px-2.5 py-1 text-xs font-bold bg-black dark:bg-white text-white dark:text-black rounded border border-black inline-flex items-center gap-1 hover:bg-zinc-800"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </a>
                        )}
                        <a
                          href={`/verify/certificate/${cert.certificate_no}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 text-xs font-bold text-red-600 hover:underline inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Verify</span>
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewCert && (
        <UIModal
          isOpen={!!previewCert}
          onClose={() => setPreviewCert(null)}
          title={`Certificate: ${previewCert.recipient_name} (${previewCert.certificate_no})`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-4">
            <div className="border-4 border-black dark:border-white rounded-lg overflow-hidden bg-white shadow-lg">
              {previewCert.file_url ? (
                <img src={previewCert.file_url} alt="Certificate" className="w-full h-auto object-contain" />
              ) : (
                <div className="p-12 text-center text-zinc-500 font-bold">No visual preview file available</div>
              )}
            </div>
            <div className="flex justify-between items-center pt-2">
              <div className="text-xs font-mono text-zinc-500">
                Signature: {previewCert.signature_hash?.substring(0, 32)}...
              </div>
              <div className="flex gap-2">
                {previewCert.file_url && (
                  <a
                    href={previewCert.file_url}
                    download={`Certificate_${previewCert.certificate_no}.svg`}
                    className="px-4 py-2 bg-red-600 text-white font-black text-xs uppercase tracking-wider rounded flex items-center gap-1.5 shadow"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download SVG</span>
                  </a>
                )}
                <button
                  onClick={() => setPreviewCert(null)}
                  className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-black text-xs uppercase tracking-wider rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </UIModal>
      )}

      {/* Add Custom Template Modal */}
      {newTemplateModal && (
        <UIModal
          isOpen={newTemplateModal}
          onClose={() => setNewTemplateModal(false)}
          title="Add Custom Award Template"
        >
          <form onSubmit={handleAddTemplate} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                Award Category Title
              </label>
              <input
                type="text"
                value={newTemplate.title}
                onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                placeholder="e.g. Best UI/UX Design Award"
                className="w-full p-2.5 border-2 border-black dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 font-bold text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                Category Code Type
              </label>
              <input
                type="text"
                value={newTemplate.type}
                onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                placeholder="e.g. BEST_UI_UX"
                className="w-full p-2.5 border-2 border-black dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 font-mono font-bold text-sm"
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setNewTemplateModal(false)}
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 font-bold text-xs uppercase tracking-wider rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded shadow"
              >
                Save Category
              </button>
            </div>
          </form>
        </UIModal>
      )}

    </div>
  );
};
