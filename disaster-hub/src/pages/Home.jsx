import { Link } from 'react-router-dom';
import { useHub } from '../context/HubContext.js';
import TopAlertCard from '../components/TopAlertCard.jsx';

export default function Home() {
  const { now, zones, zone, setZone, alertResult } = useHub();
  const { topAlert, verified, unverified, stats } = alertResult;

  return (
    <>
      <h1>Disaster Preparedness Hub</h1>

      <div className="field">
        <label htmlFor="zone">Your area</label>
        <select id="zone" value={zone} onChange={(e) => setZone(e.target.value)}>
          <option value="ALL">All areas</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              Zone {z.id} – {z.name}
            </option>
          ))}
        </select>
      </div>

      <div aria-live="polite">
        <TopAlertCard alert={topAlert} now={now} />
      </div>

      <p className="summary">
        {verified.length} verified {verified.length === 1 ? 'alert' : 'alerts'} ·{' '}
        {unverified.length} unverified {unverified.length === 1 ? 'report' : 'reports'} ·{' '}
        {stats.duplicatesMerged} duplicates merged · {stats.expiredRemoved} expired removed
      </p>

      <nav aria-label="Quick links">
        <ul className="quick-links">
          <li>
            <Link to="/alerts">All alerts</Link>
          </li>
          <li>
            <Link to="/shelters">Find a shelter</Link>
          </li>
          <li>
            <Link to="/checklist">Preparedness checklist</Link>
          </li>
          <li>
            <Link to="/emergency-card">Emergency card</Link>
          </li>
        </ul>
      </nav>
    </>
  );
}