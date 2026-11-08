// src/engine/alertEngine.test.js
import { describe, it, expect } from 'vitest';
import {
  isExpired,
  removeExpired,
  getAlertStatus,
  compareAlerts,
  mergeDuplicates,
  prioritiseAlerts,
  filterByZone,
} from './alertEngine.js';
import alertsData from '../data/alerts.json';
import meta from '../data/meta.json';

const NOW = '2026-11-08T08:00:00.000Z';
const minutesAgo = (m) => new Date(Date.parse(NOW) - m * 60000).toISOString();
const minutesFromNow = (m) => new Date(Date.parse(NOW) + m * 60000).toISOString();

function makeAlert(overrides = {}) {
  return {
    id: 'AL-001',
    incidentKey: 'flood-A-01',
    hazard: 'Flood',
    severity: 'warning',
    title: 'Flood: test alert',
    message: 'Test message',
    action: 'Do something',
    zone: 'A',
    source: 'Rivermoor Emergency Office',
    verified: true,
    issuedAt: minutesAgo(60),
    expiresAt: minutesFromNow(60),
    ...overrides,
  };
}

describe('expiry', () => {
  it('marks an alert as expired when its expiry time has passed', () => {
    expect(isExpired(makeAlert({ expiresAt: minutesAgo(5) }), NOW)).toBe(true);
  });

  it('keeps an alert that has not expired yet', () => {
    expect(isExpired(makeAlert({ expiresAt: minutesFromNow(5) }), NOW)).toBe(false);
  });

  it('treats an alert expiring exactly now as expired', () => {
    expect(isExpired(makeAlert({ expiresAt: NOW }), NOW)).toBe(true);
  });

  it('removeExpired keeps only active alerts', () => {
    const list = [
      makeAlert({ id: 'AL-001', expiresAt: minutesAgo(1) }),
      makeAlert({ id: 'AL-002', expiresAt: minutesFromNow(30) }),
    ];
    const result = removeExpired(list, NOW);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('AL-002');
  });
});

describe('alert status', () => {
  it('is "new" when issued within the last 30 minutes', () => {
    expect(getAlertStatus(makeAlert({ issuedAt: minutesAgo(10) }), NOW)).toBe('new');
  });

  it('is "active" when older than 30 minutes and not expired', () => {
    expect(getAlertStatus(makeAlert({ issuedAt: minutesAgo(120) }), NOW)).toBe('active');
  });

  it('is "expired" after the expiry time', () => {
    expect(getAlertStatus(makeAlert({ expiresAt: minutesAgo(1) }), NOW)).toBe('expired');
  });
});

describe('duplicate merging', () => {
  it('merges reports with the same incidentKey into one alert', () => {
    const list = [
      makeAlert({ id: 'AL-001' }),
      makeAlert({ id: 'AL-002', source: 'Resident report', verified: false }),
      makeAlert({ id: 'AL-003', incidentKey: 'fire-B-02' }),
    ];
    expect(mergeDuplicates(list)).toHaveLength(2);
  });

  it('lets a verified report beat an exaggerated unverified one', () => {
    const list = [
      makeAlert({ id: 'AL-001', severity: 'warning', verified: true }),
      makeAlert({ id: 'AL-002', severity: 'critical', verified: false, source: 'Social media post' }),
    ];
    const [merged] = mergeDuplicates(list);
    expect(merged.severity).toBe('warning');
    expect(merged.verified).toBe(true);
  });

  it('stays unverified when no report is verified', () => {
    const list = [
      makeAlert({ id: 'AL-001', verified: false, source: 'Resident report' }),
      makeAlert({ id: 'AL-002', verified: false, source: 'Community group chat' }),
    ];
    const [merged] = mergeDuplicates(list);
    expect(merged.verified).toBe(false);
  });

  it('counts reports and lists each source once', () => {
    const list = [
      makeAlert({ id: 'AL-001', source: 'Rivermoor Police' }),
      makeAlert({ id: 'AL-002', source: 'Rivermoor Police' }),
      makeAlert({ id: 'AL-003', source: 'Rivermoor Weather Service' }),
    ];
    const [merged] = mergeDuplicates(list);
    expect(merged.reportCount).toBe(3);
    expect(merged.sources).toEqual(['Rivermoor Police', 'Rivermoor Weather Service']);
  });
});

