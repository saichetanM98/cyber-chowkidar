import React from 'react';
import {
  Shield,
  Activity,
  Cpu,
  Database,
  RefreshCw,
  Play,
  Pause,
  Terminal,
  Radio,
  Zap,
} from 'lucide-react';

export function Navbar({
  health,
  healthLoading,
  onRefreshHealth,
  isPolling,
  onTogglePolling,
  onOpenSimulator,
  lastUpdated,
}) {
  const isHealthy = health?.status === 'healthy';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-sentinel-border bg-[#0B0F19]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Theme Header */}
        <div className="flex items-center space-x-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-950/40 text-cyan-400 shadow-glow-cyan">
            <Shield className="h-6 w-6 text-cyan-400" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isHealthy ? 'animate-ping bg-emerald-400' : 'bg-red-400'}`} />
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-red-500'}`} />
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-bold tracking-wider text-slate-100 sm:text-base">
                MIDNIGHT SENTINEL
              </h1>
              <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-widest text-cyan-300">
                SOC v2.4
              </span>
            </div>
            <p className="text-xs text-sentinel-muted">
              Deep Learning SQLi & XSS Detection Pipeline
            </p>
          </div>
        </div>

        {/* Telemetry & Controls */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Gateway Status */}
          <div
            className={`hidden items-center space-x-1.5 rounded-full border px-2.5 py-1 text-xs font-medium md:flex ${
              isHealthy
                ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-400'
                : 'border-red-500/30 bg-red-950/30 text-red-400'
            }`}
          >
            <Activity className={`h-3.5 w-3.5 ${isHealthy ? 'animate-pulse' : ''}`} />
            <span className="font-mono">
              GATEWAY: {isHealthy ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>

          {/* CUDA GPU Telemetry */}
          {health?.cuda_available && (
            <div className="hidden items-center space-x-1.5 rounded-full border border-purple-500/30 bg-purple-950/30 px-2.5 py-1 text-xs font-medium text-purple-300 lg:flex">
              <Cpu className="h-3.5 w-3.5 text-purple-400" />
              <span className="font-mono">{health.device || 'CUDA GPU'}</span>
            </div>
          )}

          {/* Database status */}
          <div className="hidden items-center space-x-1.5 rounded-full border border-blue-500/30 bg-blue-950/30 px-2.5 py-1 text-xs font-medium text-blue-300 xl:flex">
            <Database className="h-3.5 w-3.5 text-blue-400" />
            <span className="font-mono">
              DB: {health?.database?.type ? health.database.type.toUpperCase() : 'IN-MEMORY'}
            </span>
          </div>

          {/* Live Polling Toggle */}
          <button
            type="button"
            onClick={onTogglePolling}
            className={`flex items-center space-x-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
              isPolling
                ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 shadow-glow-green'
                : 'border-amber-500/40 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50'
            }`}
            title={isPolling ? 'Pause live 3-second feed' : 'Resume live feed'}
          >
            {isPolling ? (
              <>
                <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
                <span className="hidden sm:inline">LIVE (3s)</span>
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5 text-amber-400" />
                <span className="hidden sm:inline">PAUSED</span>
              </>
            )}
          </button>

          {/* Manual Refresh */}
          <button
            type="button"
            onClick={onRefreshHealth}
            disabled={healthLoading}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-sentinel-border bg-sentinel-card text-sentinel-muted transition-colors hover:border-cyan-500/40 hover:text-cyan-400 disabled:opacity-50"
            title="Refresh feed & metrics"
          >
            <RefreshCw className={`h-4 w-4 ${healthLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Simulator Drawer Trigger */}
          <button
            type="button"
            onClick={onOpenSimulator}
            className="flex items-center space-x-1.5 rounded-lg border border-cyan-500/40 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition-all hover:border-cyan-400 hover:bg-cyan-500/30 hover:shadow-glow-cyan"
          >
            <Zap className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden md:inline">Attack Simulator</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
