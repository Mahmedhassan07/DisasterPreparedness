// "25 min ago" style text, measured against the scenario clock.
export function timeAgo(iso, now) {
  const mins = Math.max(0, Math.round((Date.parse(now) - Date.parse(iso)) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.floor(hours / 24)} d ago`;
}