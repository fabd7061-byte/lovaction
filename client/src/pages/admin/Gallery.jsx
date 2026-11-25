import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Camera,
  FileText,
  ImagePlus,
  Images,
  Pencil,
  Plus,
  SearchX,
  Trash2,
  Upload,
} from "lucide-react";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { Input, Select, Textarea } from "../../components/ui/Field.jsx";
import { ConfirmDialog, EmptyState, Pagination } from "../../components/ui/Feedback.jsx";
import { PageLoader } from "../../components/ui/Spinner.jsx";
import PageHeader, { SectionCard } from "../../components/PageHeader.jsx";
import Lightbox from "../../components/Lightbox.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import api, { apiError } from "../../services/api.js";
import { uploadImageFile } from "../../utils/upload.js";
import usePageMeta from "../../utils/usePageMeta.js";

const EMPTY_FORM = {
  title: "",
  caption: "",
  imageUrl: "",
  album: "Community Activities",
  status: "published",
};

export default function AdminGallery() {
  const { t } = useLanguage();
  const toast = useToast();
  const fileRef = useRef(null);
  const [items, setItems] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [albumCounts, setAlbumCounts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [album, setAlbum] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  usePageMeta(t("admin.gallery.title"));

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/gallery", {
        params: {
          scope: "admin",
          all: "true",
          album,
          status,
          page,
          limit: 18,
        },
      });
      setItems(response.data.items || []);
      setAlbums(response.data.albums || []);
      setAlbumCounts(response.data.albumCounts || []);
      setPagination(response.data.pagination || null);
    } catch (err) {
      setError(apiError(err, t("common.errorText")));
    } finally {
      setLoading(false);
    }
  }, [album, status, page, t]);

  useEffect(() => {
    load();
  }, [load]);

  const countFor = (name) => albumCounts.find((entry) => entry.album === name)?.count || 0;

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, album: album !== "all" ? album : EMPTY_FORM.album });
    setEditorOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      title: item.title || "",
      caption: item.caption || "",
      imageUrl: item.imageUrl || "",
      album: item.album || EMPTY_FORM.album,
      status: item.status || "published",
    });
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (saving || uploading) return;
    setEditorOpen(false);
    setEditing(null);
  };

  const onImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImageFile(file);
      setForm((current) => ({ ...current, imageUrl: url }));
      toast.success(t("join.photoUploaded"));
    } catch (err) {
      toast.error(err.message || t("common.errorText"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    if (!form.title.trim() || !form.album.trim() || !form.imageUrl.trim()) {
      toast.error(t("validation.required"));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        caption: form.caption.trim(),
        imageUrl: form.imageUrl.trim(),
        album: form.album.trim(),
        status: form.status,
      };
      if (editing) await api.put(`/gallery/${editing._id}`, payload);
      else await api.post("/gallery", payload);
      toast.success(t("admin.gallery.saved"));
      setEditorOpen(false);
      setEditing(null);
      load();
    } catch (err) {
      toast.error(apiError(err, t("common.errorText")));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/gallery/${deleteTarget._id}`);
      toast.success(t("admin.gallery.deleted"));
      setDeleteTarget(null);
      load();
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
        title={t("admin.gallery.title")}
        text={t("admin.gallery.subtitle")}
        actions={
          <>
            <Button as={Link} to="/admin/reports" variant="outline-light" size="sm" icon={FileText}>
              {t("admin.exportReport")}
            </Button>
            <Button size="sm" icon={Plus} onClick={openCreate}>
              {t("admin.gallery.add")}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {[
          { label: t("gallery.photos", { count: pagination?.total || 0 }), value: pagination?.total || 0, icon: Images, tone: "text-gold-light" },
          { label: t("gallery.albums"), value: albums.length, icon: Camera, tone: "text-sky-300" },
          { label: t("admin.gallery.image"), value: items.filter((item) => item.status === "published").length, icon: ImagePlus, tone: "text-emerald-300" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-[9px] font-semibold uppercase tracking-[0.12em] text-white/35">{item.label}</p>
              <item.icon size={14} className={item.tone} />
            </div>
            <p className="mt-2 font-display text-2xl leading-none text-cream/90">{item.value}</p>
          </div>
        ))}
      </div>

      <SectionCard dark padded={false}>
        <div className="border-b border-white/[0.06] p-4">
          <div className="dark-scroll flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => {
                setAlbum("all");
                setPage(1);
              }}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[10.5px] font-semibold transition ${
                album === "all"
                  ? "border-gold/40 bg-gold/10 text-gold-light"
                  : "border-white/10 text-white/40 hover:border-white/20 hover:text-cream"
              }`}
            >
              {t("admin.gallery.allAlbums")}
              <span className="ml-1.5 text-[9px] opacity-60">{albumCounts.reduce((sum, entry) => sum + entry.count, 0)}</span>
            </button>
            {albums.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setAlbum(name);
                  setPage(1);
                }}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[10.5px] font-semibold transition ${
                  album === name
                    ? "border-gold/40 bg-gold/10 text-gold-light"
                    : "border-white/10 text-white/40 hover:border-white/20 hover:text-cream"
                }`}
              >
                {name}
                <span className="ml-1.5 text-[9px] opacity-60">{countFor(name)}</span>
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] text-white/30">
              {t("admin.gallery.itemCount", { count: pagination?.total || 0 })}
              {album !== "all" ? ` · ${album}` : ""}
            </p>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="input-dark h-10 py-0 text-[11px] sm:w-44"
            >
              <option value="all" className="bg-ink-soft">{t("admin.news.allStatuses")}</option>
              <option value="published" className="bg-ink-soft">{t("status.published")}</option>
              <option value="draft" className="bg-ink-soft">{t("status.draft")}</option>
            </select>
          </div>
        </div>

        {loading ? (
          <PageLoader label={t("common.loading")} dark />
        ) : error ? (
          <EmptyState
            dark
            icon={Images}
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {items.map((item, index) => (
                <article
                  key={item._id}
                  className="group relative overflow-hidden rounded-xl border border-white/[0.07] bg-ink-soft"
                >
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(index)}
                    className="block aspect-square w-full overflow-hidden"
                    aria-label={t("gallery.viewPhoto")}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      loading="lazy"
                      className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-[1.05] group-hover:opacity-100"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent opacity-80" />
                  </button>

                  <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-1.5 p-2.5">
                    <span className="rounded-full border border-white/15 bg-ink/60 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-cream/75 backdrop-blur">
                      {item.album}
                    </span>
                    {item.status === "draft" && <Badge status="draft" dark dot={false} />}
                  </div>

                  <div className="absolute inset-x-0 bottom-0 p-2.5">
                    <p className="truncate text-[10.5px] font-semibold text-cream/90">{item.title}</p>
                    {item.caption && <p className="mt-0.5 line-clamp-1 text-[8.5px] text-white/40">{item.caption}</p>}
                  </div>

                  <div className="absolute right-2 top-9 flex flex-col gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="rounded-lg border border-white/15 bg-ink/70 p-1.5 text-white/60 backdrop-blur transition hover:border-gold/50 hover:text-gold-light"
                      aria-label={t("admin.gallery.editTitle")}
                      title={t("common.edit")}
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="rounded-lg border border-white/15 bg-ink/70 p-1.5 text-white/60 backdrop-blur transition hover:border-crimson/50 hover:text-red-300"
                      aria-label={t("admin.gallery.delete")}
                      title={t("common.delete")}
                    >
                      <Trash2 size={12} />
                    </button>
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
            icon={album !== "all" || status !== "all" ? SearchX : Images}
            title={t("admin.gallery.noItems")}
            action={
              <Button size="sm" icon={Plus} onClick={openCreate}>
                {t("admin.gallery.add")}
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
        title={editing ? t("admin.gallery.editTitle") : t("admin.gallery.createTitle")}
        description={t("admin.gallery.subtitle")}
        footer={
          <>
            <Button variant="soft-dark" size="sm" onClick={closeEditor} disabled={saving || uploading}>
              {t("common.cancel")}
            </Button>
            <Button size="sm" loading={saving} onClick={save} disabled={uploading}>
              {t("admin.gallery.save")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              dark
              label={t("admin.gallery.titleLabel")}
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              maxLength={160}
              required
            />
            <Input
              dark
              label={t("admin.gallery.albumLabel")}
              value={form.album}
              onChange={(event) => setForm({ ...form, album: event.target.value })}
              list="gallery-albums"
              maxLength={80}
              placeholder={t("admin.gallery.albumPlaceholder")}
              required
            />
            <datalist id="gallery-albums">
              {albums.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          <Textarea
            dark
            label={t("admin.gallery.captionLabel")}
            value={form.caption}
            onChange={(event) => setForm({ ...form, caption: event.target.value })}
            rows={3}
            maxLength={600}
          />

          <Select
            dark
            label={t("admin.gallery.statusLabel")}
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value })}
          >
            <option value="published" className="bg-ink-soft">{t("status.published")}</option>
            <option value="draft" className="bg-ink-soft">{t("status.draft")}</option>
          </Select>

          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-white/35">
              {t("admin.gallery.imageLabel")}
            </p>
            <div className="mt-3 aspect-[16/10] w-full overflow-hidden rounded-lg border border-white/[0.08] bg-ink-soft">
              {form.imageUrl ? (
                <img src={form.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/20">
                  <ImagePlus size={28} />
                  <span className="text-[10px]">{t("admin.gallery.uploadImage")}</span>
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Input
                dark
                value={form.imageUrl}
                onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
                placeholder="https://…"
                className="flex-1"
                required
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                onChange={onImage}
                className="hidden"
              />
              <Button
                variant="soft-dark"
                size="sm"
                icon={Upload}
                loading={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {t("admin.gallery.uploadImage")}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        title={t("admin.gallery.deleteTitle")}
        text={t("admin.gallery.deleteText", { title: deleteTarget?.title || "" })}
        confirmLabel={t("admin.gallery.delete")}
        loading={deleting}
        dark
      />

      {lightboxIndex !== null && items[lightboxIndex] && (
        <Lightbox
          items={items}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndex={(next) => setLightboxIndex(next)}
        />
      )}
    </div>
  );
}
