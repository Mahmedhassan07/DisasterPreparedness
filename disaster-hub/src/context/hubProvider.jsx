import { useMemo, useState } from 'react';
import { HubContext } from './HubContext.js';
import { prioritiseAlerts, filterByZone } from '../engine/alertEngine.js';
import alerts from '../data/alerts.json';
import shelters from '../data/shelters.json';
import supplies from '../data/supplies.json';
import checklist from '../data/checklist.json';
import meta from '../data/meta.json';

// Fixed scenario clock, so the practice scenario always looks the same.
const NOW = meta.scenarioNow;

export function HubProvider({ children }) {
  const [zone, setZone] = useState('ALL');

  const alertResult = useMemo(
    () => prioritiseAlerts(filterByZone(alerts, zone), NOW),
    [zone]
  );

  const value = useMemo(
    () => ({
      now: NOW,
      zones: meta.zones,
      zone,
      setZone,
      alertResult,
      shelters,
      supplies,
      checklist,
    }),
    [zone, alertResult]
  );

  return <HubContext.Provider value={value}>{children}</HubContext.Provider>;
}