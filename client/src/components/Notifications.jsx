import { useEffect, useRef, useState } from "react";
import { Bell, BellOff, TriangleAlert, Info } from "lucide-react";
import { api } from "../lib/api";
import { useApi } from "../lib/useApi";
import { useToast } from "../context/toast";
import { IconButton, Skeleton } from "./ui";

const ago = (iso) => {
  const mins = Math.round((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
};

export default function Notifications({ version }) {
  const [open, setOpen] = useState(false);
  const { data, loading, reload } = useApi("/api/notifications");
  const toast = useToast();
  const panel = useRef(null);
  const trigger = useRef(null);

  useEffect(reload, [version, reload]);
  useEffect(() => {
    const id = setInterval(reload, 60_000);
    return () => clearInterval(id);
  }, [reload]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => !panel.current?.contains(e.target) && !trigger.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const act = async (fn, msg) => {
    try {
      await fn();
      reload();
      if (msg) toast(msg);
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const unread = data?.unread ?? 0;
  return (
    <div className="relative">
      <span ref={trigger}>
        <IconButton
          label={unread ? `Notifications, ${unread} unread` : "Notifications"}
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen((o) => !o)}
          className="relative"
        >
          <Bell className="size-[18px]" aria-hidden="true" />
          {unread > 0 && (
            <span className="num absolute top-1.5 right-1.5 grid min-w-4 place-items-center rounded-full bg-expense px-1 text-[10px] leading-4 font-semibold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </IconButton>
      </span>
      {open && (
        <div
          ref={panel}
          role="dialog"
          aria-label="Notifications"
          className="rise fixed inset-x-4 top-16 z-40 overflow-hidden rounded-2xl border border-line bg-surface shadow-pop sm:absolute sm:inset-x-auto sm:top-12 sm:right-0 sm:w-96"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-semibold">Notifications</p>
            <div className="flex gap-1 text-sm">
              <button
                type="button"
                disabled={!unread}
                onClick={() => act(() => api("/api/notifications/read-all", { method: "POST" }))}
                className="rounded-lg px-2 py-1 font-medium text-brand hover:bg-brand-soft disabled:opacity-40"
              >
                Mark all read
              </button>
              <button
                type="button"
                disabled={!data?.items.length}
                onClick={() => act(() => api("/api/notifications", { method: "DELETE" }), "Notifications cleared")}
                className="rounded-lg px-2 py-1 text-muted hover:bg-surface-2 disabled:opacity-40"
              >
                Clear
              </button>
            </div>
          </div>
          <ul className="max-h-[60dvh] overflow-y-auto">
            {loading && !data && (
              <li className="space-y-2 p-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </li>
            )}
            {data?.items.length === 0 && (
              <li className="flex flex-col items-center px-6 py-10 text-center text-sm text-muted">
                <BellOff className="mb-2 size-5" aria-hidden="true" />
                You're all caught up. Budget alerts will show up here.
              </li>
            )}
            {data?.items.map((n) => {
              const Icon = n.type === "budget" ? TriangleAlert : Info;
              return (
                <li key={n.id} className="border-b border-line last:border-0">
                  <button
                    type="button"
                    onClick={() => !n.isRead && act(() => api(`/api/notifications/${n.id}/read`, { method: "PATCH" }))}
                    className={`flex w-full gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-surface-2 ${n.isRead ? "text-muted" : ""}`}
                  >
                    <Icon
                      className={`mt-0.5 size-4 shrink-0 ${n.type === "budget" ? "text-warn" : "text-brand"}`}
                      aria-hidden="true"
                    />
                    <span className="flex-1">
                      {n.message}
                      <span className="mt-0.5 block text-xs text-muted">{ago(n.createdAt)}</span>
                    </span>
                    {!n.isRead && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
