/**
 * Midnight Sentinel SOC Dashboard - API Client
 * Connects directly to Adaptive Security Gateway Flask backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Health check & hardware telemetry (CUDA GPU, model weights, database status).
 */
export async function fetchHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error(`Failed to fetch health: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Paginated incidents list with filtering, searching, and sorting.
 */
export async function fetchIncidents(params = {}) {
  const url = new URL(`${API_BASE_URL}/api/incidents`);
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "" && val !== "ALL") {
      url.searchParams.append(key, val);
    }
  });

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to fetch incidents: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Detailed single incident forensics.
 */
export async function fetchIncidentById(id) {
  const response = await fetch(`${API_BASE_URL}/api/incidents/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch incident ${id}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Update incident triage status and analyst notes.
 */
export async function updateIncidentStatus(id, { status, notes = "" }) {
  const response = await fetch(`${API_BASE_URL}/api/incidents/${id}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, notes }),
  });
  if (!response.ok) {
    throw new Error(`Failed to update status: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Aggregate threat analytics summary.
 */
export async function fetchAnalyticsSummary() {
  const response = await fetch(`${API_BASE_URL}/api/analytics/summary`);
  if (!response.ok) {
    throw new Error(`Failed to fetch analytics: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Chronological traffic volume & risk trends timeline buckets.
 */
export async function fetchAnalyticsTrends(limit = 12) {
  const response = await fetch(`${API_BASE_URL}/api/analytics/trends?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch trends: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Ranked top offending client IPs.
 */
export async function fetchTopOffenders(limit = 10) {
  const response = await fetch(`${API_BASE_URL}/api/analytics/top-ips?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch top offenders: ${response.statusText}`);
  }
  return response.json();
}

/**
 * List all active analyst IP firewall overrides.
 */
export async function fetchIPOverrides() {
  const response = await fetch(`${API_BASE_URL}/api/policy/override-ip`);
  if (!response.ok) {
    throw new Error(`Failed to fetch IP overrides: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Set or clear analyst IP override (WHITELIST, BLACKLIST, CLEAR).
 */
export async function setIPOverride({ ip, action, reason = "" }) {
  const response = await fetch(`${API_BASE_URL}/api/policy/override-ip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ip, action, reason }),
  });
  if (!response.ok) {
    throw new Error(`Failed to set IP override: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Send interactive attack/payload simulation through full 14-stage security pipeline.
 */
export async function sendPredictSimulation(payloadData) {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payloadData),
  });
  // Note: /predict returns HTTP 403 on BLOCK, 429 on RATE_LIMIT, 200 on ALLOW
  // All return JSON body with diagnosis details
  const data = await response.json().catch(() => null);
  return {
    httpStatus: response.status,
    data: data,
  };
}
