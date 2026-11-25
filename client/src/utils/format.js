export function initials(firstName = "", lastName = "") {
  const a = String(firstName).trim()[0] || "";
  const b = String(lastName).trim()[0] || "";
  return `${a}${b}`.toUpperCase() || "LM";
}

export function fullName(person) {
  if (!person) return "—";
  return person.fullName || `${person.firstName || ""} ${person.lastName || ""}`.trim() || "—";
}

export function formatDate(value, lang = "en", options = {}) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(lang === "rw" ? "en-GB" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  }).format(date);
}

export function formatDateTime(value, lang = "en") {
  if (!value) return "—";
  const date = new Date(value);
  return new Intl.DateTimeFormat(lang === "rw" ? "en-GB" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Number(value) || 0);
}

export function relativeTime(value, lang = "en") {
  if (!value) return "";
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const mins = Math.round(diff / 60000);
  const hours = Math.round(diff / 3600000);
  const days = Math.round(diff / 86400000);

  if (lang === "rw") {
    if (mins < 1) return "Ubu";
    if (mins < 60) return `Hashize iminota ${mins}`;
    if (hours < 24) return `Hashize amasaha ${hours}`;
    if (days === 1) return "Ejo hashize";
    if (days < 30) return `Hashize iminsi ${days}`;
    return formatDate(value, lang);
  }

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return formatDate(value, lang);
}

export function statusTone(status) {
  const map = {
    active: "green",
    approved: "green",
    published: "green",
    replied: "green",
    pending: "amber",
    under_review: "blue",
    draft: "neutral",
    new: "red",
    suspended: "red",
    rejected: "red",
    inactive: "neutral",
    read: "blue",
    founder: "gold",
    admin: "red",
    member: "neutral",
  };
  return map[status] || "neutral";
}

export function slugToTitle(value = "") {
  return String(value).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(area);
  return ok;
}
