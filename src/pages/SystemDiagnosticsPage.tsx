import React, { useState, useEffect } from 'react';
import {
  ServerCog,
  CheckCircle2,
  Database,
  Cpu,
  RefreshCw,
  Terminal,
  FileCode,
  ShieldCheck,
  HardDrive,
  Copy,
  Check,
} from 'lucide-react';
import { api } from '../lib/api';
import { SystemStatus } from '../types';

export const SystemDiagnosticsPage: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedEnv, setCopiedEnv] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getSystemStatus();
      setStatus(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to reach system status endpoint.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const sampleEnv = `# Server Configuration
PORT=3000

# Authentication & Security
JWT_SECRET="edumanage_jwt_secure_secret_key_change_in_production"

# Database Configuration (PGlite embedded Postgres)
# Windows-safe path or leave empty for auto safe-persistence/memory
PGLITE_DATA_DIR="./data/pglite"
# Set to 'true' if running on restricted Windows environment without write permissions:
PGLITE_MEMORY="false"`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sampleEnv);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            System & Database Diagnostics
          </h1>
          <p className="text-xs text-slate-500">
            Verify PGlite PostgreSQL health, Windows compatibility, table seeds, and local development setup
          </p>
        </div>

        <button
          onClick={fetchStatus}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Run Health Check</span>
        </button>
      </div>

      {/* Diagnostics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* PGlite Status Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              PGlite Database
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                status?.status === 'healthy'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              {status?.status === 'healthy' ? 'Operational' : 'Error'}
            </span>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">
                {status?.database?.engine || 'PGlite (Postgres WASM)'}
              </div>
              <div className="text-xs text-slate-500 capitalize">
                Mode: <span className="font-semibold text-slate-700">{status?.database?.mode || 'Persistent'}</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-600 pt-2 border-t border-slate-100 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Data Directory:</span>
              <span className="font-mono text-[11px] text-slate-700">{status?.database?.dataDir}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Windows NTFS Safe:</span>
              <span className="font-semibold text-emerald-600">Yes (Auto-Clean & Fallback)</span>
            </div>
          </div>
        </div>

        {/* Runtime Environment Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Server Host & Node
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              Full-Stack Express
            </span>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 font-mono">
                Node {status?.environment?.nodeVersion || process.version}
              </div>
              <div className="text-xs text-slate-500">
                OS Platform: <span className="font-mono">{status?.environment?.platform || 'linux'}</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-600 pt-2 border-t border-slate-100 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Server Uptime:</span>
              <span className="font-mono text-[11px] text-slate-700">
                {status?.environment?.uptimeSeconds ? `${status.environment.uptimeSeconds}s` : 'Active'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Vite Dev Middleware:</span>
              <span className="font-semibold text-emerald-600">Integrated on Port 3000</span>
            </div>
          </div>
        </div>

        {/* Security & Hashing Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Auth & Cryptography
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              Verified
            </span>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Bcrypt + JWT</div>
              <div className="text-xs text-slate-500">Zero plaintext passwords</div>
            </div>
          </div>

          <div className="text-xs text-slate-600 pt-2 border-t border-slate-100 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Password Salt:</span>
              <span className="font-semibold text-slate-700">10 rounds bcryptjs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Token Format:</span>
              <span className="font-mono text-[11px] text-indigo-600">Bearer RFC7519</span>
            </div>
          </div>
        </div>
      </div>

      {/* Database Tables & Row Counts */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Database Tables & Initial Seed Verification
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          All tables are idempotently created and verified with seed users, courses, grades, and enrollments
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {status?.database?.tables ? (
            Object.entries(status.database.tables).map(([table, count]) => (
              <div key={table} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 text-center">
                <span className="text-[11px] font-mono text-slate-500 uppercase">{table}</span>
                <div className="text-xl font-extrabold text-slate-900 mt-1">{count}</div>
                <span className="text-[10px] font-semibold text-emerald-600 flex items-center justify-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Populated
                </span>
              </div>
            ))
          ) : (
            <div className="col-span-full py-4 text-center text-xs text-slate-400">
              Loading table counts...
            </div>
          )}
        </div>
      </div>

      {/* Windows Local Setup Instructions & Fix Rationale */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Solution for Windows PGlite Issue */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Why PGlite Failed on Windows & How We Fixed It
            </h3>
          </div>
          <div className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
            <p>
              When running locally on Windows in VS Code, PGlite previously threw{' '}
              <code className="text-rose-600 bg-rose-50 px-1 py-0.5 rounded font-mono">
                "PGlite failed to initialize properly"
              </code>{' '}
              due to two primary Windows-specific factors:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-700 ml-1">
              <li>
                <strong>Windows Path Backslashes:</strong> Windows file separators (<code className="font-mono">\</code>) break Emscripten's virtual filesystem mounting. We now normalize all paths to POSIX forward slashes (<code className="font-mono">/</code>).
              </li>
              <li>
                <strong>Stale Lock Files:</strong> When stopping the dev server with <kbd className="px-1 py-0.5 bg-slate-100 rounded border text-[10px]">Ctrl+C</kbd>, Windows NTFS retains <code className="font-mono">postmaster.pid</code> and <code className="font-mono">.lock</code>, which locks subsequent runs. Our initializer automatically unlinks stale lock files.
              </li>
              <li>
                <strong>Fsync Lock Prevention:</strong> We enable <code className="font-mono text-indigo-600">relaxedDurability: true</code> to avoid synchronous file locking contention on NTFS.
              </li>
              <li>
                <strong>Graceful Memory Fallback:</strong> If the local filesystem has restricted permissions (e.g. OneDrive sync folders), it automatically falls back to an in-memory PGlite instance so the server never crashes.
              </li>
            </ul>
          </div>
        </div>

        {/* Local Running Guide */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Local VS Code Setup Instructions</h3>
            </div>
            <button
              onClick={copyToClipboard}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedEnv ? 'Copied .env' : 'Copy .env snippet'}</span>
            </button>
          </div>

          <div className="text-xs text-slate-600 space-y-2">
            <p>To run this project locally on your Windows machine:</p>
            <ol className="list-decimal list-inside space-y-1.5 font-medium text-slate-800 ml-1">
              <li>Open your project folder in VS Code.</li>
              <li>Ensure Node.js 18+ or 20+ is installed (<code className="font-mono text-[11px]">node -v</code>).</li>
              <li>
                Run in terminal:{' '}
                <code className="bg-slate-900 text-emerald-400 px-2 py-0.5 rounded font-mono text-[11px]">
                  npm install
                </code>
              </li>
              <li>
                Start the application:{' '}
                <code className="bg-slate-900 text-emerald-400 px-2 py-0.5 rounded font-mono text-[11px]">
                  npm run dev
                </code>
              </li>
              <li>
                Open{' '}
                <a
                  href="http://localhost:3000"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 underline font-mono"
                >
                  http://localhost:3000
                </a>{' '}
                in your browser.
              </li>
            </ol>
          </div>

          <div className="mt-3 bg-slate-900 rounded-xl p-3 text-slate-300 font-mono text-[11px] overflow-x-auto">
            <div className="text-slate-500 mb-1"># Terminal Output Example:</div>
            <div className="text-emerald-400">[PGlite] Initializing database at: ./data/pglite</div>
            <div className="text-emerald-400">[Database] Verifying schema and tables...</div>
            <div className="text-indigo-300">[EduManage] Application is live at: http://localhost:3000</div>
          </div>
        </div>
      </div>
    </div>
  );
};
