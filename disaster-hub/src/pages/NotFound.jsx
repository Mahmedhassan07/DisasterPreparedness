import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <>
      <h1>Page not found</h1>
      <p>We could not find that page. It may have moved, or the address may be wrong.</p>
      <p>
        <Link className="button" to="/">
          Go to the Home page
        </Link>
      </p>
    </>
  );
}