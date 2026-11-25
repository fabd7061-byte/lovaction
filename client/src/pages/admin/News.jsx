import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Archive,
  CalendarDays,
  Eye,
  ExternalLink,
  FileText,
  ImagePlus,
  Newspaper,
  Pencil,
  Plus,
  SearchX,
  Send,
  Trash2,
  Upload,
} from "lucide-react";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { Input, Select, Textarea } from "../../components/ui/Field.jsx";
import { ConfirmDialog, EmptyState, Pagination } from "../../components/ui/Feedback.jsx";
import SearchInput from "../../components/ui/SearchInput.jsx";
import { PageLoader } from "../../components/ui/Spinner.jsx";
import PageHeader, { SectionCard } from "../../components/PageHeader.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import api, { apiError } from "../../services/api.js";
import { formatDate } from "../../utils/format.js";
import { uploadImageFile } from "../../utils/upload.js";
import usePageMeta from "../../utils/usePageMeta.js";

const CATEGORIES = ["Education", "Community", "Faith", "Events", "Impact", "Announcements"];
const EMPTY_FORM = {
  title: "",
  excerpt: "",
  content: "",
  coverImage: "",
  category: "Community",
  status: "draft",
};

export default function AdminNews() {
  const { t, lang } = useLanguage();
  const toast = useToast();
  const fileRef = useRef(null);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [counts, setCounts] = useState({ published: 0, draft: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [publishingId, setPublishingId] = useState("");

  usePageMeta(t("admin.news.title"));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  const loadCounts = useCallback(async () => {
    try {
      const [publishedRes, draftRes] = await Promise.all([
        api.get("/news", { params: { scope: "admin", all: "true", status: "published", limit: 1 } }),
        api.get("/news", { params: { scope: "admin", all: "true", status: "draft", limit: 1 } }),
      ]);
      setCounts({
        published: publishedRes.data.pagination?.total || 0,
        draft: draftRes.data.pagination?.total || 0,
      });
    } catch {
      // Counts are decorative; the list itself already reports errors.
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/news", {
        params: {
          scope: "admin",
          all: "true",
          status,
          category,
          search: search || undefined,
          page,
          limit: 9,
          sort: "newest",
        },
      });
      setItems(response.data.items || []);
      setPagination(response.data.pagination || null);
    } catch (err) {
      setError(apiError(err, t("common.errorText")));
    } finally {
      setLoading(false);
    }
  }, [status, category, search, page, t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setEditorOpen(true);
  };

  const openEdit = async (item) => {
    setEditing(item);
    setEditorOpen(true);
    setFormLoading(true);
    setForm({
      title: item.title || "",
      excerpt: item.excerpt || "",
      content: "",
      coverImage: item.coverImage || "",
      category: item.category || "Community",
      status: item.status || "draft",
    });
    try {
      const response = await api.get(`/news/${item.slug}`);
      const article = response.data.news || {};
      setForm({
        title: article.title || "",
        excerpt: article.excerpt || "",
        content: article.content || "",
        coverImage: article.coverImage || "",
        category: article.category || "Community",
        status: article.status || "draft",
      });
    } catch (err) {
      toast.error(apiError(err, t("common.errorText")));
    } finally {
      setFormLoading(false);
    }
  };

  const closeEditor = () => {
    if (saving || uploading) return;
    setEditorOpen(false);
    setEditing(null);
  };

  const onCover = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImageFile(file);
      setForm((current) => ({ ...current, coverImage: url }));
      toast.success(t("join.photoUploaded"));
    } catch (err) {
      toast.error(err.message || t("common.errorText"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    if (form.title.trim().length < 5) {
      toast.error(t("admin.news.titleField"));
      return;
    }
    if (form.excerpt.trim().length < 10) {
      toast.error(t("admin.news.excerpt"));
      return;
    }
    if (form.content.trim().length < 20) {
      toast.error(t("admin.news.content"));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        excerpt: form.excerpt.trim(),
        content: form.content.trim(),
        coverImage: form.coverImage.trim(),
        category: form.category,
        status: form.status,
      };
      if (editing) await api.put(`/news/${editing._id}`, payload);
      else await api.post("/news", payload);
      toast.success(t("admin.news.saved"));
      setEditorOpen(false);
      setEditing(null);
      load();
      loadCounts();
    } catch (err) {
      toast.error(apiError(err, t("common.errorText")));
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (item) => {
    const next = item.status === "published" ? "draft" : "published";
    setPublishingId(item._id);
    try {
      await api.patch(`/news/${item._id}/publish`, { status: next });
      toast.success(next === "published" ? t("admin.news.publishedToast") : t("admin.news.unpublishedToast"));
      setItems((current) =>
        current.map((row) => (row._id === item._id ? { ...row, status: next, publishedAt: next === "published" ? row.publishedAt || new Date() : null } : row))
      );
      loadCounts();
    } catch (err) {
      toast.error(apiError(err, t("common.errorText")));
    } finally {
      setPublishingId("");
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/news/${deleteTarget._id}`);
      toast.success(t("admin.news.deleted"));
      setDeleteTarget(null);
      load();
      loadCounts();
    } catch (err) {
      toast.error(apiError(err, t("common.errorText")));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        dark
        eyebrow={t("admin.nav.content")}
        title={t("admin.news.title")}
        text={t("admin.news.subtitle")}
        actions={
          <>
            <Button as={Link} to="/admin/reports" variant="outline-light" size="sm" icon={FileText}>
              {t("admin.exportReport")}
            </Button>
            <Button size="sm" icon={Plus} onClick={openCreate}>
              {t("admin.news.new")}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {[
          { key: "published", label: t("admin.news.published"), value: counts.published, tone: "text-emerald-300" },
          { key: "draft", label: t("admin.news.draft"), value: counts.draft, tone: "text-amber-300" },
          { key: "total", label: t("common.total"), value: counts.published + counts.draft, tone: "text-gold-light" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              if (item.key === "total") setStatus("all");
              else setStatus(item.key);
              setPage(1);
            }}
            className={`rounded-xl border px-4 py-3.5 text-left transition ${
              (item.key === "total" ? status === "all" : status === item.key)
                ? "border-gold/40 bg-gold/[0.07]"
                : "border-white/[0.06] bg-white/[0.025] hover:border-white/15"
            }`}
          >
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/35">{item.label}</p>
            <p className={`mt-2 font-display text-2xl leading-none ${item.tone}`}>{item.value}</p>
          </button>
        ))}
      </div>

      <SectionCard dark padded={false}>
        <div className="flex flex-col gap-2.5 border-b border-white/[0.06] p-4 lg:flex-row lg:items-center lg:justify-between">
          <SearchInput
            value={query}
            onChange={setQuery}
            dark
            placeholder={t("common.search")}
            className="w-full lg:max-w-xs"
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="input-dark h-11 py-0 text-[11.5px]"
            >
              <option value="all" className="bg-ink-soft">{t("admin.news.allStatuses")}</option>
              <option value="published" className="bg-ink-soft">{t("status.published")}</option>
              <option value="draft" className="bg-ink-soft">{t("status.draft")}</option>
            </select>
            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
              className="input-dark h-11 py-0 text-[11.5px]"
            >
              <option value="all" className="bg-ink-soft">{t("news.allCategories")}</option>
              {CATEGORIES.map((key) => (
                <option key={key} value={key} className="bg-ink-soft">
                  {t(`category.${key}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <PageLoader label={t("common.loading")} dark />
        ) : error ? (
          <EmptyState
            dark
            icon={Newspaper}
            title={t("common.loadFailed")}
            text={error}
            action={
              <Button variant="outline-light" size="sm" onClick={load}>
                {t("common.retry")}
              </Button>
            }
          />
        ) : items.length ? (
          <div className="p-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <article
                  key={item._id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.018] transition hover:border-gold/30"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-ink-soft">
                    {item.coverImage ? (
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        loading="lazy"
                        className="h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-[1.04] group-hover:opacity-100"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink via-ink-soft to-ink-card">
                        <span className="font-display text-4xl text-gold/30">L</span>
                      </div>
                    )}
                    <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
                      <span className="rounded-full border border-white/15 bg-ink/60 px-2.5 py-1 text-[8.5px] font-semibold uppercase tracking-[0.1em] text-cream/85 backdrop-blur">
                        {t(`category.${item.category}`)}
                      </span>
                      <Badge status={item.status} dark dot={false} />
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-center gap-2 text-[9px] text-white/30">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={10} />
                        {formatDate(item.publishedAt || item.createdAt, lang)}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-gold/50" />
                      <span className="inline-flex items-center gap-1">
                        <Eye size={10} /> {item.views || 0}
                      </span>
                    </div>
                    <h3 className="mt-2 line-clamp-2 font-display text-[1.05rem] leading-[1.22] tracking-[-0.015em] text-cream/90">
                      {item.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 flex-1 text-[10.5px] leading-relaxed text-white/35">
                      {item.excerpt}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/[0.055] pt-3">
                      <span className="min-w-0 truncate text-[9px] text-white/25">
                        {item.author ? `${item.author.firstName} ${item.author.lastName}` : t("common.notAvailable")}
                      </span>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="rounded-lg border border-white/10 p-1.5 text-white/40 transition hover:border-gold/40 hover:text-gold-light"
                          aria-label={t("admin.news.edit")}
                          title={t("admin.news.edit")}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => togglePublish(item)}
                          disabled={publishingId === item._id}
                          className="rounded-lg border border-white/10 p-1.5 text-white/40 transition hover:border-gold/40 hover:text-gold-light disabled:opacity-40"
                          aria-label={item.status === "published" ? t("admin.news.unpublish") : t("admin.news.publish")}
                          title={item.status === "published" ? t("admin.news.unpublish") : t("admin.news.publish")}
                        >
                          {item.status === "published" ? <Archive size={12} /> : <Send size={12} />}
                        </button>
                        <Link
                          to={`/news/${item.slug}`}
                          className="rounded-lg border border-white/10 p-1.5 text-white/40 transition hover:border-gold/40 hover:text-gold-light"
                          aria-label={t("common.view")}
                          title={t("common.view")}
                        >
                          <ExternalLink size={12} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          className="rounded-lg border border-white/10 p-1.5 text-white/40 transition hover:border-crimson/40 hover:text-red-300"
                          aria-label={t("admin.news.delete")}
                          title={t("admin.news.delete")}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <Pagination
              page={pagination?.page || 1}
              pages={pagination?.pages || 1}
              total={pagination?.total}
              limit={pagination?.limit}
              onChange={setPage}
              dark
            />
          </div>
        ) : (
          <EmptyState
            dark
            icon={query || status !== "all" || category !== "all" ? SearchX : Newspaper}
            title={t("admin.news.noArticles")}
            action={
              <Button size="sm" icon={Plus} onClick={openCreate}>
                {t("admin.news.new")}
              </Button>
            }
          />
        )}
      </SectionCard>

      <Modal
        open={editorOpen}
        onClose={closeEditor}
        theme="dark"
        size="lg"
        title={editing ? t("admin.news.editTitle") : t("admin.news.createTitle")}
        description={t("admin.news.subtitle")}
        footer={
          <>
            <Button variant="soft-dark" size="sm" onClick={closeEditor} disabled={saving || uploading}>
              {t("common.cancel")}
            </Button>
            <Button size="sm" loading={saving} onClick={save} disabled={formLoading || uploading}>
              {t("admin.news.save")}
            </Button>
          </>
        }
      >
        {formLoading ? (
          <PageLoader label={t("common.loading")} dark />
        ) : (
          <div className="space-y-4">
            <Input
              dark
              label={t("admin.news.titleField")}
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              maxLength={180}
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                dark
                label={t("admin.news.category")}
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
              >
                {CATEGORIES.map((key) => (
                  <option key={key} value={key} className="bg-ink-soft">
                    {t(`category.${key}`)}
                  </option>
                ))}
              </Select>
              <Select
                dark
                label={t("admin.news.statusLabel")}
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
              >
                <option value="draft" className="bg-ink-soft">{t("status.draft")}</option>
                <option value="published" className="bg-ink-soft">{t("status.published")}</option>
              </Select>
            </div>
            <Textarea
              dark
              label={t("admin.news.excerpt")}
              value={form.excerpt}
              onChange={(event) => setForm({ ...form, excerpt: event.target.value })}
              rows={2}
              maxLength={400}
              placeholder={t("admin.news.excerptPlaceholder")}
              required
            />
            <Textarea
              dark
              label={t("admin.news.content")}
              value={form.content}
              onChange={(event) => setForm({ ...form, content: event.target.value })}
              rows={9}
              placeholder={t("admin.news.contentPlaceholder")}
              required
            />

            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-white/35">
                {t("admin.news.cover")}
              </p>
              <p className="mt-1 text-[9.5px] text-white/25">{t("admin.news.coverHint")}</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-white/[0.08] bg-ink-soft sm:w-44">
                  {form.coverImage ? (
                    <img src={form.coverImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-white/20">
                      <ImagePlus size={22} />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <Input
                    dark
                    value={form.coverImage}
                    onChange={(event) => setForm({ ...form, coverImage: event.target.value })}
                    placeholder={t("admin.news.imageUrl")}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                      onChange={onCover}
                      className="hidden"
                    />
                    <Button
                      variant="soft-dark"
                      size="sm"
                      icon={Upload}
                      loading={uploading}
                      onClick={() => fileRef.current?.click()}
                    >
                      {t("admin.news.uploadCover")}
                    </Button>
                    {form.coverImage && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, coverImage: "" })}
                        className="text-[10px] font-semibold text-white/30 transition hover:text-red-300"
                      >
                        {t("common.remove")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        title={t("admin.news.deleteTitle")}
        text={t("admin.news.deleteText", { title: deleteTarget?.title || "" })}
        confirmLabel={t("admin.news.delete")}
        loading={deleting}
        dark
      />
    </div>
  );
}
