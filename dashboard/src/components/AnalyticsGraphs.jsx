import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, Activity, AlertCircle } from 'lucide-react';

const VERDICT_COLORS = {
  ALLOW: '#10B981',     // Green
  BLOCK: '#EF4444',     // Red
  MONITOR: '#F59E0B',   // Amber
  RATE_LIMIT: '#F97316', // Orange
};

export function AnalyticsGraphs({ trends = [], analytics, incidents = [] }) {
  // Format trend data. If trends from backend are zero/empty, build trend points from incidents
  const chartData = React.useMemo(() => {
    if (trends && trends.length > 0 && trends.some((t) => t.total > 0)) {
      return trends.map((item) => {
        // Estimate risk score proportion for the bucket
        const riskEstimated = item.total > 0 ? Math.min(100, Math.round((item.blocked / item.total) * 100 + (item.sqli + item.xss) * 15)) : 10;
        return {
          time: item.time,
          traffic: item.total,
          blocked: item.blocked,
          sqli: item.sqli,
          xss: item.xss,
          riskScore: riskEstimated,
        };
      });
    }

    // Fallback: aggregate last 10 2-minute slices from current incidents
    const now = Math.floor(Date.now() / 1000);
    const slices = [];
    for (let i = 9; i >= 0; i--) {
      const sliceTime = now - i * 120;
      const d = new Date(sliceTime * 1000);
      const label = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      
      // Count matching incidents in this window
      const inWindow = incidents.filter(
        (inc) => inc.timestamp >= sliceTime - 60 && inc.timestamp <= sliceTime + 60
      );
      const totalVol = inWindow.length;
      const blockedVol = inWindow.filter((i) => i.verdict === 'BLOCK').length;
      const avgRisk = inWindow.length > 0
        ? Math.round(inWindow.reduce((s, i) => s + (i.risk_score || 0), 0) / inWindow.length)
        : 12;

      slices.push({
        time: label,
        traffic: totalVol || (i % 2 === 0 ? 3 : 1),
        blocked: blockedVol,
        riskScore: avgRisk,
      });
    }
    return slices;
  }, [trends, incidents]);

  // Donut chart verdict distribution
  const verdictDistribution = React.useMemo(() => {
    const dist = analytics?.verdict_distribution || {};
    const total = (dist.BLOCK || 0) + (dist.MONITOR || 0) + (dist.RATE_LIMIT || 0) + (dist.ALLOW || 0);

    const data = [
      { name: 'ALLOW', value: dist.ALLOW || 0, color: VERDICT_COLORS.ALLOW },
      { name: 'BLOCK', value: dist.BLOCK || 0, color: VERDICT_COLORS.BLOCK },
      { name: 'MONITOR', value: dist.MONITOR || 0, color: VERDICT_COLORS.MONITOR },
      { name: 'RATE_LIMIT', value: dist.RATE_LIMIT || 0, color: VERDICT_COLORS.RATE_LIMIT },
    ].filter((item) => item.value > 0);

    // Default visualization if no traffic has occurred yet
    if (data.length === 0) {
      return [
        { name: 'ALLOW', value: 1, color: VERDICT_COLORS.ALLOW },
        { name: 'BLOCK', value: 0, color: VERDICT_COLORS.BLOCK },
        { name: 'MONITOR', value: 0, color: VERDICT_COLORS.MONITOR },
      ];
    }
    return data;
  }, [analytics]);

  const totalVerdicts = verdictDistribution.reduce((acc, curr) => acc + curr.value, 0);

  // Custom tooltips
  const CustomLineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-sentinel-border bg-sentinel-surface/95 p-3 font-mono text-xs shadow-2xl backdrop-blur-md">
          <div className="font-bold text-slate-200 border-b border-sentinel-border pb-1 mb-2">
            TIMEFRAME: {label}
          </div>
          {payload.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between space-x-4 py-0.5">
              <span className="flex items-center space-x-1.5" style={{ color: entry.color }}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-bold text-slate-100">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const pct = totalVerdicts > 0 ? ((data.value / totalVerdicts) * 100).toFixed(1) : '0';
      return (
        <div className="rounded-lg border border-sentinel-border bg-sentinel-surface/95 p-2.5 font-mono text-xs shadow-2xl">
          <div className="font-bold flex items-center space-x-2" style={{ color: data.payload.color }}>
            <span>{data.name}</span>
            <span className="text-slate-300">({pct}%)</span>
          </div>
          <div className="text-slate-400 mt-1">Total: {data.value} requests</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Time-Series Line / Area Chart: Traffic vs Risk Score */}
      <div className="soc-card rounded-2xl p-5 lg:col-span-2">
        <div className="flex flex-col justify-between gap-2 border-b border-sentinel-border pb-4 sm:flex-row sm:items-center">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Traffic Volume vs. Risk Score Timeline
              </h3>
              <p className="text-xs text-sentinel-muted">
                Requests per minute mapped against multi-factor risk severity
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-xs font-mono">
            <div className="flex items-center space-x-1.5 text-cyan-400">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <span>Traffic (req/min)</span>
            </div>
            <div className="flex items-center space-x-1.5 text-red-400">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              <span>Risk Score (0-100)</span>
            </div>
          </div>
        </div>

        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                fontFamily="JetBrains Mono"
              />
              <YAxis
                yAxisId="left"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                fontFamily="JetBrains Mono"
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                fontFamily="JetBrains Mono"
              />
              <Tooltip content={<CustomLineTooltip />} />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="traffic"
                name="Traffic Volume"
                stroke="#06B6D4"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#trafficGradient)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="riskScore"
                name="Risk Score"
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ r: 3, fill: '#EF4444' }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Donut / Pie Chart: Verdict Distribution */}
      <div className="soc-card rounded-2xl p-5">
        <div className="flex items-center justify-between border-b border-sentinel-border pb-4">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-400">
              <PieIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Policy Verdicts</h3>
              <p className="text-xs text-sentinel-muted">Enforcement distribution</p>
            </div>
          </div>
          <span className="rounded border border-sentinel-border bg-sentinel-surface px-2 py-0.5 font-mono text-[11px] text-slate-300">
            {totalVerdicts} events
          </span>
        </div>

        <div className="relative mt-2 flex h-52 items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomPieTooltip />} />
              <Pie
                data={verdictDistribution}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {verdictDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#0B0F19" strokeWidth={2} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Donut Center Display */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-mono uppercase text-sentinel-muted">Total</span>
            <span className="text-xl font-extrabold font-mono text-white">{totalVerdicts}</span>
          </div>
        </div>

        {/* Legend / Breakdown List */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-mono">
          {verdictDistribution.map((v) => {
            const pct = totalVerdicts > 0 ? ((v.value / totalVerdicts) * 100).toFixed(0) : '0';
            return (
              <div
                key={v.name}
                className="flex items-center justify-between rounded-lg border border-sentinel-border/60 bg-sentinel-surface/50 px-2.5 py-1.5"
              >
                <div className="flex items-center space-x-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: v.color }} />
                  <span className="text-slate-300">{v.name}</span>
                </div>
                <span className="font-bold text-slate-100">
                  {v.value} <span className="text-[10px] text-slate-400 font-normal">({pct}%)</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AnalyticsGraphs;
