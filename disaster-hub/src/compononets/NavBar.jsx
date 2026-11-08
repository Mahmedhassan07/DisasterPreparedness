import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/alerts', label: 'Alerts' },
  { to: '/shelters', label: 'Shelters' },
  { to: '/checklist', label: 'Checklist' },
  { to: '/plan', label: 'Household plan' },
  { to: '/supplies', label: 'Supplies' },
  { to: '/emergency-card', label: 'Emergency card' },
];

export default function NavBar() {
  return (
    <nav aria-label="Main">
      <ul className="nav-list">
        {LINKS.map((l) => (
          <li key={l.to}>
            <NavLink to={l.to} end={l.end} className="nav-link">
              {l.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}