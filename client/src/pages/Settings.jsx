import { useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/auth";
import { useToast } from "../context/toast";
import { CURRENCIES } from "../lib/categories";
import { Button, Card, CardHeader, Field, Input, Select } from "../components/ui";

const fieldErrors = (err) => Object.fromEntries((err.details || []).map((d) => [d.path, d.message]));

export default function Settings() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const isDemo = user.email === "demo@finsight.app";
  const [profile, setProfile] = useState({ name: user.name, email: user.email, currency: user.currency });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(null);
  const profileChanged = ["name", "email", "currency"].some((k) => profile[k] !== user[k]);

  const save = async (kind, body, after) => {
    setBusy(kind);
    setErrors({});
    try {
      const { user: next } = await api("/api/user/me", { method: "PUT", body });
      setUser(next);
      toast(kind === "password" ? "Password changed" : "Settings saved");
      after?.();
    } catch (err) {
      setErrors(fieldErrors(err));
      if (!err.details) toast(err.message, "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card aria-labelledby="profile-title">
        <CardHeader id="profile-title" title="Profile" subtitle="How you appear and which currency amounts use" />
        <form
          className="space-y-4 p-5"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            save("profile", profile);
          }}
        >
          <Field label="Name" error={errors.name}>
            {(p) => (
              <Input
                {...p}
                autoComplete="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            )}
          </Field>
          <Field
            label="Email"
            error={errors.email}
            hint={isDemo ? "The demo account's email can't be changed." : undefined}
          >
            {(p) => (
              <Input
                {...p}
                type="email"
                autoComplete="email"
                disabled={isDemo}
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            )}
          </Field>
          <Field label="Currency" hint="Changes the symbol only; stored amounts are not converted.">
            {(p) => (
              <Select
                {...p}
                value={profile.currency}
                onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
              >
                {CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            )}
          </Field>
          <div className="flex justify-end">
            <Button type="submit" loading={busy === "profile"} disabled={!profileChanged}>
              Save profile
            </Button>
          </div>
        </form>
      </Card>

      <Card aria-labelledby="alerts-title">
        <CardHeader id="alerts-title" title="Alerts" />
        <div className="flex items-start justify-between gap-4 p-5">
          <div>
            <p id="alerts-label" className="text-sm font-medium">
              Budget alerts
            </p>
            <p className="text-sm text-muted">Notify me at 80% of a budget and when I go over.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={user.budgetAlerts}
            aria-labelledby="alerts-label"
            disabled={busy === "alerts"}
            onClick={() => save("alerts", { budgetAlerts: !user.budgetAlerts })}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-150 ${user.budgetAlerts ? "bg-brand" : "bg-line"}`}
          >
            <span
              className={`absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform duration-150 ${user.budgetAlerts ? "translate-x-5" : ""}`}
            />
          </button>
        </div>
      </Card>

      {!isDemo && (
        <Card aria-labelledby="pw-title">
          <CardHeader id="pw-title" title="Password" />
          <form
            className="space-y-4 p-5"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              save("password", pw, () => setPw({ currentPassword: "", newPassword: "" }));
            }}
          >
            <Field label="Current password" error={errors.currentPassword}>
              {(p) => (
                <Input
                  {...p}
                  type="password"
                  autoComplete="current-password"
                  value={pw.currentPassword}
                  onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
                />
              )}
            </Field>
            <Field label="New password" hint="At least 8 characters" error={errors.newPassword}>
              {(p) => (
                <Input
                  {...p}
                  type="password"
                  autoComplete="new-password"
                  value={pw.newPassword}
                  onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
                />
              )}
            </Field>
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="secondary"
                loading={busy === "password"}
                disabled={!pw.currentPassword || !pw.newPassword}
              >
                Change password
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
