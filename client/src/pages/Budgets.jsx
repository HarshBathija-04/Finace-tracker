import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Trash2, PiggyBank, Target } from "lucide-react";
import { api } from "../lib/api";
import { useApi } from "../lib/useApi";
import { useAuth } from "../context/auth";
import { useToast } from "../context/toast";
import { EXPENSE_CATEGORIES, categoryMeta } from "../lib/categories";
import { formatMoney, minorToInput, parseToMinor, periodLabel } from "../lib/format";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  Input,
  ProgressBar,
  Select,
  Skeleton,
} from "../components/ui";
import { BudgetRow, CategoryBadge } from "../components/finance";

const toForm = (b) => ({
  limit: b ? minorToInput(b.limitMinor) : "",
  target: b?.targetSavingsMinor ? minorToInput(b.targetSavingsMinor) : "",
  categories: (b?.categories || []).map((c) => ({ category: c.category, limit: minorToInput(c.limitMinor) })),
});

export default function Budgets() {
  const { period, version, bump } = useOutletContext();
  const { user } = useAuth();
  const toast = useToast();
  const path = `/api/budgets/${period.year}/${period.month}`;
  const { data, error, reload } = useApi(`${path}?v=${version}`);
  const [form, setForm] = useState(toForm(null));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const budget = data?.budget;
  const cur = user.currency;

  useEffect(() => {
    if (data) setForm(toForm(data.budget));
    setConfirmRemove(false);
  }, [data]);

  const unused = EXPENSE_CATEGORIES.filter((c) => !form.categories.some((x) => x.category === c));
  const setCat = (i, patch) =>
    setForm((f) => ({ ...f, categories: f.categories.map((c, j) => (j === i ? { ...c, ...patch } : c)) }));

  async function save(e) {
    e.preventDefault();
    const next = {};
    const limitMinor = form.limit === "" ? 0 : parseToMinor(form.limit);
    const targetMinor = form.target === "" ? 0 : parseToMinor(form.target);
    if (limitMinor === null) next.limit = "Enter a valid amount";
    if (targetMinor === null) next.target = "Enter a valid amount";
    const categories = form.categories.map((c, i) => {
      const m = parseToMinor(c.limit);
      if (!m) next[`cat${i}`] = "Enter a limit above 0";
      return { category: c.category, limitMinor: m };
    });
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      await api(path, { method: "PUT", body: { limitMinor, targetSavingsMinor: targetMinor, categories } });
      toast(`Budget saved for ${periodLabel(period)}`);
      bump();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    try {
      await api(path, { method: "DELETE" });
      toast("Budget removed");
      bump();
    } catch (err) {
      toast(err.message, "error");
    }
  }

  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-2" aria-labelledby="progress-title">
        <CardHeader id="progress-title" title="This month so far" subtitle={periodLabel(period)} />
        <div className="space-y-5 p-5">
          {!data ? (
            [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-8" />)
          ) : !budget ? (
            <EmptyState icon={PiggyBank} title="No budget set">
              Set an overall limit and per-category caps. You'll get an alert at 80% and when you go over.
            </EmptyState>
          ) : (
            <>
              <div>
                <p className="text-sm text-muted">Left to spend</p>
                <p
                  className={`num font-display text-4xl ${budget.limitMinor - budget.spentMinor < 0 ? "text-expense" : ""}`}
                >
                  {formatMoney(budget.limitMinor - budget.spentMinor, cur)}
                </p>
              </div>
              <BudgetRow label="Overall" currency={cur} {...budget} />
              {budget.targetSavingsMinor > 0 && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      <Target className="size-4 text-brand" aria-hidden="true" /> Savings goal
                      {budget.savedMinor >= budget.targetSavingsMinor && <Badge tone="brand">Reached</Badge>}
                    </span>
                    <span className="num text-muted">
                      <span className="text-ink">
                        {formatMoney(Math.max(0, budget.savedMinor), cur, { compact: true })}
                      </span>{" "}
                      / {formatMoney(budget.targetSavingsMinor, cur, { compact: true })}
                    </span>
                  </div>
                  <ProgressBar
                    percent={Math.max(0, (budget.savedMinor / budget.targetSavingsMinor) * 100)}
                    label="Savings goal progress"
                  />
                </div>
              )}
              <div className="space-y-4 border-t border-line pt-5">
                {budget.categories.length === 0 && <p className="text-sm text-muted">No category limits yet.</p>}
                {budget.categories.map((c) => (
                  <BudgetRow key={c.category} label={categoryMeta(c.category).label} currency={cur} {...c} />
                ))}
              </div>
            </>
          )}
        </div>
      </Card>

      <Card className="lg:col-span-3" aria-labelledby="edit-title">
        <CardHeader id="edit-title" title={budget ? "Edit budget" : "Create budget"} subtitle={`Amounts in ${cur}`} />
        <form onSubmit={save} noValidate className="space-y-5 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Monthly spending limit" error={errors.limit}>
              {(p) => (
                <Input
                  {...p}
                  inputMode="decimal"
                  className="num"
                  placeholder="60000"
                  value={form.limit}
                  onChange={(e) => setForm({ ...form, limit: e.target.value })}
                />
              )}
            </Field>
            <Field label="Savings goal" hint="Optional" error={errors.target}>
              {(p) => (
                <Input
                  {...p}
                  inputMode="decimal"
                  className="num"
                  placeholder="20000"
                  value={form.target}
                  onChange={(e) => setForm({ ...form, target: e.target.value })}
                />
              )}
            </Field>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">Category limits</legend>
            <ul className="space-y-2">
              {form.categories.map((c, i) => (
                <li key={c.category} className="flex items-start gap-2">
                  <CategoryBadge category={c.category} />
                  <div className="min-w-0 flex-1">
                    <label className="sr-only" htmlFor={`cat-${c.category}`}>
                      {categoryMeta(c.category).label} limit
                    </label>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                      <span aria-hidden="true" className="truncate text-sm sm:w-36 sm:shrink-0">
                        {categoryMeta(c.category).label}
                      </span>
                      <Input
                        id={`cat-${c.category}`}
                        inputMode="decimal"
                        className="num"
                        placeholder={categoryMeta(c.category).label}
                        value={c.limit}
                        aria-invalid={errors[`cat${i}`] ? true : undefined}
                        onChange={(e) => setCat(i, { limit: e.target.value })}
                      />
                    </div>
                    {errors[`cat${i}`] && <p className="mt-1 text-sm text-expense">{errors[`cat${i}`]}</p>}
                  </div>
                  <IconButton
                    label={`Remove ${categoryMeta(c.category).label} limit`}
                    onClick={() => setForm((f) => ({ ...f, categories: f.categories.filter((_, j) => j !== i) }))}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </IconButton>
                </li>
              ))}
            </ul>
            {unused.length > 0 && (
              <div className="mt-3 flex gap-2">
                <Select
                  aria-label="Add a category limit"
                  value=""
                  onChange={(e) =>
                    e.target.value &&
                    setForm((f) => ({ ...f, categories: [...f.categories, { category: e.target.value, limit: "" }] }))
                  }
                  className="max-w-xs"
                >
                  <option value="">+ Add a category limit</option>
                  {unused.map((c) => (
                    <option key={c} value={c}>
                      {categoryMeta(c).label}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </fieldset>

          <div className="flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
            {budget ? (
              confirmRemove ? (
                <div className="flex items-center gap-2">
                  <Button variant="danger" size="sm" onClick={remove}>
                    Yes, remove budget
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(true)} className="hover:text-expense">
                  <Trash2 className="size-4" aria-hidden="true" /> Remove budget
                </Button>
              )
            ) : (
              <span />
            )}
            <Button type="submit" loading={saving} disabled={!data}>
              {budget ? "Save budget" : "Create budget"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
