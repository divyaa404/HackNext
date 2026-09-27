import { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, FileSpreadsheet, RefreshCw, Sparkles, Database } from 'lucide-react';

export const ExportData = () => {
  const [data, setData] = useState<any[]>([]);
  const [allData, setAllData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState('participant');

  const tables = [
    { id: 'participant', name: 'Participants' },
    { id: 'admin', name: 'Admins' },
    { id: 'judge', name: 'Judges' },
    { id: 'organizer', name: 'Organizers' },
    { id: 'event', name: 'Events' },
    { id: 'team', name: 'Teams' },
    { id: 'submission', name: 'Submissions' },
    { id: 'score', name: 'Scores & Feedback' }
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
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (arr: any[]) => {
    if (arr.length === 0) return '';
    const keys = Object.keys(arr[0]);

    const replacer = (_key: string, value: any) => {
      if (value === null) return '';
      if (typeof value === 'object') return JSON.stringify(value).replace(/"/g, '""');
      return String(value).replace(/"/g, '""');
    };

    const csvRows = arr.map(row =>
      keys.map(fieldName => `"${replacer(fieldName, row[fieldName])}"`).join(',')
    );

    csvRows.unshift(keys.map(k => `"${k}"`).join(',')); // header row
    return csvRows.join('\r\n');
  };

  const downloadCSV = (filename: string, csvData: string) => {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
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
        downloadCSV(`export_${key}.csv`, csv);
      });
    } else {
      const csv = convertToCSV(data);
      downloadCSV(`export_${selectedTable}.csv`, csv);
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
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bauhaus-card p-6 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-2 border-red-500 font-mono text-[10px] font-black uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-red-600" />
              <span>System</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
              Export Data (CSV)
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mt-0.5">
              Export all platform data tables to CSV format.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadAllData}
              disabled={loading}
              className="p-2.5 border-2 border-black dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleExportSelected}
              disabled={loading || (selectedTable !== 'all' && data.length === 0)}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {selectedTable === 'all' ? 'Export ALL Tables' : 'Export to CSV'}
            </button>
          </div>
        </div>
      </div>

      {/* Dataset Selector */}
      <div className="bauhaus-card p-6 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)]">
        <label className="block text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-3">
          <Database className="w-3.5 h-3.5 inline mr-1.5 text-red-600" />
          Select Dataset to Preview & Export
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
        <div className="bauhaus-card p-8 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] text-center">
          <Download className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-white mb-2">Ready for Batch Export</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
            Click the <strong>Export ALL Tables</strong> button to download all {Object.keys(allData).length} tables as separate CSV files.
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
                    <td colSpan={Math.max(columns.length, 1)} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-medium">Loading data...</span>
                      </div>
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={Math.max(columns.length, 1)} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                      <Database className="w-8 h-8 mx-auto mb-2 text-zinc-300 dark:text-zinc-600" />
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
            <div className="bg-zinc-100 dark:bg-zinc-800/80 px-6 py-3 border-t-4 border-black dark:border-zinc-700 text-xs font-bold text-zinc-500 dark:text-zinc-400">
              Showing {data.length} records
            </div>
          )}
        </div>
      )}
    </div>
  );
};
