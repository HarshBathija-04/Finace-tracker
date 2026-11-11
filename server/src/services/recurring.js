import { query } from "../db.js";

const MAX_PER_RUN = 366;

const parse = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
};
const fmt = (y, m, d) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const daysIn = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/**
 * The occurrence after `iso`. Monthly keeps the template's day of month (`anchorDay`),
 * clamped to short months, so a template on the 31st lands on Feb 28/29 and back on Mar 31.
 */
export function nextOccurrence(iso, frequency, anchorDay) {
  const { y, m, d } = parse(iso);
  if (frequency === "monthly") {
    const [ny, nm] = m === 12 ? [y + 1, 1] : [y, m + 1];
    return fmt(ny, nm, Math.min(anchorDay ?? d, daysIn(ny, nm)));
  }
  const next = new Date(Date.UTC(y, m - 1, d + (frequency === "weekly" ? 7 : 1)));
  return next.toISOString().slice(0, 10);
}

/** Dates strictly after `lastRun` up to and including `today` (and `endDate` if set). */
export function dueDates({ lastRun, frequency, anchorDay, today, endDate }) {
  const out = [];
  const stop = endDate && endDate < today ? endDate : today;
  for (let next = nextOccurrence(lastRun, frequency, anchorDay); next <= stop && out.length < MAX_PER_RUN;) {
    out.push(next);
    next = nextOccurrence(next, frequency, anchorDay);
  }
  return out;
}

/** Copies every active recurring template forward to `today`. Safe to run repeatedly. */
export async function runRecurring(today = new Date().toISOString().slice(0, 10)) {
  const { rows } = await query(
    `SELECT id, user_id, type, category, amount_minor, payment, note, occurred_on,
            recurring_frequency, recurring_end_date, COALESCE(recurring_last_run, occurred_on) AS last_run
     FROM transactions WHERE recurring_frequency IS NOT NULL AND recurring_status = 'active'`,
  );
  let created = 0;
  for (const t of rows) {
    const dates = dueDates({
      lastRun: t.last_run,
      frequency: t.recurring_frequency,
      anchorDay: parse(t.occurred_on).d,
      today,
      endDate: t.recurring_end_date,
    });
    if (!dates.length) continue;
    const res = await query(
      `INSERT INTO transactions (user_id, type, category, amount_minor, payment, note, occurred_on, recurring_parent_id)
       SELECT $1, $2, $3, $4, $5, $6, d::date, $7 FROM unnest($8::text[]) AS d
       ON CONFLICT (recurring_parent_id, occurred_on) WHERE recurring_parent_id IS NOT NULL DO NOTHING`,
      [t.user_id, t.type, t.category, t.amount_minor, t.payment, t.note, t.id, dates],
    );
    await query("UPDATE transactions SET recurring_last_run = $2 WHERE id = $1", [t.id, dates.at(-1)]);
    created += res.rowCount;
  }
  return created;
}
