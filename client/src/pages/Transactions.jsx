import { useEffect, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import {
  Search,
  Pencil,
  Trash2,
  Pause,
  Play,
  CircleStop,
  ReceiptText,
  FilterX,
  ChevronLeft,
  ChevronRight,
  Repeat,
} from "lucide-react";
import { api } from "../lib/api";
import { useApi } from "../lib/useApi";
import { useAuth } from "../context/auth";
import { useToast } from "../context/toast";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENTS, categoryMeta } from "../lib/categories";
import { formatDate, formatMoney } from "../lib/format";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  Modal,
  Select,
  Skeleton,
} from "../components/ui";
import { Amount, CategoryBadge } from "../components/finance";

const PAGE_SIZE = 15;
const EVERY = { daily: "day", weekly: "week", monthly: "month" };
const ALL_CATEGORIES = [...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])];
const SORT_BUTTON = "inline-flex items-center gap-1 rounded uppercase transition-colors hover:text-ink";
const sortDir = (sort, by) => (sort.startsWith(by) ? (sort.endsWith("asc") ? "ascending" : "descending") : undefined);
const ARROW = { ascending: "↑", descending: "↓" };
const FILTER_KEYS = ["q", "type", "category", "from", "to", "recurring", "sort"];

function RecurringActions({ t, onChange }) {
  if (!t.recurring || t.recurring.status === "cancelled") return null;
  const paused = t.recurring.status === "paused";
  return (
    <>
      <IconButton
        label={paused ? "Resume recurring" : "Pause recurring"}
        onClick={() => onChange(t, paused ? "active" : "paused")}
      >
        {paused ? <Play className="size-4" aria-hidden="true" /> : <Pause className="size-4" aria-hidden="true" />}
      </IconButton>
      <IconButton label="Stop recurring" onClick={() => onChange(t, "cancelled")}>
        <CircleStop className="size-4" aria-hidden="true" />
      </IconButton>
    </>
  );
}

function RecurringBadge({ t }) {
  if (t.recurring) {
    const tone = t.recurring.status === "active" ? "brand" : "neutral";
    const label =
      t.recurring.status === "active"
        ? `Every ${EVERY[t.recurring.frequency]}`
        : t.recurring.status === "paused"
          ? "Paused"
          : "Stopped";
    return (
      <Badge tone={tone}>
        <Repeat className="size-3" aria-hidden="true" /> {label}
      </Badge>
    );
  }
  return t.fromRecurring ? <Badge>Auto</Badge> : null;
}

