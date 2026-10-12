import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import NetworkBanner from './components/NetworkBanner';
import OverviewWidgets from './components/OverviewWidgets';
import AnalyticsGraphs from './components/AnalyticsGraphs';
import TopOffendersBar from './components/TopOffendersBar';
import LiveLogFeed from './components/LiveLogFeed';
import ThreatDetailsPanel from './components/ThreatDetailsPanel';
import PayloadSimulatorModal from './components/PayloadSimulatorModal';
import {
  fetchHealth,
  fetchIncidents,
  fetchAnalyticsSummary,
  fetchAnalyticsTrends,
  fetchTopOffenders,
  updateIncidentStatus,
  setIPOverride,
} from './api/client';

export function App() {
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [incidents, setIncidents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [trends, setTrends] = useState([]);
  const [topOffenders, setTopOffenders] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isPolling, setIsPolling] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    verdict: 'ALL',
    attack_type: 'ALL',
    status: 'ALL',
    search: '',
  });

  // Health check
  const checkHealth = useCallback(async () => {
    try {
      setHealthLoading(true);
      const data = await fetchHealth();
      setHealth(data);
    } catch {
      setHealth({ status: 'offline', service: 'adaptive-security-gateway' });
    } finally {
      setHealthLoading(false);
    }
  }, []);

  // Fetch telemetry & incident feed
  const loadDashboardData = useCallback(async () => {
    try {
      const [incRes, anaRes, trendRes, offRes] = await Promise.allSettled([
        fetchIncidents({
          verdict: filters.verdict !== 'ALL' ? filters.verdict : undefined,
          attack_type: filters.attack_type !== 'ALL' ? filters.attack_type : undefined,
          status: filters.status !== 'ALL' ? filters.status : undefined,
          search: filters.search || undefined,
          limit: 100,
        }),
        fetchAnalyticsSummary(),
        fetchAnalyticsTrends(12),
        fetchTopOffenders(5),
      ]);

      if (incRes.status === 'fulfilled') {
        const items = incRes.value?.data?.items || incRes.value?.data || [];
        setIncidents(items);
        setError(null);
      } else {
        setError(incRes.reason?.message || 'Error fetching incident feed');
      }

      if (anaRes.status === 'fulfilled') {
        setAnalytics(anaRes.value?.data || null);
      }

      if (trendRes.status === 'fulfilled') {
        setTrends(trendRes.value?.data || []);
      }

      if (offRes.status === 'fulfilled') {
        setTopOffenders(offRes.value?.data || []);
      }

      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Initial load
  useEffect(() => {
    checkHealth();
    loadDashboardData();
  }, [checkHealth, loadDashboardData]);

  // Health poll interval (10s)
  useEffect(() => {
    const healthInterval = setInterval(checkHealth, 10000);
    return () => clearInterval(healthInterval);
  }, [checkHealth]);

  // Real-time incident stream polling loop (3s)
  useEffect(() => {
    if (!isPolling) return;
    const interval = setInterval(() => {
      loadDashboardData();
    }, 3000);
    return () => clearInterval(interval);
  }, [isPolling, loadDashboardData]);

  // Handle Triage Update
  const handleStatusUpdate = async (incidentId, status, notes) => {
    const updated = await updateIncidentStatus(incidentId, { status, notes });
    // Update local state
    setIncidents((prev) =>
      prev.map((i) => (i.id === incidentId ? { ...i, status, analyst_notes: notes } : i))
    );
    if (selectedIncident?.id === incidentId) {
      setSelectedIncident((prev) => ({ ...prev, status, analyst_notes: notes }));
    }
    // Refresh analytics
    fetchAnalyticsSummary().then((r) => setAnalytics(r.data));
    return updated;
  };

  // Handle IP Override (Firewall block/whitelist)
  const handleIPOverride = async (ip, action, reason) => {
    const res = await setIPOverride({ ip, action, reason });
    fetchAnalyticsSummary().then((r) => setAnalytics(r.data));
    loadDashboardData();
    return res;
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 cyber-grid-pattern selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top SOC Navbar */}
      <Navbar
        health={health}
        healthLoading={healthLoading}
        onRefreshHealth={() => {
          checkHealth();
          loadDashboardData();
        }}
        isPolling={isPolling}
        onTogglePolling={() => setIsPolling((prev) => !prev)}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        lastUpdated={lastUpdated}
      />

      {/* Main SOC Dashboard Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Error Notification Banner if backend is offline */}
        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-500/40 bg-red-950/60 p-4 text-xs font-mono text-red-300 shadow-glow-red">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-red-400 animate-ping" />
              <span>GATEWAY CONNECTION ADVISORY: {error}</span>
            </div>
            <button
              type="button"
              onClick={loadDashboardData}
              className="rounded bg-red-500/20 px-2 py-1 text-[11px] font-bold text-red-200 hover:bg-red-500/30"
            >
              Retry
            </button>
          </div>
        )}

        {/* Network Header Banner */}
        <NetworkBanner
          analytics={analytics}
          incidentsCount={incidents.length}
          lastUpdated={lastUpdated}
        />

        {/* Overview KPI Widgets */}
        <OverviewWidgets analytics={analytics} incidents={incidents} />

        {/* Top Adversary IPs Bar */}
        <TopOffendersBar
          topOffenders={topOffenders}
          onIPOverride={handleIPOverride}
        />

        {/* Analytics Visualizations: Time-series Volume vs. Risk + Verdict Donut */}
        <AnalyticsGraphs
          trends={trends}
          analytics={analytics}
          incidents={incidents}
        />

        {/* Live Security Log Feed */}
        <LiveLogFeed
          incidents={incidents}
          onSelectIncident={setSelectedIncident}
          selectedIncident={selectedIncident}
          filters={filters}
          onFilterChange={setFilters}
          isLoading={isLoading}
        />
      </main>

      {/* Sliding Forensic Threat Details Drawer */}
      {selectedIncident && (
        <ThreatDetailsPanel
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onStatusUpdate={handleStatusUpdate}
          onIPOverride={handleIPOverride}
        />
      )}

      {/* Live Attack Simulator Modal */}
      <PayloadSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onSimulationSuccess={() => {
          loadDashboardData();
        }}
      />
    </div>
  );
}

export default App;
