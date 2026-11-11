import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PlayCircle } from "lucide-react";
import { useAuth } from "../context/auth";
import { CURRENCIES } from "../lib/categories";
import { Button, Field, Input, Logo, Select } from "../components/ui";

export default function AuthPage({ mode }) {
  const isLogin = mode === "login";
  const { login, register, demo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: "", email: "", password: "", currency: "INR" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    document.title = `${isLogin ? "Sign in" : "Create account"} · FinSight`;
  }, [isLogin]);

  const go = () => navigate(location.state?.from || "/dashboard", { replace: true });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function run(kind, fn) {
    setBusy(kind);
    setErrors({});
    setFormError("");
    try {
      await fn();
      go();
    } catch (err) {
      setErrors(Object.fromEntries((err.details || []).map((d) => [d.path, d.message])));
      if (!err.details) setFormError(err.message);
    } finally {
      setBusy(null);
    }
  }

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (!isLogin && !form.name.trim()) next.name = "Name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email";
    if (form.password.length < (isLogin ? 1 : 8))
      next.password = isLogin ? "Password is required" : "Use at least 8 characters";
    setErrors(next);
    if (Object.keys(next).length) return;
    run("form", () => (isLogin ? login({ email: form.email, password: form.password }) : register(form)));
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <main className="flex flex-col px-4 py-6 sm:px-10">
        <Link to="/" className="self-start rounded-lg">
          <Logo />
        </Link>
        <div className="mx-auto my-auto w-full max-w-sm py-10">
          <h1 className="font-display text-4xl tracking-tight">{isLogin ? "Welcome back" : "Start tracking"}</h1>
          <p className="mt-2 text-muted">
            {isLogin ? "Sign in to see where your money went." : "Free, private, and set up in under a minute."}
          </p>

          <Button
            variant="secondary"
            size="lg"
            className="mt-8 w-full"
            loading={busy === "demo"}
            onClick={() => run("demo", demo)}
          >
            {busy !== "demo" && <PlayCircle className="size-5 text-brand" aria-hidden="true" />}
            Explore the live demo
          </Button>
          <div className="my-6 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" /> or with email <span className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={submit} noValidate className="space-y-4">
            {formError && (
              <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-expense">
                {formError}
              </p>
            )}
            {!isLogin && (
              <Field label="Name" error={errors.name}>
                {(p) => <Input {...p} autoComplete="name" value={form.name} onChange={set("name")} />}
              </Field>
            )}
            <Field label="Email" error={errors.email}>
              {(p) => <Input {...p} type="email" autoComplete="email" value={form.email} onChange={set("email")} />}
            </Field>
            <Field label="Password" error={errors.password} hint={isLogin ? undefined : "At least 8 characters"}>
              {(p) => (
                <Input
                  {...p}
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  value={form.password}
                  onChange={set("password")}
                />
              )}
            </Field>
            {!isLogin && (
              <Field label="Currency">
                {(p) => (
                  <Select {...p} value={form.currency} onChange={set("currency")}>
                    {CURRENCIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </Select>
                )}
              </Field>
            )}
            <Button type="submit" size="lg" className="w-full" loading={busy === "form"}>
              {isLogin ? "Sign in" : "Create account"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted">
            {isLogin ? "New to FinSight? " : "Already have an account? "}
            <Link to={isLogin ? "/register" : "/login"} className="font-medium text-brand hover:underline">
              {isLogin ? "Create an account" : "Sign in"}
            </Link>
          </p>
        </div>
      </main>
      <aside className="relative hidden overflow-hidden bg-brand lg:block" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgb(255_255_255/0.12),transparent_55%)]" />
        <div className="relative flex h-full flex-col justify-end p-12 text-on-brand">
          <p className="font-display text-5xl leading-tight">
            Know where
            <br />
            the month goes.
          </p>
          <p className="mt-4 max-w-md opacity-80">
            Categories, budgets and AI insights that read your totals and tell you what changed, in plain words.
          </p>
        </div>
      </aside>
    </div>
  );
}
