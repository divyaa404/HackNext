import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, AlertCircle, Award, CheckCircle2, Download, ArrowLeft } from 'lucide-react';

export const VerifyCertificate = () => {
  const { id } = useParams<{ id: string }>();
  const [certNo, setCertNo] = useState(id || '');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (id) {
      handleVerify(id);
    }
  }, [id]);

  const handleVerify = async (queryId?: string) => {
    const targetId = (queryId || certNo).trim();
    if (!targetId) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await axios.get(`/api/certificates/verify/${targetId}`);
      setResult(res.data);
    } catch (err: any) {
      setResult({ valid: false, error: err.response?.data?.error || 'Certificate not found or invalid' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bauhaus-bg text-bauhaus-fg p-6 md:p-12 font-sans selection:bg-bauhaus-primary selection:text-white">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation / Header */}
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 hover:text-red-600 transition">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Hackathon</span>
          </Link>
          <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-2 border-red-500 rounded font-mono text-[10px] font-black uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
            <span>Public Certificate Registry</span>
          </div>
        </div>

        {/* Search Header Card */}
        <div className="bauhaus-card p-8 bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_rgba(255,255,255,0.2)]">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <div className="w-16 h-16 bg-red-600 text-white rounded-2xl border-4 border-black flex items-center justify-center mx-auto shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              <Award className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
              Verify Certificate
            </h1>
            <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
              Authenticate official HackNext participant &amp; winner certificates using cryptographic SHA-256 validation.
            </p>

            {/* Search Input */}
            <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }} className="flex flex-col sm:flex-row gap-3 pt-4">
              <input
                type="text"
                value={certNo}
                onChange={(e) => setCertNo(e.target.value)}
                placeholder="Enter Certificate ID (e.g. HNX-2026-XXXX)"
                className="flex-1 p-3.5 border-4 border-black dark:border-white rounded bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono font-bold text-sm uppercase tracking-wider focus:outline-none focus:border-red-600"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] disabled:opacity-50 transition"
              >
                {loading ? 'Verifying...' : 'Verify Now'}
              </button>
            </form>
          </div>
        </div>

        {/* Verification Result */}
        {searched && result && (
          <div className="animate-fadeIn">
            {result.valid ? (
              <div className="bauhaus-card p-8 bg-white dark:bg-zinc-900 border-4 border-emerald-600 shadow-[8px_8px_0px_rgba(16,185,129,1)] space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-zinc-200 dark:border-zinc-800 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center border-2 border-emerald-500">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="inline-block px-2.5 py-0.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded">
                        Authentic &amp; Validated
                      </div>
                      <h2 className="text-2xl font-black uppercase text-zinc-900 dark:text-white mt-1">
                        {result.title}
                      </h2>
                    </div>
                  </div>

                  {result.fileUrl && (
                    <a
                      href={result.fileUrl}
                      download={`Certificate_${result.certificateNo}.svg`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-wider border-2 border-black dark:border-white shadow-[3px_3px_0px_rgba(220,38,38,1)] hover:bg-zinc-800 transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Certificate</span>
                    </a>
                  )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800 border-2 border-black dark:border-zinc-700 rounded space-y-1">
                    <span className="text-[10px] font-black uppercase text-zinc-500">Recipient Name</span>
                    <p className="text-lg font-black text-zinc-900 dark:text-white">{result.recipientName}</p>
                  </div>

                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800 border-2 border-black dark:border-zinc-700 rounded space-y-1">
                    <span className="text-[10px] font-black uppercase text-zinc-500">Team / Project</span>
                    <p className="text-lg font-black text-zinc-900 dark:text-white">{result.teamName || 'Individual'}</p>
                  </div>

                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800 border-2 border-black dark:border-zinc-700 rounded space-y-1">
                    <span className="text-[10px] font-black uppercase text-zinc-500">Hackathon Event</span>
                    <p className="text-base font-bold text-zinc-900 dark:text-white">{result.eventName}</p>
                  </div>

                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800 border-2 border-black dark:border-zinc-700 rounded space-y-1">
                    <span className="text-[10px] font-black uppercase text-zinc-500">Certificate ID</span>
                    <p className="text-base font-mono font-black text-red-600">{result.certificateNo}</p>
                  </div>

                  <div className="col-span-1 md:col-span-2 p-4 bg-zinc-50 dark:bg-zinc-800 border-2 border-black dark:border-zinc-700 rounded space-y-1">
                    <span className="text-[10px] font-black uppercase text-zinc-500">Cryptographic Signature Hash (SHA-256)</span>
                    <p className="text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400 break-all">{result.signatureHash}</p>
                  </div>
                </div>

                {/* SVG Visual Preview */}
                {result.fileUrl && (
                  <div className="border-4 border-black dark:border-white rounded-lg overflow-hidden shadow-md">
                    <img src={result.fileUrl} alt="Certificate Preview" className="w-full h-auto object-contain bg-white" />
                  </div>
                )}
              </div>
            ) : (
              <div className="bauhaus-card p-8 bg-white dark:bg-zinc-900 border-4 border-red-600 shadow-[8px_8px_0px_rgba(220,38,38,1)] text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto border-2 border-red-500">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight text-red-600">
                  Verification Failed
                </h3>
                <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                  {result.error || 'No valid certificate matches the provided identifier in the database.'}
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
