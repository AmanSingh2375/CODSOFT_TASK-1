import React, { useEffect, useState } from 'react';
import { Database, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { SystemStatus } from '../types';

interface DatabaseStatusBadgeProps {
  onOpenDiagnostics?: () => void;
}

export const DatabaseStatusBadge: React.FC<DatabaseStatusBadgeProps> = ({ onOpenDiagnostics }) => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await api.getSystemStatus();
      setStatus(res);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !status) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-500 bg-slate-100 rounded-full">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
        <span>PGlite checking...</span>
      </div>
    );
  }

  const isConnected = status?.status === 'healthy';
  const mode = status?.database?.mode || 'persistent';

  return (
    <button
      onClick={onOpenDiagnostics}
      type="button"
      className="group flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-150 cursor-pointer bg-white hover:bg-slate-50 border-slate-200 shadow-sm"
      title="Click to view PGlite database health and Windows diagnostics"
    >
      <span className="relative flex h-2 w-2">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
          isConnected ? (mode === 'persistent' ? 'bg-emerald-400' : 'bg-amber-400') : 'bg-rose-400'
        }`}></span>
        <span className={`relative inline-flex rounded-full h-2 w-2 ${
          isConnected ? (mode === 'persistent' ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-rose-500'
        }`}></span>
      </span>

      <Database className="w-3.5 h-3.5 text-slate-600" />

      <span className="font-semibold text-slate-800">
        PGlite: <span className="font-normal text-slate-600 capitalize">{mode}</span>
      </span>

      {isConnected ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
      ) : (
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
      )}
    </button>
  );
};
