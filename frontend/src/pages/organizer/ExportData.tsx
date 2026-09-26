import { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, FileSpreadsheet, RefreshCw } from 'lucide-react';

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
      // preview not supported for all, but data is there
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
    
    csvRows.unshift(keys.map(k => `"${k}"`).join(',')); // Add header row
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
      // Download all as separate files
      Object.keys(allData).forEach(key => {
        const csv = convertToCSV(allData[key]);
        downloadCSV(`dogfood_export_${key}.csv`, csv);
      });
    } else {
      const csv = convertToCSV(data);
      downloadCSV(`dogfood_export_${selectedTable}.csv`, csv);
    }
  };

  // Helper to render table cell values safely
  const renderValue = (val: any) => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (typeof val === 'object') return JSON.stringify(val);
    
    // Check if it's a date string
    const isDateStr = typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val);
    if (isDateStr) return new Date(val).toLocaleString();
    
    return String(val);
  };

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Export Data</h1>
          <p className="text-sm text-gray-500 mt-1">Export your entire platform data to Excel/CSV.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={loadAllData}
            className="p-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition"
            title="Refresh Data"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button 
            onClick={handleExportSelected}
            disabled={loading || (selectedTable !== 'all' && data.length === 0)}
            className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition flex items-center shadow-sm disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            {selectedTable === 'all' ? 'Export ALL Tables (CSV)' : 'Export to CSV'}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Dataset to Preview & Export</label>
        <select 
          className="block w-full max-w-md border-gray-300 rounded-md p-2 border focus:ring-indigo-500 focus:border-indigo-500"
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
        >
          {tables.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
          <option value="all">📥 ALL DATASETS (Batch Export)</option>
        </select>
      </div>

      {selectedTable === 'all' ? (
        <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-lg text-center">
          <Download className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-indigo-900 mb-2">Ready for Batch Export</h3>
          <p className="text-indigo-700">Click the green export button to download all {Object.keys(allData).length} tables as separate CSV files.</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map(col => (
                    <th key={col} className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      {col.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={columns.length || 1} className="text-center py-8 text-gray-500">Loading data...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={columns.length || 1} className="text-center py-8 text-gray-500">No records found in this table.</td></tr>
                ) : (
                  data.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      {columns.map(col => (
                        <td key={col} className="px-6 py-3 whitespace-nowrap text-sm text-gray-700 max-w-xs overflow-hidden text-ellipsis">
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
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-sm text-gray-500">
              Showing {data.length} records.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
