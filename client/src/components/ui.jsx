import { forwardRef, useEffect, useId, useRef } from "react";
import { CircleAlert, LoaderCircle, RotateCw, X } from "lucide-react";

const BUTTON = {
  primary: "bg-brand text-on-brand hover:bg-brand-hover shadow-sm",
  secondary: "bg-surface text-ink border border-line hover:bg-surface-2",
  ghost: "text-muted hover:text-ink hover:bg-surface-2",
  danger: "bg-expense text-white hover:opacity-90",
};

const SIZES = { sm: "h-9 px-3 text-sm", md: "h-10 px-4 text-sm", lg: "h-12 px-6 text-base" };

/** Button look for links styled as buttons, so no <button> ends up nested in an <a>. */
export const buttonClass = (variant = "primary", size = "md") =>
  `inline-flex items-center justify-center gap-2 rounded-xl font-medium whitespace-nowrap transition-[background-color,transform,opacity,box-shadow] duration-150 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-55 ${SIZES[size]} ${BUTTON[variant]}`;

export const Button = forwardRef(function Button(
  { variant = "primary", size = "md", loading = false, className = "", children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${buttonClass(variant, size)} ${className}`}
      {...props}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
});

export function IconButton({ label, children, className = "", ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`grid size-10 place-items-center rounded-xl text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

const control =
  "w-full rounded-xl border border-line bg-surface px-3 text-ink placeholder:text-muted/70 transition-[border-color,box-shadow] duration-150 focus:border-brand focus:outline-none focus:ring-3 focus:ring-brand/20 aria-invalid:border-expense";

/** Label + control + hint/error, wired up with ids for screen readers. */
export function Field({ label, error, hint, children, className = "" }) {
  const id = useId();
  const described = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": described })}
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 text-sm text-expense">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export const Input = forwardRef(function Input({ className = "", ...props }, ref) {
  return <input ref={ref} className={`${control} h-10 ${className}`} {...props} />;
});

export function Select({ className = "", children, ...props }) {
  return (
    <select className={`${control} h-10 pr-8 ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Card({ as: Tag = "section", className = "", children, ...props }) {
  return (
    <Tag className={`rounded-card border border-line bg-surface shadow-card ${className}`} {...props}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, action, id }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5">
      <div className="min-w-0">
        <h2 id={id} className="text-[15px] font-semibold">
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export const Skeleton = ({ className = "" }) => <div aria-hidden="true" className={`skeleton ${className}`} />;

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      {Icon && (
        <div className="mb-3 grid size-11 place-items-center rounded-2xl bg-brand-soft text-brand">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      )}
      <p className="font-medium">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-muted">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, compact = false }) {
  return (
    <div role="alert" className={`flex flex-col items-center text-center ${compact ? "py-6" : "px-6 py-10"}`}>
      <CircleAlert className="mb-2 size-6 text-expense" aria-hidden="true" />
      <p className="font-medium">Couldn't load this</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{error?.message || "Something went wrong."}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          <RotateCw className="size-4" aria-hidden="true" /> Try again
        </Button>
      )}
    </div>
  );
}

/** Native <dialog>: focus trapping, Esc and inert background come from the browser. */
export function Modal({ open, onClose, title, description, children, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="modal-title"
      className={`m-auto max-h-[92dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl border border-line bg-surface p-0 text-ink shadow-pop ${wide ? "max-w-2xl" : "max-w-lg"}`}
    >
      {open && (
        <div className="p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 id="modal-title" className="text-lg font-semibold">
                {title}
              </h2>
              {description && <p className="mt-1 text-sm text-muted">{description}</p>}
            </div>
            <IconButton label="Close dialog" onClick={onClose} className="-mt-2 -mr-2">
              <X className="size-5" aria-hidden="true" />
            </IconButton>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

const BAR = { ok: "bg-brand", warning: "bg-warn", exceeded: "bg-expense" };

export function ProgressBar({ percent, status = "ok", label }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.min(100, Math.round(percent))}
      className="h-2 overflow-hidden rounded-full bg-surface-2"
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-out ${BAR[status]}`}
        style={{ width: `${Math.min(100, percent)}%` }}
      />
    </div>
  );
}

export function Badge({ tone = "neutral", children }) {
  const tones = {
    neutral: "bg-surface-2 text-muted",
    brand: "bg-brand-soft text-brand",
    warn: "bg-warn-soft text-warn",
    danger: "bg-danger-soft text-expense",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Logo({ className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="var(--brand)" />
        <path
          d="M9 21.5 14 16l3.5 3.5L23 12"
          fill="none"
          stroke="var(--on-brand)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="23" cy="12" r="2.2" fill="var(--on-brand)" />
      </svg>
      <span className="text-[17px]">FinSight</span>
    </span>
  );
}
