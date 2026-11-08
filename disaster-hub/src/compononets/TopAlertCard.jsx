import SeverityBadge from './SeverityBadge.jsx';
import { timeAgo } from '../utils/time.js';

export default function TopAlertCard({ alert, now }) {
  if (!alert) {
    return (
      <section className="now-card now-card--calm" aria-labelledby="now-title">
        <h2 id="now-title">No verified alerts for your area</h2>
        <p>Nothing official needs action right now. Use this time to get prepared.</p>
      </section>
    );
  }

  return (
    <section className={`now-card now-card--${alert.severity}`} aria-labelledby="now-title">
      <p className="now-card__label">What to do now</p>
      <SeverityBadge severity={alert.severity} />
      <h2 id="now-title">{alert.title}</h2>
      <p className="now-card__message">{alert.message}</p>
      <p className="now-card__action">
        <strong>Do this:</strong> {alert.action}
      </p>
      <p className="now-card__meta">
        <span className="verified">✔ Verified</span> · {alert.source} · issued{' '}
        {timeAgo(alert.issuedAt, now)} · {alert.reportCount}{' '}
        {alert.reportCount === 1 ? 'report' : 'reports'}
      </p>
    </section>
  );
}