// src/engine/alertEngine.js
// Pure functions: no React, no side effects. Easy to test.

export const SEVERITY_RANK = { info: 0, advisory: 1, warning: 2, critical: 3 };
export const NEW_WINDOW_MINUTES = 30;

// Accepts an ISO string, a Date, or a number of milliseconds.
const toMs = (t) =>
  t instanceof Date ? t.getTime() : typeof t === 'number' ? t : Date.parse(t);

/** True when the alert's expiry time has been reached. */
export function isExpired(alert, now) {
  return toMs(alert.expiresAt) <= toMs(now);
}

/** Returns only the alerts that are still active. */
export function removeExpired(alerts, now) {
  return alerts.filter((a) => !isExpired(a, now));
}

/** 'expired' | 'new' (issued in the last 30 min) | 'active' */
export function getAlertStatus(alert, now) {
  if (isExpired(alert, now)) return 'expired';
  const ageMinutes = (toMs(now) - toMs(alert.issuedAt)) / 60000;
  return ageMinutes <= NEW_WINDOW_MINUTES ? 'new' : 'active';
}

/** Sort order: severity (high first), then newest first, then id. */
export function compareAlerts(a, b) {
  const bySeverity = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
  if (bySeverity !== 0) return bySeverity;
  const byTime = toMs(b.issuedAt) - toMs(a.issuedAt);
  if (byTime !== 0) return byTime;
  return a.id.localeCompare(b.id);
}

/**
 * Merges reports about the same incident (same incidentKey) into one alert.
 * Rule: if any report is verified, ONLY verified reports decide the severity,
 * so an exaggerated rumour can never override an official alert.
 */
export function mergeDuplicates(alerts) {
  const groups = new Map();
  for (const alert of alerts) {
    const key = alert.incidentKey ?? alert.id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(alert);
  }

  return [...groups.values()].map((group) => {
    const verifiedReports = group.filter((a) => a.verified);
    const pool = verifiedReports.length > 0 ? verifiedReports : group;
    const best = [...pool].sort(compareAlerts)[0];
    const latest = Math.max(...group.map((a) => toMs(a.issuedAt)));

    return {
      ...best,
      reportCount: group.length,
      sources: [...new Set(group.map((a) => a.source))],
      latestIssuedAt: new Date(latest).toISOString(),
    };
  });
}

/** Keeps alerts for one zone. 'ALL' (or nothing) keeps everything. */
export function filterByZone(alerts, zone) {
  if (!zone || zone === 'ALL') return alerts;
  return alerts.filter((a) => a.zone === zone);
}

/**
 * The main function the UI will call.
 * raw reports -> remove expired -> merge duplicates -> label -> rank -> split.
 */
export function prioritiseAlerts(alerts, now) {
  const active = removeExpired(alerts, now);
  const merged = mergeDuplicates(active);
  const labelled = merged.map((a) => ({ ...a, status: getAlertStatus(a, now) }));

  const verified = labelled.filter((a) => a.verified).sort(compareAlerts);
  const unverified = labelled.filter((a) => !a.verified).sort(compareAlerts);

  return {
    verified,
    unverified,
    topAlert: verified[0] ?? null, // the "what to do now" alert
    stats: {
      received: alerts.length,
      expiredRemoved: alerts.length - active.length,
      duplicatesMerged: active.length - merged.length,
      shown: merged.length,
    },
  };
}