import { asyncHandler } from "../utils/ApiError.js";
import { getSettings, publicSettings } from "../services/settingsService.js";
import { logAudit } from "../utils/audit.js";

export const getPublicSettings = asyncHandler(async (_req, res) => {
  const settings = await getSettings();
  res.json({ success: true, settings: publicSettings(settings) });
});

export const getAdminSettings = asyncHandler(async (_req, res) => {
  const settings = await getSettings();
  res.json({ success: true, settings });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  const allowed = [
    "orgName",
    "motto",
    "email",
    "phone",
    "address",
    "socials",
    "pointsPerReferral",
    "rankingMetric",
    "allowPublicLeaderboard",
    "allowPublicMembers",
    "joinEnabled",
    "foundedYear",
  ];

  const changed = [];
  for (const key of allowed) {
    if (req.body[key] === undefined) continue;
    if (key === "socials") {
      settings.socials = { ...settings.socials, ...req.body.socials };
      changed.push("socials");
    } else {
      settings[key] = req.body[key];
      changed.push(key);
    }
  }
  await settings.save();

  await logAudit({
    actor: req.user,
    action: "settings.updated",
    entityType: "settings",
    entityId: settings._id,
    description: `${req.user.firstName} ${req.user.lastName} updated organization settings (${changed.join(", ")}).`,
    meta: { changed },
    ip: req.ip,
  });

  res.json({
    success: true,
    message: "Settings saved.",
    settings: publicSettings(settings),
  });
});
