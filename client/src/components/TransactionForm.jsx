import { useEffect, useRef, useState } from "react";
import { ScanLine, Sparkles } from "lucide-react";
import { api } from "../lib/api";
import { minorToInput, parseToMinor, todayIso } from "../lib/format";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENTS, categoryMeta } from "../lib/categories";
import { useAuth } from "../context/auth";
import { useToast } from "../context/toast";
import { Button, Field, Input, Modal, Select } from "./ui";

const blank = () => ({
  type: "expense",
  amount: "",
  category: "food",
  date: todayIso(),
  payment: "upi",
  note: "",
  recurring: false,
  frequency: "monthly",
  endDate: "",
});

const fromTxn = (t) => ({
  type: t.type,
  amount: minorToInput(t.amountMinor),
  category: t.category,
  date: t.date,
  payment: t.payment || "",
  note: t.note || "",
  recurring: Boolean(t.recurring),
  frequency: t.recurring?.frequency || "monthly",
  endDate: t.recurring?.endDate || "",
});

export default function TransactionForm({ transaction, onClose, onSaved }) {
  const open = transaction !== null;
  const editing = Boolean(transaction?.id);
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setForm(editing ? fromTxn(transaction) : blank());
    setErrors({});
    setScanned(false);
  }, [open, editing, transaction]);

  const set = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "type") next.category = value === "income" ? "salary" : "food";
      return next;
    });
  };

  const categories = form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  async function scan(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) return toast("Image must be under 4 MB", "error");
    const body = new FormData();
    body.append("receipt", file);
    setScanning(true);
    try {
      const { draft } = await api("/api/transactions/scan-receipt", { method: "POST", form: body });
      setForm((f) => ({
        ...f,
        type: draft.type,
        category: draft.category,
        amount: draft.amountMinor ? minorToInput(draft.amountMinor) : f.amount,
        date: draft.date || f.date,
        payment: draft.payment || f.payment,
        note: draft.note || f.note,
      }));
      setScanned(true);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setScanning(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    const amountMinor = parseToMinor(form.amount);
    const next = {};
    if (!amountMinor) next.amount = "Enter an amount above 0 with up to 2 decimals";
    if (!form.date) next.date = "Pick a date";
    if (form.recurring && form.endDate && form.endDate < form.date) next.endDate = "End date must be after the start";
    setErrors(next);
    if (Object.keys(next).length) return;

    const body = {
      type: form.type,
      category: form.category,
      amountMinor,
      date: form.date,
      payment: form.payment || null,
      note: form.note.trim() || null,
      recurring: form.recurring ? { frequency: form.frequency, endDate: form.endDate || null } : null,
    };
    setSaving(true);
    try {
      await api(editing ? `/api/transactions/${transaction.id}` : "/api/transactions", {
        method: editing ? "PUT" : "POST",
        body,
      });
      toast(editing ? "Transaction updated" : "Transaction added");
      onSaved();
    } catch (err) {
      const fieldErrors = Object.fromEntries(
        (err.details || []).map((d) => [d.path.replace("amountMinor", "amount"), d.message]),
      );
      setErrors(fieldErrors);
      if (!err.details) toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit transaction" : "Add transaction"}
      description={editing ? undefined : "Log it by hand or let AI read a receipt photo."}
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {!editing && (
          <div className="rounded-xl border border-dashed border-line bg-surface-2/60 p-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={scan}
              tabIndex={-1}
              aria-hidden="true"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm text-muted">
                <Sparkles className="size-4 text-brand" aria-hidden="true" />
                {scanned
                  ? "Filled from your receipt. Check the details before saving."
                  : "Have a receipt? Scan it to fill the form."}
              </p>
              <Button variant="secondary" size="sm" loading={scanning} onClick={() => fileRef.current?.click()}>
                {!scanning && <ScanLine className="size-4" aria-hidden="true" />}
                {scanning ? "Reading receipt…" : "Scan receipt"}
              </Button>
            </div>
          </div>
        )}

        <fieldset>
          <legend className="sr-only">Type</legend>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1">
            {["expense", "income"].map((t) => (
              <label
                key={t}
                className={`flex h-9 cursor-pointer items-center justify-center rounded-lg text-sm font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand ${
                  form.type === t ? "bg-surface shadow-sm" : "text-muted"
                } ${form.type === t && t === "income" ? "text-income" : ""} ${form.type === t && t === "expense" ? "text-expense" : ""}`}
              >
                <input
                  type="radio"
                  name="type"
                  value={t}
                  checked={form.type === t}
                  onChange={set("type")}
                  className="sr-only"
                />
                {t === "expense" ? "Expense" : "Income"}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`Amount (${user?.currency || "INR"})`} error={errors.amount}>
            {(p) => (
              <Input
                {...p}
                inputMode="decimal"
                autoComplete="off"
                placeholder="0.00"
                value={form.amount}
                onChange={set("amount")}
                className="num"
              />
            )}
          </Field>
          <Field label="Category" error={errors.category}>
            {(p) => (
              <Select {...p} value={form.category} onChange={set("category")}>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {categoryMeta(c).label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Date" error={errors.date}>
            {(p) => <Input {...p} type="date" max={todayIso()} value={form.date} onChange={set("date")} />}
          </Field>
          <Field label="Paid with">
            {(p) => (
              <Select {...p} value={form.payment} onChange={set("payment")}>
                <option value="">Not specified</option>
                {PAYMENTS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        <Field label="Note" error={errors.note} hint="Optional, e.g. merchant or purpose">
          {(p) => (
            <Input {...p} maxLength={280} value={form.note} onChange={set("note")} placeholder="Dinner with team" />
          )}
        </Field>

        <div className="rounded-xl border border-line p-3">
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.recurring}
              onChange={set("recurring")}
              className="size-4 accent-[var(--brand)]"
            />
            Repeats automatically
          </label>
          {form.recurring && (
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field label="Every">
                {(p) => (
                  <Select {...p} value={form.frequency} onChange={set("frequency")}>
                    <option value="daily">Day</option>
                    <option value="weekly">Week</option>
                    <option value="monthly">Month</option>
                  </Select>
                )}
              </Field>
              <Field label="Ends on" hint="Leave empty to keep going" error={errors.endDate}>
                {(p) => <Input {...p} type="date" min={form.date} value={form.endDate} onChange={set("endDate")} />}
              </Field>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {editing ? "Save changes" : "Add transaction"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
