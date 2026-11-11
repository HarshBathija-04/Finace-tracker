// Amounts travel as integer minor units (paise/cents); only formatting divides by 100.

const formatters = new Map();
function formatter(currency, compact) {
  const key = `${currency}:${compact}`;
  if (!formatters.has(key)) {
    formatters.set(
      key,
      new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
        style: "currency",
        currency,
        notation: compact ? "compact" : "standard",
        maximumFractionDigits: compact ? 1 : 2,
        minimumFractionDigits: compact ? 0 : 2,
      }),
    );
  }
  return formatters.get(key);
}

export const formatMoney = (minor, currency = "INR", { compact = false } = {}) =>
  formatter(currency, compact).format((minor || 0) / 100);

/** "1,234.5" -> 123450. Returns null unless it is a positive amount with at most 2 decimals. */
export function parseToMinor(input) {
  const match = /^(\d{1,10})(?:\.(\d{0,2}))?$/.exec(
    String(input ?? "")
      .replace(/,/g, "")
      .trim(),
  );
  if (!match) return null;
  const minor = Number(match[1]) * 100 + Number((match[2] || "").padEnd(2, "0"));
  return minor > 0 ? minor : null;
}

export const minorToInput = (minor) =>
  minor == null ? "" : `${Math.floor(minor / 100)}.${String(minor % 100).padStart(2, "0")}`;

export const pad = (n) => String(n).padStart(2, "0");

export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const currentPeriod = () => {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
};

export const shiftPeriod = ({ year, month }, delta) => {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
};

export const periodLabel = ({ year, month }, style = "long") =>
  new Date(year, month - 1, 1).toLocaleString("en", { month: style, year: "numeric" });

export const periodRange = ({ year, month }) => {
  const last = new Date(year, month, 0).getDate();
  return { from: `${year}-${pad(month)}-01`, to: `${year}-${pad(month)}-${pad(last)}` };
};

export const formatDate = (iso, opts = { day: "numeric", month: "short", year: "numeric" }) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en", opts);
};

export const percentChange = (current, previous) =>
  previous ? Math.round(((current - previous) / previous) * 1000) / 10 : null;

export const titleCase = (s) => (s ? s[0].toUpperCase() + s.slice(1) : "");
