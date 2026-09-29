import React, { useState, useEffect, useRef } from 'react';
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
  ExternalLink,
  Sliders,
  Upload,
  Move,
  Type,
  Palette
} from 'lucide-react';
import { UIModal } from '../../components/UIModal';

interface CertificateTemplate {
  id: string;
  event_id: string;
  type: string;
  title: string;
  template_image_url?: string;
  config: {
    name_x?: number;
    name_y?: number;
    name_font_size?: number;
    name_color?: string;
    font_family?: string;
    text_align?: string;
    primary_color?: string;
    badge_title?: string;
    subtitle?: string;
    [key: string]: any;
  };
}

export const ManageCertificates = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [status, setStatus] = useState<any>({ has_generated: false, count: 0, show_certificates: false });
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [previewCert, setPreviewCert] = useState<any>(null);

  // Template Customizer State
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null);
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Add Template Modal State
  const [newTemplateModal, setNewTemplateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ type: 'CUSTOM', title: 'Special Recognition Award', template_image_url: '' });

  const canvasRef = useRef<SVGSVGElement | null>(null);

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
      showToast(`Certificates are now ${updatedVal ? 'VISIBLE' : 'HIDDEN'} on main page & participant portal.`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update toggle', 'error');
    }
  };

  const normalizeAnchor = (align?: string): 'start' | 'middle' | 'end' => {
    if (!align) return 'middle';
    const a = String(align).toLowerCase().trim();
    if (a === 'start' || a === 'left') return 'start';
    if (a === 'end' || a === 'right') return 'end';
    return 'middle';
  };

  const handleOpenCustomizer = (tmpl: CertificateTemplate) => {
    // Clone template object and ensure config defaults exist
    const cloned = JSON.parse(JSON.stringify(tmpl));
    if (!cloned.config) cloned.config = {};
    cloned.config.name_x = Number(cloned.config.name_x ?? 600);
    cloned.config.name_y = Number(cloned.config.name_y ?? 325);
    cloned.config.name_font_size = Number(cloned.config.name_font_size ?? 46);
    cloned.config.name_color = cloned.config.name_color || '#dc2626';
    cloned.config.font_family = cloned.config.font_family || 'Inter';
    cloned.config.text_align = normalizeAnchor(cloned.config.text_align);
    cloned.config.primary_color = cloned.config.primary_color || (
      cloned.type === 'WINNER_1' ? '#eab308' : cloned.type === 'WINNER_2' ? '#94a3b8' : cloned.type === 'WINNER_3' ? '#d97706' : '#dc2626'
    );
    cloned.config.badge_title = cloned.config.badge_title || (
      cloned.type === 'WINNER_1' ? '1ST PLACE WINNER' : cloned.type === 'WINNER_2' ? '2ND PLACE WINNER' : cloned.type === 'WINNER_3' ? '3RD PLACE WINNER' : 'OFFICIAL PARTICIPATION'
    );
    cloned.config.subtitle = cloned.config.subtitle || (
      cloned.type.includes('WINNER') ? `For securing ${cloned.title.toUpperCase()} at` : 'For outstanding active participation and project development in'
    );
    setEditingTemplate(cloned);
  };

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!editingTemplate || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = 1200 / rect.width;
    const scaleY = 800 / rect.height;
    const clickX = Math.round((e.clientX - rect.left) * scaleX);
    const clickY = Math.round((e.clientY - rect.top) * scaleY);

    setEditingTemplate({
      ...editingTemplate,
      config: {
        ...editingTemplate.config,
        name_x: Math.max(50, Math.min(1150, clickX)),
        name_y: Math.max(50, Math.min(750, clickY))
      }
    });
  };

  const handleUploadBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingTemplate) return;

    setIsUploadingBg(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await axios.post('/api/organizer/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setEditingTemplate({
        ...editingTemplate,
        template_image_url: res.data.url
      });
      showToast('Template background uploaded successfully!', 'success');
    } catch (err) {
      showToast('Failed to upload template image', 'error');
    } finally {
      setIsUploadingBg(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate || !selectedEventId) return;
    setIsSavingTemplate(true);
    try {
      await axios.post(`/api/certificates/event/${selectedEventId}/templates`, editingTemplate, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      showToast('Template design & coordinates saved!', 'success');
      setEditingTemplate(null);
      loadEventCertificates(selectedEventId);
    } catch (err) {
      showToast('Failed to save template', 'error');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const [previewTemplate, setPreviewTemplate] = useState<CertificateTemplate | null>(null);

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;

    const formattedType = newTemplate.type.trim().toUpperCase().replace(/\s+/g, '_') || 'CUSTOM_AWARD';
    const payload = {
      type: formattedType,
      title: newTemplate.title.trim() || 'Special Recognition Award',
      template_image_url: newTemplate.template_image_url || '/assets/certificate-default.png',
      config: {
        name_x: 600,
        name_y: 325,
        name_font_size: 46,
        name_color: '#dc2626',
        font_family: 'Inter',
        text_align: 'middle',
        primary_color: '#dc2626',
        badge_title: newTemplate.title.toUpperCase(),
        subtitle: 'For outstanding innovation and excellence in'
      }
    };

    try {
      const res = await axios.post(`/api/certificates/event/${selectedEventId}/templates`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNewTemplateModal(false);
      setNewTemplate({ type: 'CUSTOM', title: 'Special Recognition Award', template_image_url: '' });
      showToast('New template added! Opening customizer...', 'success');
      await loadEventCertificates(selectedEventId);
      if (res.data) {
        handleOpenCustomizer(res.data);
      }
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

  const currentEvent = events.find(e => e.id === selectedEventId);

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
              <span>Certificate Studio &amp; Customizer</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
              Certificate Studio
            </h1>
            <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 font-medium max-w-2xl leading-relaxed">
              Upload custom award templates, adjust recipient name coordinates (X, Y, font, color) on a live canvas, batch generate certificates locally, and safely toggle public participant visibility.
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
                Show to Participants &amp; Main Page
              </span>
              <span className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                {status.has_generated 
                  ? (status.show_certificates ? 'Certificates are VISIBLE on main page' : 'Certificates are HIDDEN until toggled ON')
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

      {/* Template Categories & Customizer Sets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-red-600" />
            <span>Award Categories &amp; Template Studio</span>
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
                    {!isWinner1 && !isWinner2 && !isWinner3 && !isParticipant && 'Custom award category issued to selected teams.'}
                  </p>

                  <div className="pt-2 text-[11px] font-mono text-zinc-500 space-y-1">
                    <div>Coord: X: {tmpl.config?.name_x ?? 600}, Y: {tmpl.config?.name_y ?? 325}</div>
                    <div>Font: {tmpl.config?.name_font_size ?? 46}px ({tmpl.config?.font_family || 'Inter'})</div>
                  </div>
                </div>

                <div className="pt-3 border-t-2 border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                  <button
                    onClick={() => setPreviewTemplate(tmpl)}
                    className="flex-1 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs uppercase tracking-wider rounded border border-zinc-300 dark:border-zinc-700 flex items-center justify-center gap-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>
                  <button
                    onClick={() => handleOpenCustomizer(tmpl)}
                    className="flex-1 py-2 bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-wider rounded flex items-center justify-center gap-1 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Customize</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Generated Certificates Roster Table */}
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
                      <p className="text-xs text-zinc-400 mt-1">Click "Generate All Certificates" to compute ranking and issue certificates locally.</p>
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

      {/* Interactive Certificate Customizer Modal (Old Project Certify Idea) */}
      {editingTemplate && (
        <UIModal
          isOpen={!!editingTemplate}
          onClose={() => setEditingTemplate(null)}
          title={`Customize Template: ${editingTemplate.title} (${editingTemplate.type})`}
          maxWidth="max-w-6xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Live Visual Preview Canvas */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-600 dark:text-zinc-400">
                <span className="flex items-center gap-1">
                  <Move className="w-3.5 h-3.5 text-red-600" />
                  <span>Click anywhere on canvas to set Name coordinates</span>
                </span>
                <span className="font-mono text-red-600 font-black">
                  X: {editingTemplate.config?.name_x}, Y: {editingTemplate.config?.name_y}
                </span>
              </div>

              <div className="relative border-4 border-black dark:border-white rounded-lg overflow-hidden bg-white shadow-md select-none cursor-crosshair">
                <svg
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  viewBox="0 0 1200 800"
                  className="w-full h-auto block"
                  style={{ fontFamily: editingTemplate.config?.font_family || 'Inter' }}
                >
                  {/* Template Background Image or Default Frame */}
                  {editingTemplate.template_image_url && !editingTemplate.template_image_url.includes('certificate-default.png') ? (
                    <image href={editingTemplate.template_image_url} x="0" y="0" width="1200" height="800" preserveAspectRatio="none" />
                  ) : (
                    <>
                      <rect x="20" y="20" width="1160" height="760" fill="#ffffff" stroke="#18181b" strokeWidth="8"/>
                      <rect x="35" y="35" width="1130" height="730" fill="#fafafa" stroke={editingTemplate.config?.primary_color || '#dc2626'} strokeWidth="4"/>
                      <rect x="45" y="45" width="1110" height="710" fill="#ffffff" stroke="#e4e4e7" strokeWidth="2"/>
                      
                      {/* Geometric Accents */}
                      <polygon points="20,20 100,20 20,100" fill={editingTemplate.config?.primary_color || '#dc2626'} />
                      <polygon points="1180,20 1100,20 1180,100" fill={editingTemplate.config?.primary_color || '#dc2626'} />
                      <polygon points="20,780 100,780 20,700" fill="#18181b" />
                      <polygon points="1180,780 1100,780 1180,700" fill="#18181b" />

                      {/* Header Badge */}
                      <g transform="translate(600, 110)">
                        <rect x="-180" y="-20" width="360" height="40" fill={editingTemplate.config?.primary_color || '#dc2626'} stroke="#18181b" strokeWidth="3" rx="4"/>
                        <text x="0" y="7" textAnchor="middle" fontSize="16" fontWeight="900" fill="#ffffff" letterSpacing="3">
                          {editingTemplate.config?.badge_title || editingTemplate.title.toUpperCase()}
                        </text>
                      </g>

                      <text x="600" y="190" textAnchor="middle" fontSize="40" fontWeight="900" fill="#18181b" letterSpacing="4">HACKNEXT CERTIFICATE</text>
                      <text x="600" y="225" textAnchor="middle" fontSize="16" fontWeight="700" fill="#71717a" letterSpacing="2">THIS CERTIFICATE IS PROUDLY PRESENTED TO</text>
                      <line x1="350" y1="245" x2="850" y2="245" stroke="#e4e4e7" strokeWidth="2"/>

                      {/* Static Subtitle / Event info */}
                      <text x="600" y="410" textAnchor="middle" fontSize="20" fontWeight="600" fill="#3f3f46">
                        {editingTemplate.config?.subtitle || 'For outstanding active participation at'}
                      </text>
                      <text x="600" y="455" textAnchor="middle" fontSize="32" fontWeight="900" fill="#18181b">
                        {currentEvent?.name || 'HackNext Hackathon 2026'}
                      </text>

                      {/* Footer signatures */}
                      <g transform="translate(240, 640)">
                        <line x1="-100" y1="0" x2="100" y2="0" stroke="#18181b" strokeWidth="2"/>
                        <text x="0" y="-15" textAnchor="middle" fontSize="16" fontWeight="900" fill="#18181b">DATE ISSUED</text>
                      </g>
                      <g transform="translate(600, 640)">
                        <circle cx="0" cy="0" r="45" fill="#fafafa" stroke={editingTemplate.config?.primary_color || '#dc2626'} strokeWidth="4"/>
                        <text x="0" y="6" textAnchor="middle" fontSize="13" fontWeight="900" fill={editingTemplate.config?.primary_color || '#dc2626'}>★ ★ ★</text>
                      </g>
                      <g transform="translate(960, 640)">
                        <line x1="-100" y1="0" x2="100" y2="0" stroke="#18181b" strokeWidth="2"/>
                        <text x="0" y="-15" textAnchor="middle" fontSize="16" fontWeight="900" fill="#18181b">ORGANIZER</text>
                      </g>
                    </>
                  )}

                  {/* Alignment Crosshairs Guide */}
                  <line
                    x1="0"
                    y1={editingTemplate.config?.name_y ?? 325}
                    x2="1200"
                    y2={editingTemplate.config?.name_y ?? 325}
                    stroke="#dc2626"
                    strokeDasharray="4 4"
                    strokeWidth="1.5"
                    opacity="0.4"
                  />
                  <line
                    x1={editingTemplate.config?.name_x ?? 600}
                    y1="0"
                    x2={editingTemplate.config?.name_x ?? 600}
                    y2="800"
                    stroke="#dc2626"
                    strokeDasharray="4 4"
                    strokeWidth="1.5"
                    opacity="0.4"
                  />

                  {/* Recipient Name Preview Overlay */}
                  <text
                    x={editingTemplate.config?.name_x ?? 600}
                    y={editingTemplate.config?.name_y ?? 325}
                    textAnchor={normalizeAnchor(editingTemplate.config?.text_align)}
                    fontSize={editingTemplate.config?.name_font_size ?? 46}
                    fontWeight="900"
                    fill={editingTemplate.config?.name_color || '#dc2626'}
                  >
                    Alex Mercer (Sample Recipient)
                  </text>
                </svg>
              </div>

              {/* Quick Alignment Presets */}
              <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg border-2 border-black dark:border-zinc-700 flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase text-zinc-700 dark:text-zinc-300 mr-1">Presets:</span>
                <button
                  type="button"
                  onClick={() => setEditingTemplate({
                    ...editingTemplate,
                    config: { ...editingTemplate.config, name_x: 600, name_y: 325, text_align: 'middle' }
                  })}
                  className="px-2.5 py-1 text-xs font-bold bg-white dark:bg-zinc-900 border border-black dark:border-zinc-600 rounded hover:bg-zinc-200"
                >
                  Center (600, 325)
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTemplate({
                    ...editingTemplate,
                    config: { ...editingTemplate.config, name_x: 600, name_y: 250, text_align: 'middle' }
                  })}
                  className="px-2.5 py-1 text-xs font-bold bg-white dark:bg-zinc-900 border border-black dark:border-zinc-600 rounded hover:bg-zinc-200"
                >
                  Top Center (600, 250)
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTemplate({
                    ...editingTemplate,
                    config: { ...editingTemplate.config, name_x: 600, name_y: 420, text_align: 'middle' }
                  })}
                  className="px-2.5 py-1 text-xs font-bold bg-white dark:bg-zinc-900 border border-black dark:border-zinc-600 rounded hover:bg-zinc-200"
                >
                  Lower (600, 420)
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTemplate({
                    ...editingTemplate,
                    config: { ...editingTemplate.config, name_x: 250, name_y: 325, text_align: 'start' }
                  })}
                  className="px-2.5 py-1 text-xs font-bold bg-white dark:bg-zinc-900 border border-black dark:border-zinc-600 rounded hover:bg-zinc-200"
                >
                  Left Align (250)
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTemplate({
                    ...editingTemplate,
                    config: { ...editingTemplate.config, name_x: 950, name_y: 325, text_align: 'end' }
                  })}
                  className="px-2.5 py-1 text-xs font-bold bg-white dark:bg-zinc-900 border border-black dark:border-zinc-600 rounded hover:bg-zinc-200"
                >
                  Right Align (950)
                </button>
              </div>
            </div>

            {/* Right: Controls & Adjustments */}
            <div className="lg:col-span-5 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              
              {/* Template Background Image Upload */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/80 rounded-lg border-2 border-black dark:border-zinc-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" /> Background Template
                  </span>
                  {editingTemplate.template_image_url && (
                    <button
                      type="button"
                      onClick={() => setEditingTemplate({ ...editingTemplate, template_image_url: '' })}
                      className="text-[10px] text-red-600 font-bold hover:underline"
                    >
                      Reset to Default
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={handleUploadBg}
                  className="w-full text-xs font-bold file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-2 file:border-black file:text-xs file:font-black file:uppercase file:bg-zinc-200 dark:file:bg-zinc-700 file:text-zinc-900 dark:file:text-white hover:file:bg-zinc-300"
                />
                {isUploadingBg && <div className="text-xs font-bold text-zinc-500 animate-pulse">Uploading template background...</div>}
              </div>

              {/* Coordinates Sliders */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/80 rounded-lg border-2 border-black dark:border-zinc-700 space-y-4">
                <div className="flex items-center justify-between border-b pb-2 border-zinc-200 dark:border-zinc-700">
                  <span className="text-xs font-black uppercase text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <Move className="w-3.5 h-3.5 text-red-600" /> Name Position (X, Y)
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingTemplate({
                        ...editingTemplate,
                        config: { ...editingTemplate.config, name_x: 600 }
                      })}
                      className="px-2 py-0.5 text-[10px] font-black uppercase bg-zinc-200 dark:bg-zinc-700 rounded border border-zinc-400"
                    >
                      Center X
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTemplate({
                        ...editingTemplate,
                        config: { ...editingTemplate.config, name_y: 350 }
                      })}
                      className="px-2 py-0.5 text-[10px] font-black uppercase bg-zinc-200 dark:bg-zinc-700 rounded border border-zinc-400"
                    >
                      Center Y
                    </button>
                  </div>
                </div>

                {/* X Coordinate */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>X Coordinate (Horizontal)</span>
                    <input
                      type="number"
                      value={editingTemplate.config?.name_x ?? 600}
                      onChange={(e) => setEditingTemplate({
                        ...editingTemplate,
                        config: { ...editingTemplate.config, name_x: parseInt(e.target.value) || 0 }
                      })}
                      className="w-16 px-1 py-0.5 text-right font-mono border rounded bg-white dark:bg-zinc-900 text-xs font-bold"
                    />
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="1150"
                    value={editingTemplate.config?.name_x ?? 600}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      config: { ...editingTemplate.config, name_x: parseInt(e.target.value) }
                    })}
                    className="w-full accent-red-600"
                  />
                </div>

                {/* Y Coordinate */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Y Coordinate (Vertical)</span>
                    <input
                      type="number"
                      value={editingTemplate.config?.name_y ?? 325}
                      onChange={(e) => setEditingTemplate({
                        ...editingTemplate,
                        config: { ...editingTemplate.config, name_y: parseInt(e.target.value) || 0 }
                      })}
                      className="w-16 px-1 py-0.5 text-right font-mono border rounded bg-white dark:bg-zinc-900 text-xs font-bold"
                    />
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="750"
                    value={editingTemplate.config?.name_y ?? 325}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      config: { ...editingTemplate.config, name_y: parseInt(e.target.value) }
                    })}
                    className="w-full accent-red-600"
                  />
                </div>
              </div>

              {/* Typography & Color */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/80 rounded-lg border-2 border-black dark:border-zinc-700 space-y-4">
                <span className="block text-xs font-black uppercase text-zinc-900 dark:text-white border-b pb-2 border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-red-600" /> Typography &amp; Color
                </span>

                {/* Font Size */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Font Size ({editingTemplate.config?.name_font_size ?? 46}px)</span>
                    <input
                      type="number"
                      value={editingTemplate.config?.name_font_size ?? 46}
                      onChange={(e) => setEditingTemplate({
                        ...editingTemplate,
                        config: { ...editingTemplate.config, name_font_size: parseInt(e.target.value) || 20 }
                      })}
                      className="w-16 px-1 py-0.5 text-right font-mono border rounded bg-white dark:bg-zinc-900 text-xs font-bold"
                    />
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="96"
                    value={editingTemplate.config?.name_font_size ?? 46}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      config: { ...editingTemplate.config, name_font_size: parseInt(e.target.value) }
                    })}
                    className="w-full accent-red-600"
                  />
                </div>

                {/* Font Family & Alignment */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">Font Family</label>
                    <select
                      value={editingTemplate.config?.font_family || 'Inter'}
                      onChange={(e) => setEditingTemplate({
                        ...editingTemplate,
                        config: { ...editingTemplate.config, font_family: e.target.value }
                      })}
                      className="w-full p-2 border rounded bg-white dark:bg-zinc-900 font-bold text-xs"
                    >
                      <option value="Inter">Inter (Sans)</option>
                      <option value="Montserrat">Montserrat</option>
                      <option value="Arial">Arial</option>
                      <option value="Georgia">Georgia (Serif)</option>
                      <option value="Playfair Display">Playfair Display</option>
                      <option value="Courier New">Courier New (Mono)</option>
                      <option value="Times New Roman">Times New Roman</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">Text Alignment</label>
                    <select
                      value={editingTemplate.config?.text_align || 'middle'}
                      onChange={(e) => setEditingTemplate({
                        ...editingTemplate,
                        config: { ...editingTemplate.config, text_align: e.target.value }
                      })}
                      className="w-full p-2 border rounded bg-white dark:bg-zinc-900 font-bold text-xs"
                    >
                      <option value="middle">Center Align</option>
                      <option value="start">Left Align</option>
                      <option value="end">Right Align</option>
                    </select>
                  </div>
                </div>

                {/* Name Color & Primary Accent */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">Name Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editingTemplate.config?.name_color || '#dc2626'}
                        onChange={(e) => setEditingTemplate({
                          ...editingTemplate,
                          config: { ...editingTemplate.config, name_color: e.target.value }
                        })}
                        className="w-8 h-8 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={editingTemplate.config?.name_color || '#dc2626'}
                        onChange={(e) => setEditingTemplate({
                          ...editingTemplate,
                          config: { ...editingTemplate.config, name_color: e.target.value }
                        })}
                        className="w-full p-1.5 text-xs font-mono font-bold border rounded bg-white dark:bg-zinc-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">Accent Theme Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editingTemplate.config?.primary_color || '#dc2626'}
                        onChange={(e) => setEditingTemplate({
                          ...editingTemplate,
                          config: { ...editingTemplate.config, primary_color: e.target.value }
                        })}
                        className="w-8 h-8 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={editingTemplate.config?.primary_color || '#dc2626'}
                        onChange={(e) => setEditingTemplate({
                          ...editingTemplate,
                          config: { ...editingTemplate.config, primary_color: e.target.value }
                        })}
                        className="w-full p-1.5 text-xs font-mono font-bold border rounded bg-white dark:bg-zinc-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Award Content Text */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/80 rounded-lg border-2 border-black dark:border-zinc-700 space-y-3">
                <span className="block text-xs font-black uppercase text-zinc-900 dark:text-white border-b pb-2 border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-red-600" /> Badge &amp; Subtitle Content
                </span>

                <div>
                  <label className="block text-xs font-bold mb-1">Award Title</label>
                  <input
                    type="text"
                    value={editingTemplate.title}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                    className="w-full p-2 border rounded bg-white dark:bg-zinc-900 font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Top Badge Text</label>
                  <input
                    type="text"
                    value={editingTemplate.config?.badge_title || ''}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      config: { ...editingTemplate.config, badge_title: e.target.value }
                    })}
                    placeholder="e.g. 1ST PLACE WINNER"
                    className="w-full p-2 border rounded bg-white dark:bg-zinc-900 font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Subtitle Paragraph</label>
                  <input
                    type="text"
                    value={editingTemplate.config?.subtitle || ''}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      config: { ...editingTemplate.config, subtitle: e.target.value }
                    })}
                    placeholder="e.g. For securing 1st place at"
                    className="w-full p-2 border rounded bg-white dark:bg-zinc-900 font-bold text-xs"
                  />
                </div>
              </div>

              {/* Save / Cancel Footer */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="flex-1 py-2.5 bg-zinc-200 dark:bg-zinc-700 font-black text-xs uppercase tracking-wider rounded border border-black dark:border-zinc-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingTemplate}
                  onClick={handleSaveTemplate}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1.5"
                >
                  {isSavingTemplate ? 'Saving...' : 'Save Template'}
                </button>
              </div>

            </div>
          </div>
        </UIModal>
      )}

      {/* Preview Single Certificate Modal */}
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

      {/* Preview Template Modal */}
      {previewTemplate && (
        <UIModal
          isOpen={!!previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          title={`Template Preview: ${previewTemplate.title} (${previewTemplate.type})`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-4">
            <div className="border-4 border-black dark:border-white rounded-lg overflow-hidden bg-white shadow-lg">
              <svg
                viewBox="0 0 1200 800"
                className="w-full h-auto block"
                style={{ fontFamily: previewTemplate.config?.font_family || 'Inter' }}
              >
                {previewTemplate.template_image_url && !previewTemplate.template_image_url.includes('certificate-default.png') ? (
                  <image href={previewTemplate.template_image_url} x="0" y="0" width="1200" height="800" preserveAspectRatio="none" />
                ) : (
                  <>
                    <rect x="20" y="20" width="1160" height="760" fill="#ffffff" stroke="#18181b" strokeWidth="8"/>
                    <rect x="35" y="35" width="1130" height="730" fill="#fafafa" stroke={previewTemplate.config?.primary_color || '#dc2626'} strokeWidth="4"/>
                    <rect x="45" y="45" width="1110" height="710" fill="#ffffff" stroke="#e4e4e7" strokeWidth="2"/>
                    
                    <polygon points="20,20 100,20 20,100" fill={previewTemplate.config?.primary_color || '#dc2626'} />
                    <polygon points="1180,20 1100,20 1180,100" fill={previewTemplate.config?.primary_color || '#dc2626'} />
                    <polygon points="20,780 100,780 20,700" fill="#18181b" />
                    <polygon points="1180,780 1100,780 1180,700" fill="#18181b" />

                    <g transform="translate(600, 110)">
                      <rect x="-180" y="-20" width="360" height="40" fill={previewTemplate.config?.primary_color || '#dc2626'} stroke="#18181b" strokeWidth="3" rx="4"/>
                      <text x="0" y="7" textAnchor="middle" fontSize="16" fontWeight="900" fill="#ffffff" letterSpacing="3">
                        {previewTemplate.config?.badge_title || previewTemplate.title.toUpperCase()}
                      </text>
                    </g>

                    <text x="600" y="190" textAnchor="middle" fontSize="40" fontWeight="900" fill="#18181b" letterSpacing="4">HACKNEXT CERTIFICATE</text>
                    <text x="600" y="225" textAnchor="middle" fontSize="16" fontWeight="700" fill="#71717a" letterSpacing="2">THIS CERTIFICATE IS PROUDLY PRESENTED TO</text>
                    <line x1="350" y1="245" x2="850" y2="245" stroke="#e4e4e7" strokeWidth="2"/>

                    <text x="600" y="410" textAnchor="middle" fontSize="20" fontWeight="600" fill="#3f3f46">
                      {previewTemplate.config?.subtitle || 'For outstanding active participation at'}
                    </text>
                    <text x="600" y="455" textAnchor="middle" fontSize="32" fontWeight="900" fill="#18181b">
                      {currentEvent?.name || 'HackNext Hackathon 2026'}
                    </text>

                    <g transform="translate(240, 640)">
                      <line x1="-100" y1="0" x2="100" y2="0" stroke="#18181b" strokeWidth="2"/>
                      <text x="0" y="-15" textAnchor="middle" fontSize="16" fontWeight="900" fill="#18181b">DATE ISSUED</text>
                    </g>
                    <g transform="translate(600, 640)">
                      <circle cx="0" cy="0" r="45" fill="#fafafa" stroke={previewTemplate.config?.primary_color || '#dc2626'} strokeWidth="4"/>
                      <text x="0" y="6" textAnchor="middle" fontSize="13" fontWeight="900" fill={previewTemplate.config?.primary_color || '#dc2626'}>★ ★ ★</text>
                    </g>
                    <g transform="translate(960, 640)">
                      <line x1="-100" y1="0" x2="100" y2="0" stroke="#18181b" strokeWidth="2"/>
                      <text x="0" y="-15" textAnchor="middle" fontSize="16" fontWeight="900" fill="#18181b">ORGANIZER</text>
                    </g>
                  </>
                )}

                <text
                  x={previewTemplate.config?.name_x ?? 600}
                  y={previewTemplate.config?.name_y ?? 325}
                  textAnchor={normalizeAnchor(previewTemplate.config?.text_align)}
                  fontSize={previewTemplate.config?.name_font_size ?? 46}
                  fontWeight="900"
                  fill={previewTemplate.config?.name_color || '#dc2626'}
                >
                  Alex Mercer (Sample Recipient)
                </text>
              </svg>
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="text-xs font-mono text-zinc-500">
                Coords: X={previewTemplate.config?.name_x ?? 600}, Y={previewTemplate.config?.name_y ?? 325} | Size: {previewTemplate.config?.name_font_size ?? 46}px
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const tmpl = previewTemplate;
                    setPreviewTemplate(null);
                    handleOpenCustomizer(tmpl);
                  }}
                  className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-wider rounded"
                >
                  Edit Coordinates
                </button>
                <button
                  onClick={() => setPreviewTemplate(null)}
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