describe('ranking', () => {
  it('puts critical before warning', () => {
    const warning = makeAlert({ id: 'AL-001', severity: 'warning' });
    const critical = makeAlert({ id: 'AL-002', severity: 'critical' });
    expect([warning, critical].sort(compareAlerts)[0]).toBe(critical);
  });

  it('puts the newer alert first when severity is equal', () => {
    const older = makeAlert({ id: 'AL-001', issuedAt: minutesAgo(50) });
    const newer = makeAlert({ id: 'AL-002', issuedAt: minutesAgo(5) });
    expect([older, newer].sort(compareAlerts)[0]).toBe(newer);
  });
});

describe('prioritiseAlerts', () => {
  it('separates verified and unverified alerts', () => {
    const list = [
      makeAlert({ id: 'AL-001', incidentKey: 'k1', verified: true }),
      makeAlert({ id: 'AL-002', incidentKey: 'k2', verified: false, source: 'Resident report' }),
    ];
    const result = prioritiseAlerts(list, NOW);
    expect(result.verified).toHaveLength(1);
    expect(result.unverified).toHaveLength(1);
  });

  it('never shows expired alerts', () => {
    const list = [makeAlert({ expiresAt: minutesAgo(10) })];
    const result = prioritiseAlerts(list, NOW);
    expect(result.verified).toHaveLength(0);
    expect(result.unverified).toHaveLength(0);
  });

  it('chooses the top alert from verified alerts only', () => {
    const list = [
      makeAlert({ id: 'AL-001', incidentKey: 'official', severity: 'warning', verified: true }),
      makeAlert({
        id: 'AL-002',
        incidentKey: 'rumour',
        severity: 'critical',
        verified: false,
        source: 'Social media post',
      }),
    ];
    expect(prioritiseAlerts(list, NOW).topAlert.incidentKey).toBe('official');
  });

  it('returns null as top alert when nothing is verified', () => {
    const list = [makeAlert({ verified: false, source: 'Resident report' })];
    expect(prioritiseAlerts(list, NOW).topAlert).toBeNull();
  });

  it('reports correct statistics', () => {
    const list = [
      makeAlert({ id: 'AL-001', incidentKey: 'old', expiresAt: minutesAgo(5) }),
      makeAlert({ id: 'AL-002', incidentKey: 'dup' }),
      makeAlert({ id: 'AL-003', incidentKey: 'dup' }),
      makeAlert({ id: 'AL-004', incidentKey: 'single' }),
    ];
    expect(prioritiseAlerts(list, NOW).stats).toEqual({
      received: 4,
      expiredRemoved: 1,
      duplicatesMerged: 1,
      shown: 2,
    });
  });
});

describe('filtering and safety', () => {
  it('keeps only alerts from the chosen zone', () => {
    const list = [makeAlert({ id: 'AL-001', zone: 'A' }), makeAlert({ id: 'AL-002', zone: 'B' })];
    const result = filterByZone(list, 'B');
    expect(result).toHaveLength(1);
    expect(result[0].zone).toBe('B');
  });

  it('keeps everything when the zone is ALL', () => {
    const list = [makeAlert({ id: 'AL-001', zone: 'A' }), makeAlert({ id: 'AL-002', zone: 'B' })];
    expect(filterByZone(list, 'ALL')).toHaveLength(2);
  });

  it('does not change the original data', () => {
    const list = [
      makeAlert({ id: 'AL-001' }),
      makeAlert({ id: 'AL-002', severity: 'critical', verified: false }),
    ];
    const before = JSON.stringify(list);
    prioritiseAlerts(list, NOW);
    expect(JSON.stringify(list)).toBe(before);
  });
});

describe('generated scenario data', () => {
  it('produces no expired alerts and one entry per incident', () => {
    const result = prioritiseAlerts(alertsData, meta.scenarioNow);
    const all = [...result.verified, ...result.unverified];
    const keys = all.map((a) => a.incidentKey);

    expect(all.length).toBeGreaterThan(0);
    expect(all.every((a) => !isExpired(a, meta.scenarioNow))).toBe(true);
    expect(new Set(keys).size).toBe(keys.length);
  });
});