const SEVERITY = {
  critical: { label: 'CRITICAL', icon: '⚠' },
  warning: { label: 'WARNING', icon: '▲' },
  advisory: { label: 'ADVISORY', icon: '◆' },
  info: { label: 'INFO', icon: 'ℹ' },
};

export default function SeverityBadge({ severity }) {
  const { label, icon } = SEVERITY[severity] ?? SEVERITY.info;
  return (
    <span className={`badge badge--${severity}`}>
      <span aria-hidden="true">{icon}</span> {label}
    </span>
  );
}