import { Link } from "react-router-dom";
import { buttonClass, Logo } from "../components/ui";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <Logo />
        <p className="num mt-10 font-display text-7xl text-brand">404</p>
        <h1 className="mt-2 text-xl font-semibold">This page isn't in the ledger</h1>
        <p className="mt-1 text-muted">The link may be old or mistyped.</p>
        <Link to="/" className={`${buttonClass()} mt-6`}>
          Back to home
        </Link>
      </div>
    </main>
  );
}
