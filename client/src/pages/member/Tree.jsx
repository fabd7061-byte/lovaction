import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, GitBranch, Network, Sparkles, Users } from "lucide-react";
import Avatar from "../../components/ui/Avatar.jsx";
import Button from "../../components/ui/Button.jsx";
import { EmptyState } from "../../components/ui/Feedback.jsx";
import { PageLoader } from "../../components/ui/Spinner.jsx";
import PageHeader, { SectionCard } from "../../components/PageHeader.jsx";
import MemberTree from "../../components/MemberTree.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import api, { apiError } from "../../services/api.js";
import usePageMeta from "../../utils/usePageMeta.js";

export default function Tree() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  usePageMeta(t("dashboard.treeTitle"));

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/referrals/tree");
      setData(response.data);
    } catch (err) {
      setError(apiError(err, t("common.errorText")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <PageLoader label={t("common.loading")} />;
  if (error) {
    return (
      <SectionCard className="py-16 text-center">
        <p className="text-sm text-ink/55">{error}</p>
        <Button className="mt-5" variant="outline" onClick={load}>
          {t("common.retry")}
        </Button>
      </SectionCard>
    );
  }

  const ancestors = data?.ancestors || [];
  const currentUserId = data?.currentUserId || user?.id;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("dashboard.nav.tree")}
        title={t("dashboard.treeTitle")}
        text={t("dashboard.treeSubtitle")}
        actions={
          <>
            <Button as={Link} to="/dashboard/referrals" variant="outline" size="sm" icon={Users}>
              {t("dashboard.nav.referrals")}
            </Button>
            <Button as={Link} to="/dashboard/ranking" size="sm" icon={Sparkles}>
              {t("dashboard.nav.ranking")}
            </Button>
          </>
        }
      />

      <SectionCard>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold-dark">
              <GitBranch size={17} />
            </span>
            <div>
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-gold-dark/70">
                {t("dashboard.position")}
              </p>
              <p className="mt-1 text-[12px] text-ink/50">{t("dashboard.pathText")}</p>
            </div>
          </div>
          <p className="text-[10.5px] text-ink/35">{t("dashboard.treeHint")}</p>
        </div>

        {ancestors.length ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {ancestors.map((person, index) => {
              const isSelf = String(person.id) === String(currentUserId);
              return (
                <div key={person.id} className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-2.5 rounded-2xl border px-3 py-2 ${
                      isSelf ? "border-gold/40 bg-gold/[0.07]" : "border-ink/[0.07] bg-cream/60"
                    }`}
                  >
                    <Avatar
                      src={person.profileImage}
                      firstName={person.firstName}
                      lastName={person.lastName}
                      size="xs"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold text-ink/80">
                        {isSelf ? t("dashboard.yourCard") : person.fullName}
                      </p>
                      <p className="truncate text-[9px] uppercase tracking-[0.08em] text-ink/35">
                        {person.role === "founder" ? t("dashboard.root") : `@${person.username}`}
                      </p>
                    </div>
                  </div>
                  {index < ancestors.length - 1 && <ArrowRight size={12} className="shrink-0 text-gold/60" />}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState icon={Network} title={t("dashboard.noTree")} />
          </div>
        )}
      </SectionCard>

      <MemberTree tree={data?.tree || []} currentUserId={currentUserId} focusId={currentUserId} />
    </div>
  );
}
