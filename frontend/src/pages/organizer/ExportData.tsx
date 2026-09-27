import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Download, 
  FileSpreadsheet, 
  Sparkles, 
  Database, 
  Upload, 
  CheckCircle2, 
  AlertTriangle,
  FileJson
} from 'lucide-react';
import { UIModal } from '../../components/UIModal';

export const ExportData = () => {
  const [data, setData] = useState<any[]>([]);
  const [allData, setAllData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState('participant');
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [restoreModal, setRestoreModal] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccessData, setRestoreSuccessData] = useState<any>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type }), 3500);
  };

  const tables = [
    { id: 'participant', name: 'Participants' },
    { id: 'admin', name: 'Admins' },
    { id: 'judge', name: 'Judges' },
    { id: 'organizer', name: 'Organizers' },
    { id: 'event', name: 'Events' },
    { id: 'team', name: 'Teams' },
    { id: 'submission', name: 'Submissions' },
    { id: 'score', name: 'Scores & Feedback' },
    { id: 'certificate', name: 'Certificates' },
    { id: 'vote', name: 'Community Votes' }
  ];

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (selectedTable === 'all') {
      // preview not supported for all
    } else {
      setData(allData[selectedTable] || []);
    }
  }, [selectedTable, allData]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/export`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAllData(res.data);
      setData(res.data[selectedTable] || []);
    } catch (err) {
      console.error('Failed to load export data', err);
      showToast('Failed to load export data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (arr: any[]) => {
    if (!arr || arr.length === 0) return 'id\r\n';
    const keys = Object.keys(arr[0]);

    const replacer = (_key: string, value: any) => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value).replace(/"/g, '""');
      return String(value).replace(/"/g, '""');
    };

    const csvRows = arr.map(row =>
      keys.map(fieldName => `"${replacer(fieldName, row[fieldName])}"`).join(',')
    );

    csvRows.unshift(keys.map(k => `"${k}"`).join(','));
    return csvRows.join('\r\n');
  };

  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSelected = () => {
    if (selectedTable === 'all') {
      Object.keys(allData).forEach(key => {
        const csv = convertToCSV(allData[key]);
        downloadFile(`export_${key}.csv`, csv, 'text/csv;charset=utf-8;');
      });
      showToast(`Exported all ${Object.keys(allData).length} CSV spreadsheets!`, 'success');
    } else {
      const csv = convertToCSV(data);
      downloadFile(`export_${selectedTable}.csv`, csv, 'text/csv;charset=utf-8;');
      showToast(`Exported ${selectedTable}.csv successfully!`, 'success');
    }
  };

  // Full Server Backup Download
  const handleFullBackupDownload = async () => {
    try {
      const res = await axios.get('/api/export/backup/full', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const jsonStr = JSON.stringify(res.data, null, 2);
      downloadFile(`hacknext_complete_backup_${Date.now()}.json`, jsonStr, 'application/json');
      showToast('Complete server backup downloaded successfully!', 'success');
    } catch (err) {
      showToast('Failed to download full backup', 'error');
    }
  };

  // Full Server Restore Upload
  const handleRestoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreFile) {
      showToast('Please select a JSON backup file to restore', 'error');
      return;
    }

    setIsRestoring(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const payload = JSON.parse(event.target?.result as string);
          const res = await axios.post('/api/export/backup/restore', { payload }, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setRestoreSuccessData(res.data);
          showToast('Complete server database restored successfully!', 'success');
          loadAllData();
        } catch (parseErr: any) {
          showToast(parseErr.response?.data?.error || 'Invalid backup JSON file', 'error');
          setIsRestoring(false);
        }
      };
      reader.readAsText(restoreFile);
    } catch (err) {
      showToast('Restore operation failed', 'error');
      setIsRestoring(false);
    }
  };

  const renderValue = (val: any) => {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (typeof val === 'object') return JSON.stringify(val);

    const isDateStr = typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val);
    if (isDateStr) return new Date(val).toLocaleString();

    return String(val);
  };

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg font-bold text-white transition-opacity ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      {/* Header Banner */}
      <div className="bauhaus-card p-6 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-2 border-red-500 font-mono text-[10px] font-black uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-red-600" />
              <span>Data Portability &amp; Disaster Recovery</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
              Data Backup &amp; Server Restore
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mt-0.5">
              Export all platform tables to CSV or create a complete JSON server snapshot for zero-glitch full restore.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleFullBackupDownload}
              className="px-4 py-2.5 bg-zinc-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-black font-black text-xs uppercase tracking-wider border-2 border-black dark:border-white shadow-[3px_3px_0px_rgba(220,38,38,1)] transition flex items-center gap-1.5"
            >
              <FileJson className="w-4 h-4 text-amber-400" />
              <span>Full System Backup (.JSON)</span>
            </button>

            <button
              onClick={() => { setRestoreModal(true); setRestoreSuccessData(null); }}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] transition flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" />
              <span>Restore Server Backup</span>
            </button>

            <button
              onClick={handleExportSelected}
              disabled={loading || (selectedTable !== 'all' && data.length === 0)}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] transition flex items-center gap-2 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {selectedTable === 'all' ? 'Export ALL CSV' : 'Export CSV'}
            </button>
          </div>
        </div>
      </div>

      {/* Dataset Selector */}
      <div className="bauhaus-card p-6 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)]">
        <label className="block text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-3">
          <Database className="w-3.5 h-3.5 inline mr-1.5 text-red-600" />
          Select Dataset to Preview &amp; Export
        </label>
        <div className="flex flex-wrap gap-2">
          {tables.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTable(t.id)}
              className={`px-3.5 py-1.5 text-xs font-black uppercase tracking-wider border-2 transition ${
                selectedTable === t.id
                  ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-[3px_3px_0px_rgba(220,38,38,1)]'
                  : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:border-black dark:hover:border-zinc-500'
              }`}
            >
              {t.name}
            </button>
          ))}
          <button
            onClick={() => setSelectedTable('all')}
            className={`px-3.5 py-1.5 text-xs font-black uppercase tracking-wider border-2 transition ${
              selectedTable === 'all'
                ? 'bg-red-600 text-white border-black shadow-[3px_3px_0px_rgba(0,0,0,1)]'
                : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:border-black dark:hover:border-zinc-500'
            }`}
          >
            📥 All Datasets
          </button>
        </div>
      </div>

      {/* Data Preview */}
      {selectedTable === 'all' ? (
        <div className="bauhaus-card p-8 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] text-center space-y-4">
          <Download className="w-12 h-12 text-red-600 mx-auto" />
          <h3 className="text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-white">Batch Export Ready</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium max-w-md mx-auto">
            Click <strong>Export ALL CSV</strong> to download all {Object.keys(allData).length} tables as individual CSV spreadsheets.
          </p>
        </div>
      ) : (
        <div className="bauhaus-card bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-800/80 border-b-4 border-black dark:border-zinc-700">
                  {columns.map(col => (
                    <th key={col} className="px-4 py-3.5 text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                      {col.replace(/_/g, ' ')}
                    </th>
                  ))}
                  {columns.length === 0 && (
                    <th className="px-4 py-3.5 text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Data</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-zinc-200 dark:divide-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan={Math.max(columns.length, 1)} className="px-6 py-12 text-center text-zinc-500">
                      <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <span className="text-sm font-medium">Loading data...</span>
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={Math.max(columns.length, 1)} className="px-6 py-12 text-center text-zinc-500">
                      <Database className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
                      <p className="font-bold text-sm">No records found in this table.</p>
                    </td>
                  </tr>
                ) : (
                  data.map((row, i) => (
                    <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                      {columns.map(col => (
                        <td key={col} className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap font-medium">
                          {renderValue(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && data.length > 0 && (
            <div className="bg-zinc-100 dark:bg-zinc-800/80 px-6 py-3 border-t-4 border-black dark:border-zinc-700 text-xs font-bold text-zinc-500">
              Showing {data.length} records
            </div>
          )}
        </div>
      )}

      {/* Restore Server Modal */}
      {restoreModal && (
        <UIModal
          isOpen={restoreModal}
          onClose={() => { if (!isRestoring) setRestoreModal(false); }}
          title="Restore Complete Server From Backup"
          type="warning"
        >
          {restoreSuccessData ? (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black uppercase text-zinc-900 dark:text-white">
                Server Restored Successfully!
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                {restoreSuccessData.message}
              </p>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 border-2 border-black rounded font-mono text-xs text-left space-y-1">
                <div>Users Restored: <strong>{restoreSuccessData.restoredEntities?.users}</strong></div>
                <div>Events Restored: <strong>{restoreSuccessData.restoredEntities?.events}</strong></div>
                <div>Teams Restored: <strong>{restoreSuccessData.restoredEntities?.teams}</strong></div>
                <div>Submissions Restored: <strong>{restoreSuccessData.restoredEntities?.submissions}</strong></div>
                <div>Scores Restored: <strong>{restoreSuccessData.restoredEntities?.scores}</strong></div>
                <div>Certificates Restored: <strong>{restoreSuccessData.restoredEntities?.certificates}</strong></div>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => setRestoreModal(false)}
                  className="px-6 py-2.5 bg-black text-white font-black text-xs uppercase tracking-wider rounded"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRestoreSubmit} className="space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-500 rounded text-amber-900 dark:text-amber-300 text-xs font-medium leading-relaxed flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Caution:</strong> Restoring from a backup will replace current database tables with the contents of the uploaded backup snapshot.
                </span>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
                  Select Backup JSON File (.json)
                </label>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-black file:bg-zinc-200 file:text-zinc-800 hover:file:bg-zinc-300"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  disabled={isRestoring}
                  onClick={() => setRestoreModal(false)}
                  className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 font-bold text-xs uppercase tracking-wider rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRestoring || !restoreFile}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded shadow flex items-center gap-2 disabled:opacity-50"
                >
                  {isRestoring ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Restoring Database...</span>
                    </>
                  ) : (
                    <span>Execute Full Restore</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </UIModal>
      )}

    </div>
  );
};
