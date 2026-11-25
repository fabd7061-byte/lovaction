import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api.js";

const SiteContext = createContext(null);

export const FALLBACK_SETTINGS = {
  orgName: "Lovaction Ministries",
  motto: "Love in Action, Hope for All",
  email: "hello@lovactionministries.org",
  phone: "+250 788 456 780",
  address: "KG 11 Ave, Remera, Kigali, Rwanda",
  socials: {
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
    twitter: "https://x.com",
    youtube: "https://youtube.com",
  },
  pointsPerReferral: 10,
  rankingMetric: "referrals",
  allowPublicLeaderboard: true,
  allowPublicMembers: true,
  joinEnabled: true,
  foundedYear: 2019,
};

export const FALLBACK_STATS = {
  members: 0,
  referrals: 0,
  news: 0,
  gallery: 0,
  albums: 0,
  yearsOfService: 7,
  pointsEarned: 0,
  foundedYear: 2019,
};

export function SiteProvider({ children }) {
  const [settings, setSettings] = useState(FALLBACK_SETTINGS);
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [loading, setLoading] = useState(true);

  const refreshSite = useCallback(async () => {
    try {
      const [settingsRes, statsRes] = await Promise.allSettled([
        api.get("/settings"),
        api.get("/public/stats"),
      ]);
      if (settingsRes.status === "fulfilled") {
        setSettings({ ...FALLBACK_SETTINGS, ...settingsRes.value.data.settings });
      }
      if (statsRes.status === "fulfilled") {
        setStats({ ...FALLBACK_STATS, ...statsRes.value.data.stats });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSite();
  }, [refreshSite]);

  const value = useMemo(
    () => ({ settings, stats, loading, refreshSite, setSettings, setStats }),
    [settings, stats, loading, refreshSite]
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const context = useContext(SiteContext);
  if (!context) throw new Error("useSite must be used inside SiteProvider");
  return context;
}
