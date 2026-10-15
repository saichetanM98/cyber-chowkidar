import React, { useState } from 'react';
import {
  Search,
  Filter,
  Eye,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  Activity,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export function LiveLogFeed({
  incidents = [],
  onSelectIncident,
  selectedIncident,
  filters,
  onFilterChange,
  isLoading,
}) {
  const [searchInput, setSearchInput] = useState(filters?.search || '');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onFilterChange?.({ ...filters, search: searchInput });
  };

  const getVerdictBadge = (verdict) => {
    const v = (verdict || 'ALLOW').toUpperCase();
    if (v === 'BLOCK') {
      return (
        <span className="inline-flex items-center space-x-1 rounded-md border border-red-500/40 bg-red-950/40 px-2 py-0.5 text-xs font-mono font-bold text-red-400 threat-glow-block">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-ping" />
          <span>BLOCK</span>
        </span>
      );
    }
    if (v === 'RATE_LIMIT') {
      return (
        <span className="inline-flex items-center space-x-1 rounded-md border border-orange-500/40 bg-orange-950/40 px-2 py-0.5 text-xs font-mono font-bold text-orange-400">
          <Flame className="h-3 w-3 text-orange-400" />
          <span>RATE_LIMIT</span>
        </span>
      );
    }
    if (v === 'MONITOR') {
      return (
        <span className="inline-flex items-center space-x-1 rounded-md border border-amber-500/40 bg-amber-950/40 px-2 py-0.5 text-xs font-mono font-bold text-amber-400">
          <AlertTriangle className="h-3 w-3 text-amber-400" />
          <span>MONITOR</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 rounded-md border border-emerald-500/40 bg-emerald-950/40 px-2 py-0.5 text-xs font-mono font-bold text-emerald-400">
        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
        <span>ALLOW</span>
      </span>
    );
  };

  const getAttackBadge = (type) => {
    const t = (type || 'benign').toLowerCase();
    if (t === 'sqli') {
      return (
        <span className="rounded border border-red-500/40 bg-red-500/10 px-1.5 py-0.5 font-mono text-[11px] font-bold text-red-400">
          SQLi
        </span>
      );
    }
    if (t === 'xss') {
      return (
        <span className="rounded border border-rose-500/40 bg-rose-500/10 px-1.5 py-0.5 font-mono text-[11px] font-bold text-rose-400">
          XSS
        </span>
      );
    }
    return (
      <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[11px] font-medium text-emerald-400">
        BENIGN
      </span>
    );
  };

  const getRiskScoreDisplay = (score) => {
    const s = Number(score) || 0;
    let colorClass = 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30';
    let label = 'LOW';
    if (s >= 80) {
      colorClass = 'text-red-400 bg-red-950/50 border-red-500/50 shadow-glow-red';
      label = 'CRITICAL';
    } else if (s >= 60) {
      colorClass = 'text-amber-400 bg-amber-950/40 border-amber-500/40';
      label = 'HIGH';
    } else if (s >= 40) {
      colorClass = 'text-yellow-400 bg-yellow-950/40 border-yellow-500/30';
      label = 'MEDIUM';
    }

    return (
      <div className="flex items-center space-x-1.5">
        <span className={`rounded border px-1.5 py-0.5 font-mono text-xs font-bold ${colorClass}`}>
          {s.toFixed(1)}
        </span>
        <span className="hidden font-mono text-[10px] text-slate-400 sm:inline">
          {label}
        </span>
      </div>
    );
  };

  return (
    <div className="soc-card flex flex-col rounded-2xl overflow-hidden">
      {/* Feed Title and Controls Bar */}
      <div className="border-b border-sentinel-border bg-sentinel-surface/90 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Live Security Incident & Telemetry Stream</span>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              </h3>
              <p className="text-xs text-sentinel-muted font-mono">
                Real-time request ingestion, payload inspection, and policy verdicts
              </p>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative min-w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-sentinel-muted" />
              <input
                type="text"
                placeholder="Search IP, path, or payload..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-lg border border-sentinel-border bg-sentinel-bg pl-8 pr-12 py-1.5 text-xs font-mono text-slate-200 placeholder-sentinel-muted focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-mono text-cyan-300 hover:bg-cyan-500/30"
              >
                Go
              </button>
            </form>

            {/* Verdict Filter */}
            <select
              value={filters?.verdict || 'ALL'}
              onChange={(e) => onFilterChange?.({ ...filters, verdict: e.target.value })}
              className="rounded-lg border border-sentinel-border bg-sentinel-bg px-2.5 py-1.5 text-xs font-mono text-slate-300 focus:border-cyan-500 focus:outline-none"
            >
              <option value="ALL">All Verdicts</option>
              <option value="BLOCK">BLOCK</option>
              <option value="MONITOR">MONITOR</option>
              <option value="RATE_LIMIT">RATE_LIMIT</option>
              <option value="ALLOW">ALLOW</option>
            </select>

            {/* Attack Type Filter */}
            <select
              value={filters?.attack_type || 'ALL'}
              onChange={(e) => onFilterChange?.({ ...filters, attack_type: e.target.value })}
              className="rounded-lg border border-sentinel-border bg-sentinel-bg px-2.5 py-1.5 text-xs font-mono text-slate-300 focus:border-cyan-500 focus:outline-none"
            >
              <option value="ALL">All Vectors</option>
              <option value="sqli">SQLi</option>
              <option value="xss">XSS</option>
              <option value="benign">Benign</option>
            </select>

            {/* Triage Status Filter */}
            <select
              value={filters?.status || 'ALL'}
              onChange={(e) => onFilterChange?.({ ...filters, status: e.target.value })}
              className="rounded-lg border border-sentinel-border bg-sentinel-bg px-2.5 py-1.5 text-xs font-mono text-slate-300 focus:border-cyan-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="TRUE_POSITIVE">TRUE POSITIVE</option>
              <option value="FALSE_POSITIVE">FALSE POSITIVE</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Scrolling Incident Table */}
      <div className="relative max-h-[580px] overflow-auto">
        {incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-glow-green">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h4 className="mt-4 text-sm font-bold text-slate-200">
              No Recorded Events
            </h4>
            <p className="mt-1 max-w-sm text-xs text-sentinel-muted">
              {filters?.search || filters?.verdict !== 'ALL' || filters?.attack_type !== 'ALL' || filters?.status !== 'ALL'
                ? 'No events matched the applied filters. Try clearing filters or search terms.'
                : 'No gateway telemetry events recorded yet. Use the simulator or send requests to start streaming.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-20 border-b border-sentinel-border bg-[#0B0F19]/95 text-sentinel-muted font-mono uppercase tracking-wider backdrop-blur-sm">
              <tr>
                <th className="py-3 px-3">Time</th>
                <th className="py-3 px-3">Incident ID</th>
                <th className="py-3 px-3">Client IP</th>
                <th className="py-3 px-3">Method & Path</th>
                <th className="py-3 px-3">Attack Vector</th>
                <th className="py-3 px-3">ML Confidence</th>
                <th className="py-3 px-3">Risk Score</th>
                <th className="py-3 px-3">Verdict</th>
                <th className="py-3 px-3">Triage</th>
                <th className="py-3 px-3 text-right">Forensics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sentinel-border/50 font-mono">
              {incidents.map((inc) => {
                const isSelected = selectedIncident?.id === inc.id;
                const isBlocked = inc.verdict === 'BLOCK';
                const rowBg = isSelected
                  ? 'bg-cyan-950/40 border-l-4 border-cyan-400'
                  : isBlocked
                  ? 'hover:bg-red-950/20'
                  : 'hover:bg-sentinel-surface/60';

                return (
                  <tr
                    key={inc.id}
                    onClick={() => onSelectIncident?.(inc)}
                    className={`cursor-pointer transition-colors ${rowBg}`}
                  >
                    {/* Timestamp */}
                    <td className="whitespace-nowrap px-3 py-3 text-slate-300">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="h-3 w-3 text-sentinel-muted" />
                        <span>
                          {new Date((inc.timestamp || Date.now() / 1000) * 1000).toLocaleTimeString()}
                        </span>
                      </div>
                    </td>

                    {/* Short Incident ID */}
                    <td className="whitespace-nowrap px-3 py-3 text-slate-400">
                      <span className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-cyan-300">
                        {inc.id ? inc.id.substring(0, 8) : 'unknown'}
                      </span>
                    </td>

                    {/* Client IP */}
                    <td className="whitespace-nowrap px-3 py-3 text-slate-100 font-bold">
                      <code>{inc.client_ip || '127.0.0.1'}</code>
                    </td>

                    {/* Method & Path */}
                    <td className="max-w-[200px] truncate px-3 py-3 text-slate-300">
                      <span className="mr-1.5 rounded bg-slate-800 px-1 py-0.2 text-[10px] font-bold text-amber-300">
                        {inc.method || 'GET'}
                      </span>
                      <span title={inc.path || '/'}>{inc.path || '/'}</span>
                    </td>

                    {/* Attack Vector */}
                    <td className="whitespace-nowrap px-3 py-3">
                      {getAttackBadge(inc.attack_type)}
                    </td>

                    {/* ML Confidence */}
                    <td className="whitespace-nowrap px-3 py-3 text-slate-200">
                      {typeof inc.confidence === 'number'
                        ? `${(inc.confidence * 100).toFixed(1)}%`
                        : 'N/A'}
                    </td>

                    {/* Risk Score */}
                    <td className="whitespace-nowrap px-3 py-3">
                      {getRiskScoreDisplay(inc.risk_score)}
                    </td>

                    {/* Verdict */}
                    <td className="whitespace-nowrap px-3 py-3">
                      {getVerdictBadge(inc.verdict)}
                    </td>

                    {/* Triage Status */}
                    <td className="whitespace-nowrap px-3 py-3">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          inc.status === 'TRUE_POSITIVE'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : inc.status === 'FALSE_POSITIVE'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : inc.status === 'RESOLVED'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {inc.status || 'OPEN'}
                      </span>
                    </td>

                    {/* Inspect Button */}
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectIncident?.(inc);
                        }}
                        className="inline-flex items-center space-x-1 rounded-md border border-sentinel-border bg-sentinel-surface px-2 py-1 text-[11px] font-sans text-cyan-400 transition-colors hover:border-cyan-500/40 hover:bg-cyan-950/40 hover:text-cyan-300"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Info Bar */}
      <div className="flex items-center justify-between border-t border-sentinel-border bg-sentinel-surface/80 px-4 py-2.5 text-xs font-mono text-sentinel-muted">
        <span>Showing {incidents.length} recorded events</span>
        <span className="flex items-center space-x-2">
          <span>Click any row or Inspect button to open Threat Forensics</span>
        </span>
      </div>
    </div>
  );
}

export default LiveLogFeed;
