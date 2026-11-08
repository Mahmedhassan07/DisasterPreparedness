import { Outlet } from 'react-router-dom';
import NavBar from './Navbar.js';

export default function Layout() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <div className="sim-banner" role="note">
        Practice scenario with fictional data. This is not a real emergency system.
      </div>
      <header className="site-header">
        <p className="site-title">Rivermoor Preparedness Hub</p>
        <NavBar />
      </header>
      <main id="main-content" tabIndex={-1} className="container">
        <Outlet />
      </main>
    </>
  );
}