export default function Transactions() {
  const { openTransaction, version, bump } = useOutletContext();
  const { user } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") || "");
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const page = Number(params.get("page")) || 1;
  const sort = params.get("sort") || "date_desc";

  const update = (patch) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) v ? next.set(k, v) : next.delete(k);
    if (!("page" in patch)) next.delete("page");
    setParams(next, { replace: true });
  };

  useEffect(() => {
    const id = setTimeout(() => (params.get("q") || "") !== search && update({ q: search.trim() }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const query = new URLSearchParams({ page, pageSize: PAGE_SIZE, v: version });
  FILTER_KEYS.forEach((k) => params.get(k) && query.set(k, params.get(k)));
  const { data, error, loading, reload } = useApi(`/api/transactions?${query}`);
  const filtered = FILTER_KEYS.some((k) => params.get(k));
  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const cur = user.currency;

  const changeRecurring = async (t, status) => {
    try {
      await api(`/api/transactions/${t.id}/recurring`, { method: "PATCH", body: { status } });
      toast(status === "active" ? "Recurring resumed" : status === "paused" ? "Recurring paused" : "Recurring stopped");
      reload();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await api(`/api/transactions/${confirm.id}`, { method: "DELETE" });
      toast("Transaction deleted");
      setConfirm(null);
      bump();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setParams({}, { replace: true });
  };

  return (
    <div className="space-y-5">
      <Card as="div" className="p-4">
        <form
          role="search"
          onSubmit={(e) => e.preventDefault()}
          className="grid grid-cols-2 gap-3 lg:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,0.9fr))_repeat(2,minmax(0,1.1fr))_auto]"
        >
          <label className="relative col-span-2 lg:col-span-1">
            <span className="sr-only">Search notes and categories</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes or categories"
              className="pl-9"
            />
          </label>
          <label>
            <span className="sr-only">Type</span>
            <Select value={params.get("type") || ""} onChange={(e) => update({ type: e.target.value })}>
              <option value="">All types</option>
              <option value="expense">Expenses</option>
              <option value="income">Income</option>
            </Select>
          </label>
          <label>
            <span className="sr-only">Category</span>
            <Select value={params.get("category") || ""} onChange={(e) => update({ category: e.target.value })}>
              <option value="">All categories</option>
              {ALL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {categoryMeta(c).label}
                </option>
              ))}
            </Select>
          </label>
          <label className="relative col-span-2 sm:col-span-1">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-medium text-muted">
              From
            </span>
            <Input
              type="date"
              className="pl-12"
              value={params.get("from") || ""}
              max={params.get("to") || undefined}
              onChange={(e) => update({ from: e.target.value })}
              aria-label="From date"
            />
          </label>
          <label className="relative col-span-2 sm:col-span-1">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-medium text-muted">
              To
            </span>
            <Input
              type="date"
              className="pl-9"
              value={params.get("to") || ""}
              min={params.get("from") || undefined}
              onChange={(e) => update({ to: e.target.value })}
              aria-label="To date"
            />
          </label>
          <div className="col-span-2 flex gap-2 lg:col-span-1">
            <Select
              aria-label="Sort"
              value={sort}
              onChange={(e) => update({ sort: e.target.value === "date_desc" ? "" : e.target.value })}
              className="lg:hidden"
            >
              <option value="date_desc">Newest first</option>
              <option value="date_asc">Oldest first</option>
              <option value="amount_desc">Largest first</option>
              <option value="amount_asc">Smallest first</option>
            </Select>
            <Button variant="ghost" disabled={!filtered} onClick={clearFilters}>
              <FilterX className="size-4" aria-hidden="true" /> Clear
            </Button>
          </div>
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="size-4 accent-[var(--brand)]"
              checked={params.get("recurring") === "true"}
              onChange={(e) => update({ recurring: e.target.checked ? "true" : "" })}
            />
            Recurring only
          </label>
          {data && (
            <p className="num" aria-live="polite">
              {data.total} {data.total === 1 ? "transaction" : "transactions"} ·{" "}
              <span className="text-income">+{formatMoney(data.totals.incomeMinor, cur)}</span> ·{" "}
              <span className="text-expense">-{formatMoney(data.totals.expenseMinor, cur)}</span>
            </p>
          )}
        </div>
      </Card>

      <Card as="div" className="overflow-hidden">
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !data ? (
          <div className="space-y-3 p-5" aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-11" />
            ))}
          </div>
        ) : data.items.length === 0 ? (
          filtered ? (
            <EmptyState
              icon={FilterX}
              title="No matches"
              action={
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            >
              Nothing fits these filters. Try a wider date range or another category.
            </EmptyState>
          ) : (
            <EmptyState
              icon={ReceiptText}
              title="No transactions yet"
              action={
                <Button size="sm" onClick={() => openTransaction()}>
                  Add your first one
                </Button>
              }
            >
              Log income and expenses by hand, or scan a receipt.
            </EmptyState>
          )
        ) : (
          <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <table className="hidden w-full text-sm md:table">
              <caption className="sr-only">Transactions</caption>
              <thead className="border-b border-line bg-surface-2/50 text-left text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th scope="col" aria-sort={sortDir(sort, "date")} className="px-5 py-3 font-medium">
                    <button
                      type="button"
                      className={SORT_BUTTON}
                      onClick={() => update({ sort: sort === "date_asc" ? "" : "date_asc" })}
                    >
                      Date <span aria-hidden="true">{ARROW[sortDir(sort, "date")]}</span>
                    </button>
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Description
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Category
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Paid with
                  </th>
                  <th scope="col" aria-sort={sortDir(sort, "amount")} className="px-3 py-3 text-right font-medium">
                    <button
                      type="button"
                      className={SORT_BUTTON}
                      onClick={() => update({ sort: sort === "amount_desc" ? "amount_asc" : "amount_desc" })}
                    >
                      Amount <span aria-hidden="true">{ARROW[sortDir(sort, "amount")]}</span>
                    </button>
                  </th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((t) => (
                  <tr key={t.id} className="border-b border-line transition-colors last:border-0 hover:bg-surface-2/50">
                    <td className="num px-5 py-2.5 whitespace-nowrap text-muted">{formatDate(t.date)}</td>
                    <td className="max-w-xs px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <CategoryBadge category={t.category} />
                        <span className="truncate font-medium">{t.note || categoryMeta(t.category).label}</span>
                        <RecurringBadge t={t} />
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-muted">{categoryMeta(t.category).label}</td>
                    <td className="px-3 py-2.5 text-muted">
                      {PAYMENTS.find((p) => p.value === t.payment)?.label ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <Amount t={t} currency={cur} />
                    </td>
                    <td className="px-5 py-1.5">
                      <div className="flex justify-end">
                        <RecurringActions t={t} onChange={changeRecurring} />
                        <IconButton label="Edit transaction" onClick={() => openTransaction(t)}>
                          <Pencil className="size-4" aria-hidden="true" />
                        </IconButton>
                        <IconButton
                          label="Delete transaction"
                          onClick={() => setConfirm(t)}
                          className="hover:text-expense"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-line md:hidden">
              {data.items.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <CategoryBadge category={t.category} />
                  <button type="button" onClick={() => openTransaction(t)} className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-sm font-medium">
                      {t.note || categoryMeta(t.category).label}
                    </span>
                    <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
                      {formatDate(t.date, { day: "numeric", month: "short" })} · {categoryMeta(t.category).label}
                      <RecurringBadge t={t} />
                    </span>
                  </button>
                  <div className="text-right text-sm">
                    <Amount t={t} currency={cur} />
                  </div>
                  <IconButton label="Delete transaction" onClick={() => setConfirm(t)} className="-mr-2">
                    <Trash2 className="size-4" aria-hidden="true" />
                  </IconButton>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {data && pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between gap-3">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}>
            <ChevronLeft className="size-4" aria-hidden="true" /> Previous
          </Button>
          <p className="num text-sm text-muted">
            Page {page} of {pages}
          </p>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= pages}
            onClick={() => update({ page: String(page + 1) })}
          >
            Next <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </nav>
      )}

      <Modal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title="Delete this transaction?"
        description="This can't be undone. Budgets and reports update right away."
      >
        {confirm && (
          <div className="mb-5 flex items-center gap-3 rounded-xl bg-surface-2 p-3">
            <CategoryBadge category={confirm.category} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{confirm.note || categoryMeta(confirm.category).label}</p>
              <p className="text-xs text-muted">{formatDate(confirm.date)}</p>
            </div>
            <div className="text-sm">
              <Amount t={confirm} currency={cur} />
            </div>
          </div>
        )}
        {confirm?.recurring && (
          <p className="mb-4 text-sm text-muted">Copies it already created stay; no new ones will be made.</p>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setConfirm(null)}>
            Keep it
          </Button>
          <Button variant="danger" loading={deleting} onClick={remove}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
