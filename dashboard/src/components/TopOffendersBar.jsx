import React from 'react';
import { UserX, ShieldAlert, Ban, ShieldCheck } from 'lucide-react';

export function TopOffendersBar({ topOffenders = [], onIPOverride }) {
  if (!topOffenders || topOffenders.length === 0) return null;

  return (
    <div className="soc-card rounded-xl p-3 sm:p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-red-500/30 bg-red-500/10 text-red-400">
            <UserX className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Top Adversary IPs
            </h4>
            <p className="text-[10px] text-sentinel-muted font-mono">Ranked by threat frequency & peak severity</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {topOffenders.map((offender) => {
            const isHighRisk = offender.highest_risk >= 70;
            return (
              <div
                key={offender.ip}
                className="flex items-center space-x-2 rounded-lg border border-sentinel-border bg-sentinel-surface px-2.5 py-1.5 text-xs font-mono transition-colors hover:border-red-500/40"
              >
                <div className="flex items-center space-x-1.5">
                  <span className={`h-2 w-2 rounded-full ${isHighRisk ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span className="font-bold text-slate-100">{offender.ip}</span>
                </div>

                <div className="flex items-center space-x-1 text-[11px] text-sentinel-muted">
                  <span className="rounded bg-slate-800 px-1 py-0.2 text-cyan-300">
                    {offender.incident_count} hits
                  </span>
                  <span className={`font-bold ${isHighRisk ? 'text-red-400' : 'text-amber-400'}`}>
                    {offender.highest_risk} risk
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onIPOverride?.(offender.ip, 'BLACKLIST', 'One-click block from SOC top offender bar')}
                  className="rounded border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-300 transition-colors hover:bg-red-500/30"
                  title={`Immediately blacklist IP ${offender.ip}`}
                >
                  Block
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TopOffendersBar;
