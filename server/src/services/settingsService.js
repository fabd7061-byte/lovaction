import Settings from "../models/Settings.js";

const DEFAULTS = {
  key: "main",
  orgName: "Lovaction Ministries",
  motto: "Love in Action, Hope for All",
  email: "hello@lovactionministries.org",
  phone: "+250 788 000 000",
  address: "Kigali, Rwanda",
  pointsPerReferral: 10,
  rankingMetric: "referrals",
  allowPublicLeaderboard: true,
  allowPublicMembers: true,
  joinEnabled: true,
  foundedYear: 2019,
};

export async function getSettings() {
  let settings = await Settings.findOne({ key: "main" });
  if (!settings) settings = await Settings.create(DEFAULTS);
  return settings;
}

export function publicSettings(settings) {
  return {
    orgName: settings.orgName,
    motto: settings.motto,
    email: settings.email,
    phone: settings.phone,
    address: settings.address,
    socials: settings.socials,
    pointsPerReferral: settings.pointsPerReferral,
    rankingMetric: settings.rankingMetric,
    allowPublicLeaderboard: settings.allowPublicLeaderboard,
    allowPublicMembers: settings.allowPublicMembers,
    joinEnabled: settings.joinEnabled,
    foundedYear: settings.foundedYear,
  };
}
