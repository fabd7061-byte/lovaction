import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Copy,
  KeyRound,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserCog,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";
import Avatar from "../../components/ui/Avatar.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { Input, Select, Textarea } from "../../components/ui/Field.jsx";
import { EmptyState } from "../../components/ui/Feedback.jsx";
import { PageLoader } from "../../components/ui/Spinner.jsx";
import PageHeader, { CardHeader, SectionCard } from "../../components/PageHeader.jsx";
import MemberTree from "../../components/MemberTree.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import api, { apiError } from "../../services/api.js";
import { copyText, formatDate, formatDateTime, formatNumber } from "../../utils/format.js";
import usePageMeta from "../../utils/usePageMeta.js";

const STATUS_OPTIONS = ["active", "suspended", "inactive"];
const POINT_TYPES = ["bonus", "admin_adjustment", "penalty"];

export default function MemberDetail() {
  const { id } = useParams();
  const { t, lang } = useLanguage();
  const { user, isFounder } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [subtree, setSubtree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [pointsOpen, setPointsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: "active", reason: "" });
  const [roleValue, setRoleValue] = useState("member");
  const [pointsForm, setPointsForm] = useState({ points: "", type: "bonus", description: "" });
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    profileImage: "",
  });

  const member = data?.member;

  usePageMeta(member ? `${member.firstName} ${member.lastName}` : t("admin.members.detailTitle"));

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [memberRes, treeRes] = await Promise.allSettled([
        api.get(`/members/${id}`),
        api.get(`/members/${id}/tree`),
      ]);
      if (memberRes.status !== "fulfilled") throw memberRes.reason;
      const payload = memberRes.value.data;
      setData(payload);
      setSubtree(treeRes.status === "fulfilled" ? treeRes.value.data.subtree : null);
      const current = payload.member || {};
      setStatusForm({ status: current.status || "active", reason: "" });
      setRoleValue(current.role === "admin" ? "admin" : "member");
      setProfileForm({
        firstName: current.firstName || "",
        lastName: current.lastName || "",
        email: current.email || "",
        phone: current.phone || "",
        location: current.location || "",
        bio: current.bio || "",
        profileImage: current.profileImage || "",
      });
    } catch (err) {
      setError(apiError(err, t("admin.members.notFound")));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async () => {
    setBusy("status");
    try {
      await api.patch(`/members/${id}/status`, {
        status: statusForm.status,
        reason: statusForm.reason.trim() || undefined,
      });
      toast.success(t("admin.members.statusDone"));
      setStatusOpen(false);
      load();
    } catch (err) {
      toast.error(apiError(err, t("common.errorText")));
    } finally {
      setBusy("");
    }
  };

  const updateRole = async () => {
    setBusy("role");
    try {
      await api.patch(`/members/${id}/role`, { role: roleValue });
      toast.success(t("admin.members.roleDone"));
      setRoleOpen(false);
      load();
    } catch (err) {
      toast.error(apiError(err, t("common.errorText")));
    } finally {
      setBusy("");
    }
  };

  const resetPassword = async () => {
    setBusy("reset");
    try {
      const response = await api.patch(`/members/${id}/reset-password`);
      setCredentials(response.data.credentials || null);
      setResetOpen(false);
      toast.success(t("admin.members.resetDone"));
    } catch (err) {
      toast.error(apiError(err, t("common.errorText")));
    } finally {
      setBusy("");
    }
  };

  const adjustPoints = async () => {
    const value = Number(pointsForm.points);
    if (!Number.isInteger(value) || value === 0) {
      toast.error(t("admin.members.pointsAmount"));
      return;
    }
    if (pointsForm.description.trim().length < 3) {
      toast.error(t("admin.members.pointsReason"));
      return;
    }
    setBusy("points");
    try {
      await api.post("/points/adjust", {
        memberId: id,
        points: value,
        type: pointsForm.type,
        description: pointsForm.description.trim(),
      });
      toast.success(t("admin.members.pointsDone"));
      setPointsOpen(false);
      setPointsForm({ points: "", type: "bonus", description: "" });
      load();
    } catch (err) {
      toast.error(apiError(err, t("common.errorText")));
    } finally {
      setBusy("");
    }
  };

  const saveProfile = async () => {
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      toast.error(t("validation.required"));
      return;
    }
    setBusy("profile");
    try {
      await api.put(`/members/${id}`, profileForm);
      toast.success(t("admin.members.editSaved"));
      setProfileOpen(false);
      load();
    } catch (err) {
      toast.error(apiError(err, t("common.errorText")));
    } finally {
      setBusy("");
    }
  };

  const copy = async (value) => {
    try {
      await copyText(value);
      toast.success(t("common.copied"));
    } catch {
      toast.error(t("common.errorText"));
    }
  };

  if (loading) return <PageLoader label={t("common.loading")} dark />;
  if (error || !member) {
    return (
      <SectionCard dark className="py-16 text-center">
        <EmptyState
          dark
          icon={UserRound}
          title={t("admin.members.notFound")}
          text={error}
          action={
            <Button as={Link} to="/admin/members" variant="outline-light" size="sm" icon={ArrowLeft}>
              {t("admin.members.backToList")}
            </Button>
          }
        />
      </SectionCard>
    );
  }

  const stats = data?.referralStats || { approved: 0, pending: 0, rejected: 0, total: 0 };
  const referrals = data?.referrals || [];
  const recentPoints = data?.recentPoints || [];
  const childrenCount = data?.childrenCount || 0;
  const parent = member.parentMemberId;
  const isSelf = String(member._id) === String(user?.id);
  const founderAccount = member.role === "founder";

  const actions = [
    {
      key: "profile",
      icon: Pencil,
      title: t("admin.members.editProfile"),
      text: t("admin.members.editTitle"),
      onClick: () => setProfileOpen(true),
      disabled: false,
    },
    {
      key: "points",
      icon: Sparkles,
      title: t("admin.members.adjustPoints"),
      text: t("admin.members.pointsText"),
      onClick: () => setPointsOpen(true),
      disabled: false,
    },
    {
      key: "status",
      icon: founderAccount ? ShieldCheck : statusForm.status === "active" ? UserCheck : XCircle,
      title: statusForm.status === "active" ? t("admin.members.suspend") : t("admin.members.activate"),
      text: t("admin.members.statusText", { name: `${member.firstName} ${member.lastName}` }),
      onClick: () => {
        setStatusForm({ status: statusForm.status === "active" ? "suspended" : "active", reason: "" });
        setStatusOpen(true);
      },
      disabled: founderAccount || isSelf,
    },
    {
      key: "role",
      icon: UserCog,
      title: t("admin.members.changeRole"),
      text: isFounder ? t("admin.members.roleText") : t("admin.settings.founderNote"),
      onClick: () => setRoleOpen(true),
      disabled: !isFounder || founderAccount || isSelf,
    },
    {
      key: "reset",
      icon: KeyRound,
      title: t("admin.members.resetPassword"),
      text: t("admin.members.resetText", { name: `${member.firstName} ${member.lastName}` }),
      onClick: () => setResetOpen(true),
      disabled: false,
    },
  ];

  return (
    <div className="space-y-5">
      <Link
        to="/admin/members"
        className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/35 transition hover:text-cream"
      >
        <ArrowLeft size={12} /> {t("admin.members.backToMembers")}
      </Link>

      <PageHeader
        dark
        eyebrow={t("admin.members.detailTitle")}
        title={`${member.firstName} ${member.lastName}`}
        text={t("admin.members.memberSince", { date: formatDate(member.joinedAt, lang) })}
        actions={
          <>
            <Badge status={member.role} dark />
            <Badge status={member.status} dark />
            <Button variant="outline-light" size="sm" icon={Pencil} onClick={() => setProfileOpen(true)}>
              {t("admin.members.editProfile")}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <div className="space-y-4">
          <SectionCard dark>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <Avatar
                src={member.profileImage}
                firstName={member.firstName}
                lastName={member.lastName}
                size="3xl"
                className="ring-4 ring-white/[0.04]"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-2xl tracking-[-0.025em] text-cream">
                    {member.firstName} {member.lastName}
                  </h2>
                  <Badge status={member.role} dark dot={false} />
                </div>
                <p className="mt-1 text-[11px] text-white/35">@{member.username}</p>
                <p className="mt-2 max-w-xl text-[11.5px] leading-relaxed text-white/40">
                  {member.bio || t("admin.members.noBio")}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-white/30">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={11} /> {formatDate(member.joinedAt, lang)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <BadgeCheck size={11} /> {member.memberCode}
                  </span>
                  {member.lastLoginAt && (
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck size={11} /> {formatDateTime(member.lastLoginAt, lang)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {[
                { icon: Mail, label: t("common.email"), value: member.email },
                { icon: Phone, label: t("common.phone"), value: member.phone },
                { icon: MapPin, label: t("dashboard.location"), value: member.location || "—" },
                {
                  icon: Users,
                  label: t("dashboard.invitedBy"),
                  value: parent ? `${parent.firstName} ${parent.lastName}` : t("dashboard.leader"),
                },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
                  <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-white/30">
                    <item.icon size={11} /> {item.label}
                  </p>
                  <p className="mt-1.5 break-words text-[11.5px] text-cream/70">{item.value || "—"}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard dark padded={false}>
            <div className="flex items-center justify-between gap-3 p-4 sm:px-5">
              <CardHeader
                dark
                title={t("admin.members.referralActivity")}
                text={t("admin.referrals.subtitle")}
                className="!mb-0"
              />
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge label={`${stats.approved} ${t("status.approved").toLowerCase()}`} tone="green" dark dot={false} />
                <Badge label={`${stats.pending} ${t("dashboard.pending").toLowerCase()}`} tone="amber" dark dot={false} />
                <Badge label={`${stats.rejected} ${t("status.rejected").toLowerCase()}`} tone="red" dark dot={false} />
              </div>
            </div>
            {referrals.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[540px]">
                  <thead className="border-y border-white/[0.06] bg-white/[0.02]">
                    <tr>
                      <th className="admin-th">{t("dashboard.person")}</th>
                      <th className="admin-th">{t("common.status")}</th>
                      <th className="admin-th">{t("common.date")}</th>
                      <th className="admin-th text-right">{t("common.points")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {referrals.map((referral) => {
                      const person = referral.referredMember || referral.application || {};
                      return (
                        <tr key={referral._id}>
                          <td className="admin-td">
                            <div className="flex items-center gap-2.5">
                              <Avatar
                                src={person.profileImage}
                                firstName={person.firstName}
                                lastName={person.lastName}
                                size="xs"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-[11px] font-semibold text-cream/75">
                                  {person.firstName} {person.lastName}
                                </p>
                                <p className="mt-0.5 text-[9px] text-white/25">
                                  {referral.referredMember ? `@${person.username || ""}` : t("dashboard.applicant")}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="admin-td">
                            <Badge status={referral.status} dark dot={false} />
                          </td>
                          <td className="admin-td">
                            <span className="text-[10px] text-white/40">
                              {formatDate(referral.approvedAt || referral.createdAt, lang)}
                            </span>
                          </td>
                          <td className="admin-td text-right">
                            <span className="text-[10.5px] font-semibold text-gold-light">
                              {referral.pointsAwarded || 0}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState dark icon={Users} title={t("admin.members.noReferrals")} />
            )}
            <div className="grid grid-cols-3 divide-x divide-white/[0.06] border-t border-white/[0.06]">
              {[
                { label: t("common.total"), value: stats.total },
                { label: t("admin.members.children"), value: childrenCount },
                { label: t("dashboard.pointsEarned"), value: recentPoints.reduce((sum, p) => sum + Math.max(0, p.points), 0) },
              ].map((item) => (
                <div key={item.label} className="px-4 py-3 text-center">
                  <p className="font-display text-lg leading-none text-cream/80">{item.value}</p>
                  <p className="mt-1 text-[8.5px] uppercase tracking-[0.1em] text-white/25">{item.label}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {subtree && (
            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="font-display text-lg tracking-[-0.02em] text-cream">{t("admin.members.subtree")}</h2>
                <Link
                  to="/admin/referrals"
                  className="text-[10px] font-semibold text-gold-light/70 hover:text-gold-light"
                >
                  {t("admin.referrals.treeTab")} →
                </Link>
              </div>
              <MemberTree tree={[subtree]} currentUserId={member._id} focusId={member._id} compact />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <SectionCard dark>
            <CardHeader dark title={t("admin.members.membership")} text={t("admin.members.detailTitle")} />
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: t("admin.members.points"), value: formatNumber(member.points), tone: "text-gold-light" },
                { label: t("admin.members.referrals"), value: stats.approved, tone: "text-emerald-300" },
                { label: t("admin.members.children"), value: childrenCount, tone: "text-sky-300" },
                { label: t("common.status"), value: t(`status.${member.status}`), tone: "text-cream/70" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
                  <p className="text-[8.5px] font-semibold uppercase tracking-[0.1em] text-white/25">{item.label}</p>
                  <p className={`mt-1.5 font-display text-lg leading-none ${item.tone}`}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-2 text-[10.5px]">
              <div className="flex items-center justify-between gap-3 border-b border-white/[0.055] pb-2">
                <span className="text-white/30">{t("admin.members.invitedByLabel")}</span>
                <span className="text-cream/60">{parent ? `${parent.firstName} ${parent.lastName}` : "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-white/[0.055] pb-2">
                <span className="text-white/30">{t("dashboard.memberCode")}</span>
                <span className="font-mono text-cream/60">{member.memberCode}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-white/30">{t("admin.members.memberSinceLabel")}</span>
                <span className="text-cream/60">{formatDate(member.joinedAt, lang)}</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard dark>
            <CardHeader dark title={t("admin.members.accountActions")} text={t("admin.members.actionsNote")} />
            <div className="space-y-1.5">
              {actions.map((action) => (
                <button
                  key={action.key}
                  type="button"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className="group flex w-full items-center gap-3 rounded-xl border border-transparent px-2.5 py-2.5 text-left transition hover:border-white/[0.06] hover:bg-white/[0.025] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-gold-light/70">
                    <action.icon size={14} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-semibold text-cream/75">{action.title}</span>
                    <span className="mt-0.5 block truncate text-[9px] text-white/25">{action.text}</span>
                  </span>
                  <ArrowRight size={12} className="shrink-0 text-white/15 transition group-hover:text-gold-light" />
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard dark>
            <CardHeader dark title={t("admin.members.recentPoints")} text={t("dashboard.pointsSubtitle")} />
            {recentPoints.length ? (
              <div className="space-y-1.5">
                {recentPoints.map((tx) => (
                  <div key={tx._id} className="flex items-center gap-2.5 rounded-xl px-2 py-2">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        tx.points >= 0 ? "bg-emerald-400/10 text-emerald-300" : "bg-red-400/10 text-red-300"
                      }`}
                    >
                      {tx.points >= 0 ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10.5px] text-cream/60">{tx.description}</p>
                      <p className="mt-0.5 text-[8.5px] text-white/25">{formatDate(tx.createdAt, lang)}</p>
                    </div>
                    <span className={`text-[11px] font-bold ${tx.points >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                      {tx.points > 0 ? "+" : ""}
                      {tx.points}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState dark icon={Sparkles} title={t("admin.members.noPoints")} />
            )}
          </SectionCard>
        </div>
      </div>

      <Modal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        theme="dark"
        size="lg"
        title={t("admin.members.editTitle")}
        description={t("admin.members.editSaved")}
        footer={
          <>
            <Button variant="soft-dark" size="sm" onClick={() => setProfileOpen(false)} disabled={busy === "profile"}>
              {t("common.cancel")}
            </Button>
            <Button size="sm" loading={busy === "profile"} onClick={saveProfile}>
              {t("admin.members.saveProfile")}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            dark
            label={t("admin.members.editFirst")}
            value={profileForm.firstName}
            onChange={(event) => setProfileForm({ ...profileForm, firstName: event.target.value })}
            required
          />
          <Input
            dark
            label={t("admin.members.editLast")}
            value={profileForm.lastName}
            onChange={(event) => setProfileForm({ ...profileForm, lastName: event.target.value })}
            required
          />
          <Input
            dark
            type="email"
            label={t("admin.members.editEmail")}
            value={profileForm.email}
            onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })}
          />
          <Input
            dark
            label={t("admin.members.editPhone")}
            value={profileForm.phone}
            onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })}
          />
          <Input
            dark
            label={t("admin.members.editLocation")}
            value={profileForm.location}
            onChange={(event) => setProfileForm({ ...profileForm, location: event.target.value })}
          />
          <Input
            dark
            label={t("admin.members.editPhoto")}
            value={profileForm.profileImage}
            onChange={(event) => setProfileForm({ ...profileForm, profileImage: event.target.value })}
            placeholder="/uploads/..."
          />
          <div className="sm:col-span-2">
            <Textarea
              dark
              label={t("admin.members.editBio")}
              value={profileForm.bio}
              onChange={(event) => setProfileForm({ ...profileForm, bio: event.target.value })}
              rows={4}
              maxLength={600}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        theme="dark"
        size="sm"
        title={t("admin.members.statusTitle")}
        description={t("admin.members.statusText", { name: `${member.firstName} ${member.lastName}` })}
        footer={
          <>
            <Button variant="soft-dark" size="sm" onClick={() => setStatusOpen(false)} disabled={busy === "status"}>
              {t("common.cancel")}
            </Button>
            <Button size="sm" loading={busy === "status"} onClick={updateStatus}>
              {t("common.save")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            dark
            label={t("admin.members.statusLabel")}
            value={statusForm.status}
            onChange={(event) => setStatusForm({ ...statusForm, status: event.target.value })}
          >
            {STATUS_OPTIONS.map((value) => (
              <option key={value} value={value} className="bg-ink-soft">
                {t(`status.${value}`)}
              </option>
            ))}
          </Select>
          <Textarea
            dark
            label={t("admin.members.statusReason")}
            value={statusForm.reason}
            onChange={(event) => setStatusForm({ ...statusForm, reason: event.target.value })}
            rows={3}
            maxLength={400}
          />
        </div>
      </Modal>

      <Modal
        open={roleOpen}
        onClose={() => setRoleOpen(false)}
        theme="dark"
        size="sm"
        title={t("admin.members.roleTitle")}
        description={t("admin.members.roleText")}
        footer={
          <>
            <Button variant="soft-dark" size="sm" onClick={() => setRoleOpen(false)} disabled={busy === "role"}>
              {t("common.cancel")}
            </Button>
            <Button size="sm" loading={busy === "role"} onClick={updateRole}>
              {t("common.save")}
            </Button>
          </>
        }
      >
        <Select
          dark
          label={t("admin.members.roleLabel")}
          value={roleValue}
          onChange={(event) => setRoleValue(event.target.value)}
        >
          <option value="member" className="bg-ink-soft">{t("status.member")}</option>
          <option value="admin" className="bg-ink-soft">{t("status.admin")}</option>
        </Select>
        <p className="mt-3 rounded-xl border border-gold/20 bg-gold/[0.05] px-3.5 py-2.5 text-[10px] leading-relaxed text-white/40">
          {t("admin.settings.founderNote")}
        </p>
      </Modal>

      <Modal
        open={pointsOpen}
        onClose={() => setPointsOpen(false)}
        theme="dark"
        size="sm"
        title={t("admin.members.pointsTitle")}
        description={t("admin.members.pointsText")}
        footer={
          <>
            <Button variant="soft-dark" size="sm" onClick={() => setPointsOpen(false)} disabled={busy === "points"}>
              {t("common.cancel")}
            </Button>
            <Button size="sm" loading={busy === "points"} onClick={adjustPoints}>
              {t("common.save")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3">
            <span className="text-[10.5px] text-white/40">{t("dashboard.balance")}</span>
            <span className="font-display text-xl text-gold-light">{formatNumber(member.points)}</span>
          </div>
          <Input
            dark
            type="number"
            label={t("admin.members.pointsAmount")}
            value={pointsForm.points}
            onChange={(event) => setPointsForm({ ...pointsForm, points: event.target.value })}
          />
          <Select
            dark
            label={t("admin.members.pointsType")}
            value={pointsForm.type}
            onChange={(event) => setPointsForm({ ...pointsForm, type: event.target.value })}
          >
            {POINT_TYPES.map((value) => (
              <option key={value} value={value} className="bg-ink-soft">
                {value === "bonus"
                  ? t("admin.points.typeBonus")
                  : value === "penalty"
                    ? t("admin.points.typePenalty")
                    : t("admin.points.typeAdjustment")}
              </option>
            ))}
          </Select>
          <Textarea
            dark
            label={t("admin.members.pointsReason")}
            value={pointsForm.description}
            onChange={(event) => setPointsForm({ ...pointsForm, description: event.target.value })}
            rows={3}
            maxLength={400}
            placeholder={t("admin.members.pointsReasonPlaceholder")}
          />
        </div>
      </Modal>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        theme="dark"
        size="sm"
        title={t("admin.members.resetTitle")}
        description={t("admin.members.resetText", { name: `${member.firstName} ${member.lastName}` })}
        footer={
          <>
            <Button variant="soft-dark" size="sm" onClick={() => setResetOpen(false)} disabled={busy === "reset"}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" size="sm" icon={KeyRound} loading={busy === "reset"} onClick={resetPassword}>
              {t("admin.members.confirmReset")}
            </Button>
          </>
        }
      >
        <p className="rounded-xl border border-red-400/15 bg-red-400/[0.05] px-3.5 py-3 text-[10.5px] leading-relaxed text-white/45">
          {t("admin.members.resetWarning")}
        </p>
      </Modal>

      <Modal
        open={Boolean(credentials)}
        onClose={() => setCredentials(null)}
        theme="dark"
        size="sm"
        title={t("admin.members.resetDone")}
        description={t("admin.applications.credentialsText")}
        footer={
          <Button size="sm" onClick={() => setCredentials(null)}>
            {t("common.close")}
          </Button>
        }
      >
        {credentials && (
          <div className="space-y-2.5">
            {[
              { label: t("dashboard.username"), value: credentials.username },
              { label: t("admin.applications.tempPassword"), value: credentials.tempPassword },
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
                  onClick={() => copy(item.value)}
                  className="rounded-full border border-white/10 p-1.5 text-white/40 transition hover:border-gold/40 hover:text-cream"
                  aria-label={t("common.copy")}
                >
                  <Copy size={12} />
                </button>
              </div>
            ))}
            <p className="rounded-xl border border-gold/20 bg-gold/[0.05] px-3.5 py-2.5 text-[10px] leading-relaxed text-white/40">
              {t("admin.members.resetWarning")}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
