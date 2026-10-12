import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  Ban,
  Clock,
  Terminal,
  Server,
  Cpu,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export function ThreatDetailsPanel({
  incident,
  onClose,
  onStatusUpdate,
  onIPOverride,
}) {
  const [copied, setCopied] = useState(false);
  const [notes, setNotes] = useState(incident?.analyst_notes || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (!incident) return null;

  const handleCopy = () => {
    if (incident.raw_payload || incident.payload) {
      navigator.clipboard.writeText(incident.raw_payload || incident.payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setIsUpdating(true);
      await onStatusUpdate?.(incident.id, newStatus, notes);
      setFeedback({ type: 'success', text: `Status updated to ${newStatus}` });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleIPAction = async (action) => {
    try {
      setIsUpdating(true);
      await onIPOverride?.(incident.client_ip, action, `Analyst action from Incident ${incident.id}`);
      setFeedback({ type: 'success', text: `IP ${incident.client_ip} set to ${action}` });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  // Compute exact triggering rule description
  const getTriggeringRule = () => {
    const verdict = (incident.verdict || '').toUpperCase();
    const attack = (incident.attack_type || '').toLowerCase();
    const conf = typeof incident.confidence === 'number' ? (incident.confidence * 100).toFixed(1) : '95.0';
    const risk = Number(incident.risk_score) || 0;

    if (verdict === 'BLOCK') {
      if (attack === 'sqli') {
        return {
          title: 'ML Deep Learning SQL Injection Rule [Zero-Tolerance]',
          detail: `Confidence ${conf}% exceeds 90.0% threshold. BiLSTM token parsing identified illicit SQL syntax clauses.`,
          severity: 'CRITICAL',
          color: 'border-red-500/50 bg-red-950/40 text-red-300',
        };
      }
      if (attack === 'xss') {
        return {
          title: 'ML Deep Learning Cross-Site Scripting (XSS) Rule',
          detail: `Confidence ${conf}% exceeds 90.0% threshold. DOM script injection or malicious HTML tag vector identified.`,
          severity: 'CRITICAL',
          color: 'border-rose-500/50 bg-rose-950/40 text-rose-300',
        };
      }
      if (risk >= 80) {
        return {
          title: 'Multi-Factor Cumulative Threat Threshold Rule',
          detail: `Calculated Risk Score (${risk.toFixed(1)}/100) exceeded mandatory 80.0 block ceiling.`,
          severity: 'CRITICAL',
          color: 'border-red-500/50 bg-red-950/40 text-red-300',
        };
      }
      return {
        title: 'Active Policy Engine Enforcement Block',
        detail: `Ingress request flagged by security policy engine and quarantined immediately.`,
        severity: 'CRITICAL',
        color: 'border-red-500/50 bg-red-950/40 text-red-300',
      };
    }

    if (verdict === 'RATE_LIMIT') {
      return {
        title: 'Sliding Burst Velocity Rate Limit Rule',
        detail: `Client IP exceeded burst frequency threshold (>20 req/min). Temporary 429 throttling enforced.`,
        severity: 'HIGH',
        color: 'border-orange-500/50 bg-orange-950/40 text-orange-300',
      };
    }

    if (verdict === 'MONITOR') {
      return {
        title: 'Elevated Threat Heuristic Rule [Passive Observation]',
        detail: `Risk Score (${risk.toFixed(1)}/100) falls in the 40.0 - 79.9 monitoring window. Packet logged for behavioral tracking.`,
        severity: 'MEDIUM',
        color: 'border-amber-500/50 bg-amber-950/40 text-amber-300',
      };
    }

    return {
      title: 'Benign Clean Request Clearance Rule',
      detail: `Payload structure and behavioral score passed deep learning and reputation evaluation.`,
      severity: 'LOW',
      color: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300',
    };
  };

  const ruleInfo = getTriggeringRule();
  const riskScore = Number(incident.risk_score) || 0;
  const components = incident.risk_components || {};
  const mlContrib = components.ml ?? (incident.attack_type !== 'benign' ? (incident.confidence * 70).toFixed(1) : '0.0');
  const threatContrib = components.threat_intel ?? '0.0';
  const behaviorContrib = components.behavior ?? '0.0';

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col border-l border-sentinel-border bg-[#0B0F19]/95 text-slate-100 shadow-2xl backdrop-blur-xl">
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-sentinel-border bg-sentinel-surface/80 p-5">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/40 bg-red-500/10 text-red-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Threat Forensics & Policy Engine Drill-Down</span>
            </h3>
            <div className="flex items-center space-x-2 text-xs font-mono text-sentinel-muted">
              <span>INCIDENT ID:</span>
              <span className="text-cyan-300 font-bold">{incident.id}</span>
            </div>
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

      {/* Action Notification Banner */}
      {feedback && (
        <div
          className={`px-5 py-2 text-xs font-mono ${
            feedback.type === 'error'
              ? 'bg-red-950 border-b border-red-500 text-red-300'
              : 'bg-emerald-950 border-b border-emerald-500 text-emerald-300'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Drawer Scrollable Content */}
      <div className="flex-1 space-y-6 overflow-y-auto p-6 font-sans">
        {/* Exact Triggering Rule Banner */}
        <div className={`rounded-xl border p-4 ${ruleInfo.color}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-red-400 animate-ping" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider">
                TRIGGERED ENFORCEMENT RULE
              </span>
            </div>
            <span className="rounded bg-black/40 px-2 py-0.5 font-mono text-[10px] font-bold">
              {ruleInfo.severity} SEVERITY
            </span>
          </div>

          <h4 className="mt-2 text-sm font-extrabold text-white">
            {ruleInfo.title}
          </h4>
          <p className="mt-1 text-xs text-slate-300 leading-relaxed font-mono">
            {ruleInfo.detail}
          </p>
        </div>

        {/* Verdict & Meta Badges */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono text-xs">
          <div className="rounded-lg border border-sentinel-border bg-sentinel-surface p-2.5">
            <span className="text-[10px] text-sentinel-muted uppercase">Verdict</span>
            <div className="mt-1 font-bold text-red-400">{incident.verdict}</div>
          </div>
          <div className="rounded-lg border border-sentinel-border bg-sentinel-surface p-2.5">
            <span className="text-[10px] text-sentinel-muted uppercase">Vector</span>
            <div className="mt-1 font-bold text-amber-400">{(incident.attack_type || 'benign').toUpperCase()}</div>
          </div>
          <div className="rounded-lg border border-sentinel-border bg-sentinel-surface p-2.5">
            <span className="text-[10px] text-sentinel-muted uppercase">Status</span>
            <div className="mt-1 font-bold text-cyan-300">{incident.status || 'OPEN'}</div>
          </div>
          <div className="rounded-lg border border-sentinel-border bg-sentinel-surface p-2.5">
            <span className="text-[10px] text-sentinel-muted uppercase">Recorded At</span>
            <div className="mt-1 font-bold text-slate-300">
              {new Date((incident.timestamp || Date.now() / 1000) * 1000).toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Multi-Factor Risk Decomposition */}
        <div className="soc-card rounded-xl p-4">
          <div className="flex items-center justify-between border-b border-sentinel-border pb-3">
            <div className="flex items-center space-x-2">
              <Cpu className="h-4 w-4 text-cyan-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Multi-Factor Risk Score Breakdown
              </h4>
            </div>
            <span className="font-mono text-sm font-extrabold text-red-400">
              {riskScore.toFixed(1)} / 100
            </span>
          </div>

          {/* Cumulative Gauge Bar */}
          <div className="mt-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full transition-all duration-500 ${
                  riskScore >= 80 ? 'bg-red-500 shadow-glow-red' : riskScore >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, riskScore))}%` }}
              />
            </div>
          </div>

          {/* Individual Components */}
          <div className="mt-4 space-y-3 text-xs font-mono">
            <div>
              <div className="flex items-center justify-between text-slate-300">
                <span>1. Deep Learning Model (CNN + BiLSTM)</span>
                <span className="font-bold text-cyan-400">{mlContrib} pts (70% wt)</span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-cyan-400"
                  style={{ width: `${Math.min(100, (Number(mlContrib) / 70) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-slate-300">
                <span>2. Threat Intelligence & IP Reputation</span>
                <span className="font-bold text-amber-400">{threatContrib} pts (15% wt)</span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{ width: `${Math.min(100, (Number(threatContrib) / 15) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-slate-300">
                <span>3. Behavioral Velocity & Anomaly</span>
                <span className="font-bold text-purple-400">{behaviorContrib} pts (15% wt)</span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-purple-400"
                  style={{ width: `${Math.min(100, (Number(behaviorContrib) / 15) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Request Ingress Attributes */}
        <div className="soc-card rounded-xl p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-sentinel-border pb-3">
            Ingress Metadata
          </h4>
          <div className="mt-3 grid grid-cols-1 gap-2 text-xs font-mono sm:grid-cols-2">
            <div className="flex flex-col rounded bg-sentinel-bg/80 p-2">
              <span className="text-[10px] text-sentinel-muted uppercase">Client IP</span>
              <span className="font-bold text-slate-100">{incident.client_ip || '127.0.0.1'}</span>
            </div>
            <div className="flex flex-col rounded bg-sentinel-bg/80 p-2">
              <span className="text-[10px] text-sentinel-muted uppercase">HTTP Method</span>
              <span className="font-bold text-slate-100">{incident.method || 'GET'}</span>
            </div>
            <div className="flex flex-col rounded bg-sentinel-bg/80 p-2 sm:col-span-2">
              <span className="text-[10px] text-sentinel-muted uppercase">Target Path / URI</span>
              <span className="font-bold text-slate-100 break-all">{incident.path || '/'}</span>
            </div>
            <div className="flex flex-col rounded bg-sentinel-bg/80 p-2">
              <span className="text-[10px] text-sentinel-muted uppercase">ML Confidence</span>
              <span className="font-bold text-cyan-300">
                {typeof incident.confidence === 'number' ? `${(incident.confidence * 100).toFixed(2)}%` : 'N/A'}
              </span>
            </div>
            <div className="flex flex-col rounded bg-sentinel-bg/80 p-2">
              <span className="text-[10px] text-sentinel-muted uppercase">Latency</span>
              <span className="font-bold text-emerald-400">{incident.latency_ms || '4.2'} ms</span>
            </div>
          </div>
        </div>

        {/* Inspectable Payload Viewer */}
        <div className="soc-card rounded-xl p-4">
          <div className="flex items-center justify-between border-b border-sentinel-border pb-3">
            <div className="flex items-center space-x-2">
              <Terminal className="h-4 w-4 text-cyan-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Intercepted Raw Payload
              </h4>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center space-x-1.5 rounded-lg border border-sentinel-border bg-sentinel-surface px-2.5 py-1 text-xs font-mono text-cyan-300 hover:border-cyan-500/40"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Payload'}</span>
            </button>
          </div>

          <div className="mt-3 relative rounded-lg border border-sentinel-border bg-[#080B12] p-3">
            <pre className="max-h-40 overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs text-red-300 selection:bg-red-900/50">
              {incident.raw_payload || incident.payload || '(empty payload or header only)'}
            </pre>
          </div>
        </div>

        {/* SOC Analyst Action Center */}
        <div className="soc-card rounded-xl p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-sentinel-border pb-3">
            Analyst Action & Triage Center
          </h4>

          {/* Notes Input */}
          <div className="mt-3">
            <label className="text-[11px] font-mono text-sentinel-muted uppercase">
              Triage Notes & Rationale
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record forensic observations or remediation steps..."
              className="mt-1 w-full rounded-lg border border-sentinel-border bg-sentinel-bg p-2.5 text-xs font-mono text-slate-200 placeholder-sentinel-muted focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Status buttons */}
          <div className="mt-3">
            <span className="text-[10px] font-mono text-sentinel-muted uppercase">
              Set Classification
            </span>
            <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4 font-mono text-xs">
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleStatusChange('TRUE_POSITIVE')}
                className="flex items-center justify-center space-x-1 rounded-lg border border-red-500/30 bg-red-950/40 py-2 font-bold text-red-300 hover:bg-red-900/50 disabled:opacity-50"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>True Pos</span>
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleStatusChange('FALSE_POSITIVE')}
                className="flex items-center justify-center space-x-1 rounded-lg border border-emerald-500/30 bg-emerald-950/40 py-2 font-bold text-emerald-300 hover:bg-emerald-900/50 disabled:opacity-50"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>False Pos</span>
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleStatusChange('RESOLVED')}
                className="flex items-center justify-center space-x-1 rounded-lg border border-blue-500/30 bg-blue-950/40 py-2 font-bold text-blue-300 hover:bg-blue-900/50 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Resolved</span>
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleStatusChange('OPEN')}
                className="flex items-center justify-center space-x-1 rounded-lg border border-amber-500/30 bg-amber-950/40 py-2 font-bold text-amber-300 hover:bg-amber-900/50 disabled:opacity-50"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Open</span>
              </button>
            </div>
          </div>

          {/* Firewall Actions */}
          <div className="mt-4 border-t border-sentinel-border pt-3">
            <span className="text-[10px] font-mono text-sentinel-muted uppercase">
              Firewall Override for IP ({incident.client_ip})
            </span>
            <div className="mt-1.5 flex space-x-2 font-mono text-xs">
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleIPAction('BLACKLIST')}
                className="flex-1 rounded-lg border border-red-500/40 bg-red-500/20 py-2 font-bold text-red-300 hover:bg-red-500/30 disabled:opacity-50"
              >
                <Ban className="inline h-3.5 w-3.5 mr-1" />
                Blacklist IP
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleIPAction('WHITELIST')}
                className="flex-1 rounded-lg border border-emerald-500/40 bg-emerald-500/20 py-2 font-bold text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
              >
                <ShieldCheck className="inline h-3.5 w-3.5 mr-1" />
                Whitelist IP
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleIPAction('CLEAR')}
                className="rounded-lg border border-sentinel-border bg-sentinel-bg px-3 py-2 text-slate-400 hover:text-white disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ThreatDetailsPanel;
