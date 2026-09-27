import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sliders, Plus, Trash2, Save, CheckCircle2, AlertTriangle } from 'lucide-react';

export const ManageRubrics = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [rubrics, setRubrics] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type }), 3500);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadRubrics(selectedEventId);
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

  const loadRubrics = async (eventId: string) => {
    try {
      const res = await axios.get(`/api/rubrics/events/${eventId}`);
      setRubrics(res.data || []);
    } catch (err) {
      console.error('Failed to load rubrics:', err);
    }
  };

  const handleAddCriterion = () => {
    const newRubric = {
      name: `Criterion ${rubrics.length + 1}`,
      description: 'Define evaluation standards and judge guidance.',
      weight: 20,
      max_score: 10,
      sort_order: rubrics.length + 1
    };
    setRubrics([...rubrics, newRubric]);
  };

  const handleRemoveCriterion = (idx: number) => {
    setRubrics(rubrics.filter((_, i) => i !== idx));
  };

  const handleSaveRubrics = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedEventId) return;

    setIsSaving(true);
    try {
      await axios.put(`/api/rubrics/events/${selectedEventId}`, { items: rubrics }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      showToast('Scoring rubrics updated successfully!', 'success');
      loadRubrics(selectedEventId);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to save rubrics', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const totalWeight = rubrics.reduce((sum, r) => sum + (parseFloat(r.weight) || 0), 0);
  const isWeightValid = Math.abs(totalWeight - 100) < 0.01;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg font-bold text-white transition-opacity ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      {/* Header Banner */}
      <div className="bauhaus-card p-6 md:p-8 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_rgba(255,255,255,0.2)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-2 border-red-500 font-mono text-xs font-black uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-red-600" />
              <span>Judging Architecture</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
              Scoring Rubrics
            </h1>
            <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 font-medium max-w-2xl leading-relaxed">
              Configure multi-factor criteria and percentage weights. Judges evaluate each assigned submission across these rubrics to determine mathematically normalized project rankings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAddCriterion}
              className="px-4 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-black text-xs uppercase tracking-wider border-2 border-black dark:border-zinc-600 transition flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Add Rubric</span>
            </button>
            <button
              onClick={() => handleSaveRubrics()}
              disabled={isSaving || !selectedEventId}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] disabled:opacity-50 transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Rubrics'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Event Select & Total Weight Indicator */}
      <div className="bauhaus-card p-6 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
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

          <div className={`p-4 rounded-lg border-2 flex items-center gap-3 ${
            isWeightValid 
              ? 'bg-emerald-50 border-emerald-500 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-300' 
              : 'bg-amber-50 border-amber-500 text-amber-950 dark:bg-amber-950/30 dark:text-amber-300'
          }`}>
            {isWeightValid ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : <AlertTriangle className="w-6 h-6 text-amber-600" />}
            <div>
              <div className="text-xs font-black uppercase tracking-wider">Total Combined Weight</div>
              <div className="text-2xl font-black font-mono">{totalWeight}% {isWeightValid ? '(Balanced)' : '(Should equal 100%)'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Rubrics Form List */}
      <form onSubmit={handleSaveRubrics} className="space-y-4">
        {rubrics.map((item, idx) => (
          <div
            key={idx}
            className="bauhaus-card p-6 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] space-y-4"
          >
            <div className="flex items-center justify-between border-b-2 border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-black text-white dark:bg-white dark:text-black font-black text-xs flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-zinc-500">Criterion #{idx + 1}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveCriterion(idx)}
                className="text-red-500 hover:text-red-700 font-bold text-xs p-1 flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Criterion Title
                </label>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => {
                    const n = [...rubrics];
                    n[idx].name = e.target.value;
                    setRubrics(n);
                  }}
                  className="w-full p-2.5 border-2 border-black dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Weight Percentage (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={item.weight}
                    onChange={(e) => {
                      const n = [...rubrics];
                      n[idx].weight = parseFloat(e.target.value) || 0;
                      setRubrics(n);
                    }}
                    className="w-full p-2.5 border-2 border-black dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 font-mono font-bold text-sm pr-8"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-zinc-400 font-bold">%</span>
                </div>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Guidance Description
                </label>
                <textarea
                  value={item.description || ''}
                  onChange={(e) => {
                    const n = [...rubrics];
                    n[idx].description = e.target.value;
                    setRubrics(n);
                  }}
                  rows={2}
                  className="w-full p-2.5 border-2 border-black dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-sm font-medium"
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] disabled:opacity-50 transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save All Rubric Criteria</span>
          </button>
        </div>
      </form>
    </div>
  );
};
