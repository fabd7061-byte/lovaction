import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCheck,
  Mail,
  MailCheck,
  MailOpen,
  MessageSquare,
  Phone,
  SearchX,
  Send,
  Trash2,
} from "lucide-react";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import { ConfirmDialog, EmptyState, Pagination } from "../../components/ui/Feedback.jsx";
import SearchInput from "../../components/ui/SearchInput.jsx";
import { TableSkeleton } from "../../components/ui/Spinner.jsx";
import PageHeader, { SectionCard } from "../../components/PageHeader.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import api, { apiError } from "../../services/api.js";
import { formatDateTime, relativeTime } from "../../utils/format.js";
import usePageMeta from "../../utils/usePageMeta.js";

const STATUSES = ["all", "new", "read", "replied"];
const EMPTY_STATS = { new: 0, read: 0, replied: 0, total: 0 };

export default function AdminMessages() {
  const { t, lang } = useLanguage();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  usePageMeta(t("admin.messages.title"));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/contact", {
        params: { status, search: search || undefined, page, limit: 10 },
      });
      const list = response.data.items || [];
      setItems(list);
      setStats(response.data.stats || EMPTY_STATS);
      setPagination(response.data.pagination || null);
      setSelected((current) => {
        if (!current) return list[0] || null;
        return list.find((item) => item._id === current._id) || list[0] || null;
      });
    } catch (err) {
      setError(apiError(err, t("common.errorText")));
    } finally {
      setLoading(false);
    }
  }, [status, search, page, t]);

  useEffect(() => {
    load();
  }, [load]);

  const applyStatus = useCallback(
    async (message, nextStatus, silent = false) => {
      if (!message || message.status === nextStatus) return;
      setBusy(message._id);
      try {
        const response = await api.patch(`/contact/${message._id}/status`, { status: nextStatus });
        const updated = response.data.item || { ...message, status: nextStatus };
        setItems((current) => current.map((item) => (item._id === message._id ? { ...item, ...updated } : item)));
        setSelected((current) =>
          current && current._id === message._id ? { ...current, ...updated } : current
        );
        setStats((current) => {
          const next = { ...current };
          if (next[message.status] !== undefined) next[message.status] = Math.max(0, next[message.status] - 1);
          if (next[nextStatus] !== undefined) next[nextStatus] += 1;
          return next;
        });
        if (!silent) toast.success(t("admin.messages.statusUpdated"));
      } catch (err) {
        if (!silent) toast.error(apiError(err, t("common.errorText")));
      } finally {
        setBusy("");
      }
    },
    [t, toast]
  );

  const selectMessage = (message) => {
    setSelected(message);
    if (message.status === "new") applyStatus(message, "read", true);
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/contact/${deleteTarget._id}`);
      toast.success(t("admin.messages.messageDeleted"));
      setDeleteTarget(null);
      if (selected?._id === deleteTarget._id) setSelected(null);
      if (items.length === 1 && page > 1) setPage((value) => value - 1);
      else load();
    } catch (err) {
      toast.error(apiError(err, t("common.errorText")));
    } finally {
      setDeleting(false);
    }
  };

  const mailto = selected
    ? `mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject || t("admin.messages.noSubject")}`)}`
    : "#";

  return (
    <div className="space-y-5">
      <PageHeader
        dark
        eyebrow={t("admin.nav.content")}
        title={t("admin.messages.title")}
        text={t("admin.messages.subtitle")}
        actions={
          <Button variant="outline-light" size="sm" icon={MailOpen} onClick={load}>
            {t("common.refresh")}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { key: "total", label: t("admin.messages.all"), icon: MessageSquare, tone: "text-gold-light" },
          { key: "new", label: t("status.new"), icon: Mail, tone: "text-red-300" },
          { key: "read", label: t("status.read"), icon: MailOpen, tone: "text-sky-300" },
          { key: "replied", label: t("status.replied"), icon: CheckCheck, tone: "text-emerald-300" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              setStatus(item.key === "total" ? "all" : item.key);
              setPage(1);
              setSelected(null);
            }}
            className={`rounded-xl border px-4 py-3.5 text-left transition ${
              (item.key === "total" ? status === "all" : status === item.key)
                ? "border-gold/40 bg-gold/[0.07]"
                : "border-white/[0.06] bg-white/[0.025] hover:border-white/15"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/35">{item.label}</p>
              <item.icon size={14} className={item.tone} />
            </div>
            <p className="mt-2 font-display text-2xl leading-none text-cream/90">{stats?.[item.key] || 0}</p>
          </button>
        ))}
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[390px_1fr]">
        <SectionCard dark padded={false} className="xl:sticky xl:top-[88px]">
          <div className="space-y-2.5 border-b border-white/[0.06] p-3.5">
            <SearchInput value={query} onChange={setQuery} dark placeholder={t("common.search")} />
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
                setSelected(null);
              }}
              className="input-dark h-10 py-0 text-[11px]"
            >
              {STATUSES.map((key) => (
                <option key={key} value={key} className="bg-ink-soft">
                  {key === "all" ? t("admin.messages.all") : t(`status.${key}`)}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="p-2">
              <TableSkeleton rows={6} dark />
            </div>
          ) : error ? (
            <EmptyState
              dark
              icon={MessageSquare}
              title={t("common.loadFailed")}
              text={error}
              action={
                <Button variant="outline-light" size="sm" onClick={load}>
                  {t("common.retry")}
                </Button>
              }
            />
          ) : items.length ? (
            <>
              <div className="dark-scroll max-h-[600px] overflow-y-auto">
                {items.map((message) => {
                  const active = selected?._id === message._id;
                  return (
                    <button
                      key={message._id}
                      type="button"
                      onClick={() => selectMessage(message)}
                      className={`flex w-full gap-2.5 border-b border-white/[0.045] px-3.5 py-3 text-left transition last:border-0 ${
                        active ? "bg-gold/[0.07]" : "hover:bg-white/[0.025]"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                          message.status === "new"
                            ? "bg-crimson/15 text-red-300"
                            : "bg-white/[0.05] text-gold-light/70"
                        }`}
                      >
                        {message.name?.slice(0, 1)?.toUpperCase() || "?"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className={`truncate text-[11px] ${message.status === "new" ? "font-bold text-cream" : "font-semibold text-cream/70"}`}>
                            {message.name}
                          </span>
                          <span className="shrink-0 text-[8.5px] text-white/20">{relativeTime(message.createdAt, lang)}</span>
                        </span>
                        <span className="mt-0.5 block truncate text-[10px] text-white/45">
                          {message.subject || t("admin.messages.noSubject")}
                        </span>
                        <span className="mt-1 flex items-center justify-between gap-2">
                          <span className="truncate text-[9px] text-white/25">{message.message}</span>
                          <Badge status={message.status} dark dot={message.status === "new"} className="!px-1.5 !py-0.5 !text-[8px]" />
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="border-t border-white/[0.06] p-3">
                <Pagination
                  page={pagination?.page || 1}
                  pages={pagination?.pages || 1}
                  total={pagination?.total}
                  limit={pagination?.limit}
                  onChange={(next) => {
                    setPage(next);
                    setSelected(null);
                  }}
                  dark
                />
              </div>
            </>
          ) : (
            <EmptyState
              dark
              icon={query || status !== "all" ? SearchX : MessageSquare}
              title={t("admin.messages.empty")}
            />
          )}
        </SectionCard>

        <SectionCard dark padded={false} className="min-h-[440px]">
          {selected ? (
            <div className="flex h-full flex-col">
              <div className="border-b border-white/[0.06] p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge status={selected.status} dark />
                      <span className="text-[9px] uppercase tracking-[0.12em] text-white/25">
                        {formatDateTime(selected.createdAt, lang)}
                      </span>
                    </div>
                    <h2 className="mt-2 font-display text-xl leading-snug tracking-[-0.02em] text-cream">
                      {selected.subject || t("admin.messages.noSubject")}
                    </h2>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <a
                      href={mailto}
                      className="btn btn-gold btn-sm"
                    >
                      <Send size={13} /> {t("admin.messages.reply")}
                    </a>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(selected)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/35 transition hover:border-crimson/40 hover:text-red-300"
                      aria-label={t("admin.messages.delete")}
                      title={t("admin.messages.delete")}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10 text-[11px] font-bold text-gold-light">
                      {selected.name?.slice(0, 1)?.toUpperCase() || "?"}
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold text-cream/80">{selected.name}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[9px] text-white/30">
                        <span className="inline-flex items-center gap-1"><Mail size={9} /> {selected.email}</span>
                        {selected.phone && (
                          <span className="inline-flex items-center gap-1"><Phone size={9} /> {selected.phone}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {selected.status !== "read" && (
                    <Button
                      variant="soft-dark"
                      size="sm"
                      icon={MailOpen}
                      loading={busy === selected._id}
                      onClick={() => applyStatus(selected, "read")}
                    >
                      {t("admin.messages.markRead")}
                    </Button>
                  )}
                  {selected.status !== "replied" && (
                    <Button
                      variant="soft-dark"
                      size="sm"
                      icon={MailCheck}
                      loading={busy === selected._id}
                      onClick={() => applyStatus(selected, "replied")}
                    >
                      {t("admin.messages.markReplied")}
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex-1 p-4 sm:p-5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/25">
                  {t("admin.messages.messageLabel")}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-[12.5px] leading-[1.85] text-white/65">
                  {selected.message}
                </p>
              </div>

              <div className="border-t border-white/[0.06] px-4 py-3 sm:px-5">
                <p className="flex items-center gap-1.5 text-[9.5px] text-white/25">
                  <MailCheck size={11} className="text-gold/50" /> {t("admin.messages.replyHint")}
                </p>
              </div>
            </div>
          ) : (
            <EmptyState
              dark
              icon={MailOpen}
              title={t("admin.messages.noSelection")}
              text={t("admin.messages.noSelectionHint")}
            />
          )}
        </SectionCard>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        title={t("admin.messages.deleteTitle")}
        text={t("admin.messages.deleteText", { name: deleteTarget?.name || "" })}
        confirmLabel={t("admin.messages.delete")}
        loading={deleting}
        dark
      />
    </div>
  );
}
