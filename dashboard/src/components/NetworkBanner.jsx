import React from 'react';
import { ShieldAlert, ShieldCheck, Zap, Lock, Terminal, Radio } from 'lucide-react';

export function NetworkBanner({ analytics, incidentsCount, lastUpdated }) {
  const blockedCount = analytics?.blocked_count ?? 0;
  const total = analytics?.total_incidents || incidentsCount || 0;
  const blockRate = analytics?.block_rate_percentage ?? (total > 0 ? ((blockedCount / total) * 100).toFixed(1) : 0);
  const avgRisk = analytics?.average_risk_score ?? 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-sentinel-border cyber-network-banner p-6 text-slate-100 shadow-2xl">
      {/* Scanline light effect */}
      <div className="scanline-overlay opacity-30" />

      {/* Cyber Grid SVG background overlay for crisp node connections */}
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="nodes-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1.5" fill="#38BDF8" />
              <circle cx="50" cy="50" r="1.5" fill="#38BDF8" />
              <line x1="10" y1="10" x2="50" y2="50" stroke="#0284C7" strokeWidth="0.5" strokeDasharray="2 2" />
              <line x1="10" y1="10" x2="60" y2="10" stroke="#0284C7" strokeWidth="0.5" />
              <line x1="50" y1="50" x2="50" y2="60" stroke="#0284C7" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#nodes-pattern)" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <div className="inline-flex items-center space-x-2 rounded-full border border-cyan-500/30 bg-cyan-950/60 px-3 py-1 text-xs font-mono text-cyan-300">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <span>NODE SURVEILLANCE // ACTIVE MITIGATION ACTIVE</span>
          </div>

          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Security Operations Center (SOC) Command
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-sentinel-muted">
            Continuous deep learning request inspection & zero-tolerance SQLi/XSS policy enforcement.
            Multi-factor behavioral analysis & instant firewall mitigation.
          </p>
        </div>

        {/* Real-time Health / Defense Badge */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-3 rounded-xl border border-sentinel-border bg-sentinel-surface/80 px-4 py-3 backdrop-blur-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase text-sentinel-muted tracking-wider">
                DEFENSE POSTURE
              </div>
              <div className="text-sm font-bold text-emerald-400">
                STRICT ZERO-TRUST
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 rounded-xl border border-sentinel-border bg-sentinel-surface/80 px-4 py-3 backdrop-blur-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Radio className="h-5 w-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase text-sentinel-muted tracking-wider">
                AVG RISK INDEX
              </div>
              <div className="text-sm font-bold font-mono text-cyan-300">
                {avgRisk} <span className="text-xs font-normal text-slate-400">/ 100</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NetworkBanner;
