import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Copy,
  Mail,
  MapPin,
  MessageSquareQuote,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
  XCircle,
} from "lucide-react";
import Avatar from "../../components/ui/Avatar.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { Textarea } from "../../components/ui/Field.jsx";
import { EmptyState } from "../../components/ui/Feedback.jsx";
import { PageLoader } from "../../components/ui/Spinner.jsx";
import PageHeader, { CardHeader, SectionCard } from "../../components/PageHeader.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useSite } from "../../context/SiteContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import api, { apiError } from "../../services/api.js";
import { copyText, formatDate, formatDateTime } from "../../utils/format.js";
import usePageMeta from "../../utils/usePageMeta.js";

export default function ApplicationDetail() {
  const { id } = useParams();
  const { t, lang } = useLanguage();
  const { settings } = useSite();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [credentials, setCredentials] = useState(null);

  const application = data?.application;
  const referrer = data?.referrer;

  usePageMeta(application ? `${application.firstName} ${application.lastName}` : t("admin.applications.title"));

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/applications/${id}`);
      setData(response.data);
      setNote(response.data.application?.reviewNote || "");
    } catch (err) {
      setError(apiError(err, t("admin.applications.notFound")));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    load();
  }, [load]);

  const saveNote = async () => {
    setBusy("note");
    try {
      await api.patch(`/applications/${id}/review`, { note: note.trim() });
      toast.success(t("admin.applications.noteSaved"));
      load();
    } catch (err) {
      toast.error(apiError(err, t("common.errorText")));
    } finally {
      setBusy("");
    }
  };

  const markReview = async () => {
    setBusy("review");
    try {
      await api.patch(`/applications/${id}/review`, { note: note.trim() });
      toast.success(t("admin.applications.markedReview"));
      load();
    } catch (err) {
      toast.error(apiError(err, t("common.errorText")));
    } finally {
      setBusy("");
    }
  };

  const approve = async () => {
    setBusy("approve");
    try {
      const response = await api.patch(`/applications/${id}/approve`);
      toast.success(t("admin.applications.approvedToast"));
      setApproveOpen(false);
      setCredentials({ ...response.data.credentials, memberId: response.data.member?.id });
      load();
    } catch (err) {
      toast.error(apiError(err, t("common.errorText")));
    } finally {
      setBusy("");
    }
  };

  const reject = async () => {
    if (reason.trim().length < 5) {
      toast.error(t("validation.short"));
      return;
    }
    setBusy("reject");
    try {
      await api.patch(`/applications/${id}/reject`, { reason: reason.trim() });
      toast.success(t("admin.applications.rejectedToast"));
      setRejectOpen(false);
      setReason("");
      load();
    } catch (err) {
      toast.error(apiError(err, t("common.errorText")));
    } finally {
      setBusy("");
    }
  };

  const copy = async (value, message) => {
    try {
      await copyText(value);
      toast.success(message || t("common.copied"));
    } catch {
      toast.error(t("common.errorText"));
    }
  };

  if (loading) return <PageLoader label={t("common.loading")} dark />;
  if (error || !application) {
    return (
      <SectionCard dark className="py-16 text-center">
        <EmptyState
          dark
          icon={ClipboardCheck}
          title={t("admin.applications.notFound")}
          text={error}
          action={
            <Button as={Link} to="/admin/applications" variant="outline-light" size="sm" icon={ArrowLeft}>
              {t("admin.applications.back")}
            </Button>
          }
        />
      </SectionCard>
    );
  }

  const pending = ["pending", "under_review"].includes(application.status);
  const reference = `APP-${String(application._id).slice(-6).toUpperCase()}`;
  const name = `${application.firstName} ${application.lastName}`;

  return (
    <div className="space-y-5">
      <Link
        to="/admin/applications"
        className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/35 transition hover:text-cream"
      >
        <ArrowLeft size={12} /> {t("admin.applications.back")}
      </Link>

      <PageHeader
        dark
        eyebrow={`${reference} · ${formatDate(application.createdAt, lang)}`}
        title={name}
        text={t("admin.applications.subtitleDetail")}
        actions={
          <>
            <Badge status={application.status} dark />
            {application.createdMemberId && (
              <Button
                as={Link}
                to={`/admin/members/${application.createdMemberId?._id || application.createdMemberId}`}
                variant="outline-light"
                size="sm"
                icon={UserRound}
              >
                {t("admin.applications.viewMember")}
              </Button>
            )}
            {pending && (
              <>
                {application.status === "pending" && (
                  <Button variant="soft-dark" size="sm" icon={Clock} loading={busy === "review"} onClick={markReview}>
                    {t("admin.applications.markReview")}
                  </Button>
                )}
                <Button variant="danger" size="sm" icon={XCircle} onClick={() => setRejectOpen(true)}>
                  {t("common.reject")}
                </Button>
                <Button size="sm" icon={CheckCircle2} onClick={() => setApproveOpen(true)}>
                  {t("common.approve")}
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <SectionCard dark>
            <CardHeader dark title={t("admin.applications.details")} text={t("admin.applications.applicant")} />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar
                src={application.profileImage}
                firstName={application.firstName}
                lastName={application.lastName}
                size="2xl"
              />
              <div className="min-w-0 flex-1">
                <p className="font-display text-xl tracking-[-0.02em] text-cream">{name}</p>
                <p className="mt-0.5 text-[10.5px] text-white/35">@{application.referralUsername}</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <Badge status={application.status} dark />
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[9px] font-semibold text-white/35">
                    {reference}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { icon: Mail, label: t("common.email"), value: application.email },
                { icon: Phone, label: t("common.phone"), value: application.phone },
                { icon: MapPin, label: t("dashboard.location"), value: application.location || "—" },
                { icon: CalendarDays, label: t("admin.applications.applicationDate"), value: formatDate(application.createdAt, lang) },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
                  <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-white/30">
                    <item.icon size={11} /> {item.label}
                  </p>
                  <p className="mt-1.5 break-words text-[11.5px] text-cream/70">{item.value || "—"}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-gold-light/60">
                <MessageSquareQuote size={12} /> {t("admin.applications.reason")}
              </p>
              <p className="mt-2 whitespace-pre-line text-[12px] leading-relaxed text-cream/60">
                {application.reasonForJoining}
              </p>
              {application.message && (
                <>
                  <p className="mt-4 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/30">
                    {t("common.message")}
                  </p>
                  <p className="mt-2 whitespace-pre-line text-[11.5px] leading-relaxed text-white/45">
                    {application.message}
                  </p>
                </>
              )}
            </div>
          </SectionCard>

          <SectionCard dark>
            <CardHeader dark title={t("admin.applications.referralInfo")} text={t("admin.referrals.subtitle")} />
            {referrer ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link to={`/admin/members/${referrer.id}`} className="flex items-center gap-3">
                  <Avatar
                    src={referrer.profileImage}
                    firstName={referrer.firstName}
                    lastName={referrer.lastName}
                    size="lg"
                  />
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-semibold text-cream/85">{referrer.fullName}</p>
                    <p className="mt-0.5 text-[10px] text-white/30">@{referrer.username}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <Badge status={referrer.role} dark dot={false} />
                      <Badge status={referrer.status} dark dot={false} />
                    </div>
                  </div>
                </Link>
                <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                    <p className="text-[8.5px] uppercase tracking-[0.08em] text-white/25">{t("dashboard.points")}</p>
                    <p className="mt-1 text-[13px] font-semibold text-gold-light">{referrer.points || 0}</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                    <p className="text-[8.5px] uppercase tracking-[0.08em] text-white/25">{t("dashboard.memberCode")}</p>
                    <p className="mt-1 font-mono text-[11px] text-cream/65">{referrer.memberCode}</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                    <p className="text-[8.5px] uppercase tracking-[0.08em] text-white/25">{t("dashboard.invitedBy")}</p>
                    <p className="mt-1 truncate text-[10px] text-cream/65">
                      {referrer.parent ? `${referrer.parent.firstName} ${referrer.parent.lastName}` : t("dashboard.leader")}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState dark icon={UserRound} title={t("admin.applications.noReferrer")} />
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-gold/20 bg-gold/[0.05] px-3.5 py-3">
              <Sparkles size={13} className="text-gold-light" />
              <p className="flex-1 text-[10.5px] leading-relaxed text-white/45">
                {t("admin.applications.approvalText", {
                  points: settings.pointsPerReferral,
                  referrer: referrer?.username || application.referralUsername,
                })}
              </p>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard dark>
            <CardHeader dark title={t("admin.applications.decision")} text={t("admin.applications.subtitleDetail")} />
            <div className="space-y-0.5">
              {[
                {
                  icon: ClipboardCheck,
                  title: t("admin.applications.applicationDate"),
                  value: formatDateTime(application.createdAt, lang),
                  tone: "text-gold-light",
                },
                {
                  icon: ShieldCheck,
                  title: t("admin.applications.reviewedBy"),
                  value: application.reviewedBy
                    ? `${application.reviewedBy.firstName} ${application.reviewedBy.lastName}`
                    : t("admin.audit.actorSystem"),
                  tone: "text-white/50",
                },
                {
                  icon: application.status === "approved" ? CheckCircle2 : application.status === "rejected" ? XCircle : Clock,
                  title: t("common.status"),
                  value: t(`status.${application.status}`),
                  tone:
                    application.status === "approved"
                      ? "text-emerald-300"
                      : application.status === "rejected"
                        ? "text-red-300"
                        : "text-amber-300",
                },
                {
                  icon: CalendarDays,
                  title: t("admin.applications.decision"),
                  value: application.reviewedAt ? formatDateTime(application.reviewedAt, lang) : "—",
                  tone: "text-white/50",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-3 border-b border-white/[0.05] py-3 last:border-0">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.025]">
                    <item.icon size={13} className={item.tone} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-white/25">{item.title}</p>
                    <p className="mt-1 break-words text-[11px] text-cream/65">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {application.rejectionReason && (
              <div className="mt-4 rounded-xl border border-red-400/15 bg-red-400/[0.05] px-3.5 py-3">
                <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-red-300/70">
                  {t("admin.applications.rejectionReasonLabel")}
                </p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-cream/55">{application.rejectionReason}</p>
              </div>
            )}

            {application.pointsAwarded > 0 && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] px-3.5 py-3">
                <BadgeCheck size={15} className="text-emerald-300" />
                <span className="text-[10.5px] text-white/45">{t("admin.applications.referralPoints")}</span>
                <span className="ml-auto text-[12px] font-bold text-emerald-300">+{application.pointsAwarded}</span>
              </div>
            )}

            {pending && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="danger" size="sm" icon={XCircle} onClick={() => setRejectOpen(true)}>
                  {t("common.reject")}
                </Button>
                <Button size="sm" icon={CheckCircle2} onClick={() => setApproveOpen(true)}>
                  {t("common.approve")}
                </Button>
              </div>
            )}
          </SectionCard>

          <SectionCard dark>
            <CardHeader dark title={t("admin.applications.reviewNote")} text={t("admin.applications.notePlaceholder")} />
            <Textarea
              dark
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
              maxLength={800}
              placeholder={t("admin.applications.notePlaceholder")}
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[9px] text-white/25">{note.length}/800</span>
              <Button variant="outline-light" size="sm" loading={busy === "note"} onClick={saveNote} disabled={!pending && !note}>
                {t("admin.applications.saveNote")}
              </Button>
            </div>
          </SectionCard>

          <SectionCard dark>
            <div className="flex items-start gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold-light">
                <ShieldCheck size={14} />
              </span>
              <p className="text-[10px] leading-relaxed text-white/30">
                {t("admin.members.actionsNote")}
              </p>
            </div>
          </SectionCard>
        </div>
      </div>

      <Modal
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        theme="dark"
        size="sm"
        title={t("admin.applications.approvalTitle")}
        description={t("admin.applications.approvalText", {
          points: settings.pointsPerReferral,
          referrer: referrer?.username || application.referralUsername,
        })}
        footer={
          <>
            <Button variant="soft-dark" size="sm" onClick={() => setApproveOpen(false)} disabled={busy === "approve"}>
              {t("common.cancel")}
            </Button>
            <Button size="sm" icon={CheckCircle2} loading={busy === "approve"} onClick={approve}>
              {t("admin.applications.confirmApprove")}
            </Button>
          </>
        }
      >
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
          <div className="flex items-center gap-3">
            <Avatar
              src={application.profileImage}
              firstName={application.firstName}
              lastName={application.lastName}
              size="md"
            />
            <div>
              <p className="text-[12.5px] font-semibold text-cream/85">{name}</p>
              <p className="mt-0.5 text-[10px] text-white/35">{application.email}</p>
            </div>
          </div>
          <p className="mt-3 text-[10.5px] leading-relaxed text-white/40">
            {t("admin.applications.referralInfo")}: <span className="font-semibold text-gold-light">@{referrer?.username || application.referralUsername}</span>
          </p>
        </div>
      </Modal>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        theme="dark"
        size="sm"
        title={t("admin.applications.rejectTitle")}
        description={t("admin.applications.rejectText")}
        footer={
          <>
            <Button variant="soft-dark" size="sm" onClick={() => setRejectOpen(false)} disabled={busy === "reject"}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" size="sm" icon={XCircle} loading={busy === "reject"} onClick={reject}>
              {t("admin.applications.confirmReject")}
            </Button>
          </>
        }
      >
        <Textarea
          dark
          label={t("admin.applications.rejectionReason")}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={4}
          maxLength={800}
          required
          placeholder={t("admin.applications.rejectionPlaceholder")}
        />
      </Modal>

      <Modal
        open={Boolean(credentials)}
        onClose={() => setCredentials(null)}
        theme="dark"
        size="sm"
        title={t("admin.applications.credentialsTitle")}
        description={t("admin.applications.credentialsText")}
        footer={
          <>
            <Button variant="soft-dark" size="sm" onClick={() => setCredentials(null)}>
              {t("common.close")}
            </Button>
            <Button
              as={Link}
              to={`/admin/members/${credentials?.memberId || application.createdMemberId?._id || application.createdMemberId}`}
              size="sm"
              icon={UserRound}
              onClick={() => setCredentials(null)}
            >
              {t("admin.applications.viewMember")}
            </Button>
          </>
        }
      >
        {credentials && (
          <div className="space-y-2.5">
            {[
              { label: t("common.email"), value: credentials.email, copyValue: credentials.email },
              { label: t("dashboard.username"), value: credentials.username, copyValue: credentials.username },
              { label: t("dashboard.memberCode"), value: credentials.memberCode, copyValue: credentials.memberCode },
              { label: t("admin.applications.tempPassword"), value: credentials.tempPassword, copyValue: credentials.tempPassword },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[8.5px] font-semibold uppercase tracking-[0.1em] text-white/25">{item.label}</p>
                  <p className="mt-0.5 truncate font-mono text-[11.5px] text-cream/75">{item.value}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copy(item.copyValue)}
                  className="rounded-full border border-white/10 p-1.5 text-white/40 transition hover:border-gold/40 hover:text-cream"
                  aria-label={t("common.copy")}
                >
                  <Copy size={12} />
                </button>
              </div>
            ))}
            <p className="rounded-xl border border-gold/20 bg-gold/[0.05] px-3.5 py-2.5 text-[10px] leading-relaxed text-white/40">
              {t("admin.applications.credentialsNote")}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
