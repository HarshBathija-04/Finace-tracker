import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { CloudOff } from "lucide-react";
import { AuthProvider, useAuth } from "./context/auth";
import { ToastProvider } from "./context/toast";
import { onSlowChange } from "./lib/api";
import { Button, Skeleton } from "./components/ui";
import AppShell from "./components/AppShell";
import Landing from "./pages/Landing";
import AuthPage from "./pages/AuthPage";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Budgets = lazy(() => import("./pages/Budgets"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

function WakeBanner() {
  const [slow, setSlow] = useState(false);
  useEffect(() => onSlowChange(setSlow), []);
  if (!slow) return null;
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3">
      <div className="rise flex items-center gap-3 rounded-full border border-line bg-surface px-4 py-2 text-sm shadow-pop">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-warn opacity-60" />
          <span className="relative inline-flex size-2.5 rounded-full bg-warn" />
        </span>
        Waking up the server. The free tier sleeps when idle, so this can take up to a minute.
      </div>
    </div>
  );
}

function PageFallback() {
  return (
    <div className="space-y-4 p-1" aria-busy="true" aria-label="Loading page">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}

function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === "checking") {
    return (
      <div className="grid min-h-dvh place-items-center text-muted" aria-busy="true">
        Loading your workspace...
      </div>
    );
  }
  if (status === "offline") {
    return (
      <div className="grid min-h-dvh place-items-center px-6 text-center">
        <div>
          <CloudOff className="mx-auto mb-3 size-8 text-muted" aria-hidden="true" />
          <h1 className="text-lg font-semibold">We can't reach the server</h1>
          <p className="mt-1 text-muted">It may still be starting up. Give it a moment and retry.</p>
          <Button className="mt-5" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }
  if (status !== "authenticated") return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

function GuestOnly({ children }) {
  const { status } = useAuth();
  return status === "authenticated" ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <WakeBanner />
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route
                path="/login"
                element={
                  <GuestOnly>
                    <AuthPage mode="login" />
                  </GuestOnly>
                }
              />
              <Route
                path="/register"
                element={
                  <GuestOnly>
                    <AuthPage mode="register" />
                  </GuestOnly>
                }
              />
              <Route
                element={
                  <RequireAuth>
                    <AppShell fallback={<PageFallback />} />
                  </RequireAuth>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/budgets" element={<Budgets />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
