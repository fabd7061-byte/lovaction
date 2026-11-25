import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Application from "../models/Application.js";
import Referral from "../models/Referral.js";
import PointTransaction from "../models/PointTransaction.js";
import News from "../models/News.js";
import GalleryItem from "../models/GalleryItem.js";
import ContactMessage from "../models/ContactMessage.js";
import AuditLog from "../models/AuditLog.js";
import Notification from "../models/Notification.js";
import Settings from "../models/Settings.js";
import { connectDB, disconnectDB } from "../config/db.js";
import slugifyBase from "./slugifyBase.js";

const DAY = 86400000;
const MEMBER_PASSWORD = "Member@2026";

const image = (id, w = 1400) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const IMG = {
  classroom: image("photo-1509062522246-3755977927d7"),
  children: image("photo-1488521787991-ed7bbaae773c"),
  books: image("photo-1497486751825-1233686d5d80"),
  kids: image("photo-1509099836639-18ba1795216d"),
  students: image("photo-1522202176988-66273c2fd55f"),
  graduation: image("photo-1523050854058-8df90110c9f1"),
  meeting: image("photo-1531482615713-2afd69097998"),
  volunteers: image("photo-1559027615-cd4628902d4a"),
  volunteer: image("photo-1593113598332-cd288d649433"),
  child: image("photo-1504151932400-72d4384f04b3"),
  child2: image("photo-1542810634-71277d95dcbb"),
  hands: image("photo-1469571486292-0ba58a3f068b"),
  kids2: image("photo-1526976668912-1a811878dd37"),
  kids3: image("photo-1517486808906-6ca8b3f04846"),
  team: image("photo-1600880292203-757bb62b4baf"),
  school: image("photo-1546410531-bb4caa6b424d"),
  meeting2: image("photo-1556761175-b413da4baf72"),
  class2: image("photo-1524178232363-1fb2b075b655"),
};

const PEOPLE = [
  { key: "founder", first: "Emmanuel", last: "Rwema", role: "founder", parent: null, days: 720, location: "Kigali, Rwanda", username: "founder.lovaction" },
  { key: "aline", first: "Aline", last: "Uwase", role: "admin", parent: "founder", days: 560, location: "Kigali, Rwanda", username: "aline.uwase" },
  { key: "eric", first: "Eric", last: "Habimana", role: "admin", parent: "founder", days: 540, location: "Kigali, Rwanda", username: "eric.habimana" },
  { key: "jean", first: "Jean", last: "Mugisha", role: "member", parent: "aline", days: 450, location: "Kicukiro, Kigali", username: "jean.mugisha" },
  { key: "alice", first: "Alice", last: "Uwase", role: "member", parent: "aline", days: 430, location: "Gasabo, Kigali", username: "alice.uwase" },
  { key: "mary", first: "Mary Grace", last: "Ishimwe", role: "member", parent: "eric", days: 440, location: "Nyarugenge, Kigali", username: "marygrace.ishimwe" },
  { key: "david", first: "David", last: "Habimana", role: "member", parent: "eric", days: 420, location: "Huye, Rwanda", username: "david.habimana" },
  { key: "peter", first: "Peter", last: "Nkurunziza", role: "member", parent: "jean", days: 380, location: "Kicukiro, Kigali", username: "peter.nkurunziza" },
  { key: "emmanuel", first: "Emmanuel", last: "Ndayisaba", role: "member", parent: "jean", days: 360, location: "Musanze, Rwanda", username: "emmanuel.ndayisaba" },
  { key: "sandrine", first: "Sandrine", last: "Ingabire", role: "member", parent: "jean", days: 340, location: "Kigali, Rwanda", username: "sandrine.ingabire" },
  { key: "patrick", first: "Patrick", last: "Ntwari", role: "member", parent: "jean", days: 320, location: "Rwamagana, Rwanda", username: "patrick.ntwari" },
  { key: "diane", first: "Diane", last: "Umutoni", role: "member", parent: "jean", days: 300, location: "Kigali, Rwanda", username: "diane.umutoni" },
  { key: "grace", first: "Grace", last: "Uwera", role: "member", parent: "alice", days: 310, location: "Gasabo, Kigali", username: "grace.uwera" },
  { key: "olivier", first: "Olivier", last: "Nshimiyimana", role: "member", parent: "alice", days: 290, location: "Nyamagabe, Rwanda", username: "olivier.nshimiyimana" },
  { key: "fiona", first: "Fiona", last: "Umutesi", role: "member", parent: "alice", days: 260, location: "Kigali, Rwanda", username: "fiona.umutesi" },
  { key: "fabrice", first: "Fabrice", last: "Niyonzima", role: "member", parent: "alice", days: 240, location: "Muhanga, Rwanda", username: "fabrice.niyonzima" },
  { key: "chantal", first: "Chantal", last: "Uwamahoro", role: "member", parent: "peter", days: 250, location: "Kicukiro, Kigali", username: "chantal.uwamahoro" },
  { key: "gilbert", first: "Gilbert", last: "Munyaneza", role: "member", parent: "peter", days: 230, location: "Rwamagana, Rwanda", username: "gilbert.munyaneza" },
  { key: "yvette", first: "Yvette", last: "Uwimana", role: "member", parent: "mary", days: 300, location: "Nyarugenge, Kigali", username: "yvette.uwimana" },
  { key: "innocent", first: "Innocent", last: "Nsengimana", role: "member", parent: "mary", days: 280, location: "Kigali, Rwanda", username: "innocent.nsengimana" },
  { key: "josiane", first: "Josiane", last: "Mukandayisenga", role: "member", parent: "mary", days: 260, location: "Kayonza, Rwanda", username: "josiane.mukandayisenga" },
  { key: "claude", first: "Claude", last: "Niyigena", role: "member", parent: "mary", days: 240, location: "Kigali, Rwanda", username: "claude.niyigena" },
  { key: "solange", first: "Solange", last: "Nyirahabimana", role: "member", parent: "mary", days: 200, location: "Huye, Rwanda", username: "solange.nyirahabimana" },
  { key: "theogene", first: "Theogene", last: "Nsabimana", role: "member", parent: "david", days: 210, location: "Nyanza, Rwanda", username: "theogene.nsabimana", status: "inactive" },
  { key: "kevin", first: "Kevin", last: "Ganza", role: "member", parent: "emmanuel", days: 160, location: "Musanze, Rwanda", username: "kevin.ganza" },
  { key: "liliane", first: "Liliane", last: "Uwera", role: "member", parent: "patrick", days: 150, location: "Rwamagana, Rwanda", username: "liliane.uwera" },
  { key: "ariane", first: "Ariane", last: "Umuhire", role: "member", parent: "fiona", days: 140, location: "Kigali, Rwanda", username: "ariane.umuhire" },
  { key: "ange", first: "Ange", last: "Mutoni", role: "member", parent: "claude", days: 100, location: "Kigali, Rwanda", username: "ange.mutoni" },
  { key: "didier", first: "Didier", last: "Ndayambaje", role: "member", parent: "claude", days: 75, location: "Gicumbi, Rwanda", username: "didier.ndayambaje" },
  { key: "carine", first: "Carine", last: "Uwineza", role: "member", parent: "claude", days: 50, location: "Kigali, Rwanda", username: "carine.uwineza" },
  { key: "thierry", first: "Thierry", last: "Ndayisenga", role: "member", parent: "sandrine", days: 120, location: "Gakenke, Rwanda", username: "thierry.ndayisenga" },
  { key: "peace", first: "Peace", last: "Mukamana", role: "member", parent: "sandrine", days: 90, location: "Kigali, Rwanda", username: "peace.mukamana" },
  { key: "emelyne", first: "Emelyne", last: "Uwase", role: "member", parent: "grace", days: 30, location: "Kigali, Rwanda", username: "emelyne.uwase" },
  { key: "cedric", first: "Cedric", last: "Iyamuremye", role: "member", parent: "ange", days: 1, location: "Kigali, Rwanda", username: "cedric.iyamuremye" },
  { key: "sandra", first: "Sandra", last: "Mutesi", role: "member", parent: "josiane", days: 0, location: "Kigali, Rwanda", username: "sandra.mutesi" },
  { key: "ivan", first: "Ivan", last: "Niyonsaba", role: "member", parent: "didier", days: 0, location: "Kigali, Rwanda", username: "ivan.niyonsaba" },
];

const REASONS = [
  "I have seen the love Lovaction shows to children in my neighbourhood and I want to be part of this mission. I would like to help with school visits and encourage other young people to join.",
  "I grew up with very little support and I know how much a school uniform or a notebook can change a child's confidence. Lovaction's values match what I want to do with my life.",
  "I am a teacher and I want to volunteer my time to help children who are falling behind. I believe every child deserves a fair chance to study and dream.",
  "My friend told me about the monthly home visits and the school fee support. I want to serve families with compassion and learn how to organize community activities.",
  "I want to support the ministry with my skills and time. Love in action means doing something practical for a neighbour, and I would be honoured to join.",
  "I am inspired by the vision of safe and hopeful childhoods. I want to help with outreach and be a bridge between Lovaction and families who need support.",
  "I want to join a community that is transparent and serious about helping children. I can help with events, translation and welcoming new members.",
];

const PENDING_APPLICATIONS = [
  { first: "Grace", last: "Mukantabana", email: "grace.mukantabana@gmail.com", phone: "+250 789 301 101", referrer: "jean.mugisha", status: "pending", hoursAgo: 3, reason: 0 },
  { first: "Noel", last: "Hakizimana", email: "noel.hakizimana@gmail.com", phone: "+250 789 301 102", referrer: "marygrace.ishimwe", status: "pending", hoursAgo: 20, reason: 2 },
  { first: "Peace", last: "Uwase", email: "peace.uwase@gmail.com", phone: "+250 789 301 103", referrer: "aline.uwase", status: "pending", hoursAgo: 32, reason: 3 },
  { first: "Didier", last: "Nkurunziza", email: "didier.nkurunziza@gmail.com", phone: "+250 789 301 104", referrer: "alice.uwase", status: "under_review", hoursAgo: 26, reason: 5 },
  { first: "Esther", last: "Umutoni", email: "esther.umutoni@gmail.com", phone: "+250 789 301 105", referrer: "jean.mugisha", status: "pending", hoursAgo: 6, reason: 1 },
  { first: "Fabrice", last: "Ndikumana", email: "fabrice.ndikumana@gmail.com", phone: "+250 789 301 106", referrer: "claude.niyigena", status: "pending", hoursAgo: 72, reason: 4 },
  { first: "Josiane", last: "Uwera", email: "josiane.uwera@gmail.com", phone: "+250 789 301 107", referrer: "marygrace.ishimwe", status: "under_review", hoursAgo: 48, reason: 6 },
  { first: "Samuel", last: "Ndayisaba", email: "samuel.ndayisaba@gmail.com", phone: "+250 789 301 108", referrer: "david.habimana", status: "rejected", hoursAgo: 120, reason: 0, rejectionReason: "The referral could not be verified and the application was incomplete. Please reapply with an active member's username." },
  { first: "Alice", last: "Mutoni", email: "alice.mutoni@gmail.com", phone: "+250 789 301 109", referrer: "fiona.umutesi", status: "rejected", hoursAgo: 190, reason: 3, rejectionReason: "The contact details provided did not match the information confirmed with the inviting member." },
  { first: "Eric", last: "Nshuti", email: "eric.nshuti@gmail.com", phone: "+250 789 301 110", referrer: "peter.nkurunziza", status: "pending", hoursAgo: 96, reason: 2 },
  { first: "Marie Claire", last: "Uwase", email: "mc.uwase@gmail.com", phone: "+250 789 301 111", referrer: "sandrine.ingabire", status: "pending", hoursAgo: 9, reason: 5 },
  { first: "Patrick", last: "Kalisa", email: "patrick.kalisa@gmail.com", phone: "+250 789 301 112", referrer: "grace.uwera", status: "pending", hoursAgo: 30, reason: 1 },
  { first: "Diane", last: "Nyirabazungu", email: "diane.nyirabazungu@gmail.com", phone: "+250 789 301 113", referrer: "claude.niyigena", status: "rejected", hoursAgo: 280, reason: 4, rejectionReason: "Duplicate contact information was detected. If this was an error, please contact the administration." },
];

const NEWS_ITEMS = [
  {
    title: "Forty children receive school kits in Kigali",
    category: "Education",
    status: "published",
    daysAgo: 5,
    cover: IMG.books,
    views: 342,
    excerpt:
      "Exercise books, pens, uniforms and school bags were handed to 40 children across three neighbourhoods in Kigali.",
    content:
      "There is a special kind of joy in a child holding a brand-new exercise book. On Saturday, our volunteers gathered in Kigali to prepare and distribute school kits for 40 children in three neighbourhoods.\n\nEach kit contained exercise books, pens, pencils, a geometry set, and where needed, a school uniform and bag. But the most important part of the day was not inside the bags. It was the conversations: parents telling us how far the school-term budget had to stretch, children showing us their favourite subjects, and neighbours asking how they could help.\n\n“I was worried about the second term,” one mother told us. “You have taken away one heavy thing from my heart.”\n\nThis work is only possible because our members give, invite others, and show up. Every referral and every contribution becomes notebooks, transport, and the simple dignity of a child arriving at school prepared.\n\nOur next distribution is planned for next month. If you would like to volunteer or refer a family who needs support, reach out through the contact page or speak with a member of the community.",
  },
  {
    title: "Our community grows past 30 members",
    category: "Announcements",
    status: "published",
    daysAgo: 2,
    cover: IMG.students,
    views: 189,
    excerpt:
      "A new generation of members joins the Lovaction family through referrals from people they trust.",
    content:
      "This week, Lovaction Ministries welcomed several new members into its community. What began as a small circle of volunteers is now a growing network of teachers, students, parents and neighbours united by one belief: love should be visible.\n\nMembers are invited by people they know. That is intentional. Belonging to Lovaction means being known, supported and accountable to one another. Each new member brings a new skill, a new neighbourhood, and a new opportunity to care well.\n\nTo our newest members: welcome. You are joining a community where every person has value and every small action matters. To the members who invited them: thank you for opening the door.\n\nIf you have not yet invited someone, this is your invitation. Share your username with a friend, neighbour or colleague who shares our values. The Join page is open.",
  },
  {
    title: "What we learned visiting families in Nyamirambo",
    category: "Impact",
    status: "published",
    daysAgo: 9,
    cover: IMG.child2,
    views: 276,
    excerpt:
      "Our outreach team spent a Saturday listening to families. The needs are practical, and so is the hope.",
    content:
      "Home visits are where Lovaction learns what children actually need. On Saturday, a small team spent the morning in Nyamirambo, visiting five families connected to our school-support programme.\n\nWe listened. We took notes. More importantly, we were reminded that poverty is often quiet. There are small, specific pressures that never show up in a report: a broken pair of shoes shared between siblings, a grandmother caring for three children on a pension, a student studying at night by the light of a phone.\n\nAt one home, a mother showed us a neat stack of school books kept in a cloth bag hanging from a nail. “These are all they have,” she said. “But they are proud of them.”\n\nOur next steps are concrete: school shoes for two families, a solar study lamp for another, and follow-up conversations with teachers. We will report back on what these practical steps change.\n\nThe home-visit team is volunteer-led. If you are a member and would like to join a future visit, please contact the community coordinators in your dashboard.",
  },
  {
    title: "Volunteers prepare 200 school-fee support envelopes",
    category: "Community",
    status: "published",
    daysAgo: 14,
    cover: IMG.hands,
    views: 231,
    excerpt:
      "A morning of sorting, counting and prayer as families prepare for the new term.",
    content:
      "The community centre smelled of paper and coffee as 14 volunteers gathered to prepare school-fee support envelopes. Each envelope is a small promise: a family will not have to choose between rent and a child's education this term.\n\nWe reviewed every application together, double-checked school references, and agreed on the support plan for each household. Transparency is one of our values, and it is not only a word on a page. It shapes how we make decisions.\n\nBy noon, 200 envelopes were ready. They represent children we may never meet in person on the day their fees are paid, and that is fine. The work is not about being seen. It is about being faithful with what has been entrusted to us.\n\nThank you to every member whose referrals, contributions and prayers made this morning possible.",
  },
  {
    title: "Hope on the first day of school",
    category: "Education",
    status: "published",
    daysAgo: 21,
    cover: IMG.classroom,
    views: 418,
    excerpt:
      "New uniforms, sharpened pencils and a message for every child: you are worth the effort.",
    content:
      "First-day photos usually show brand-new uniforms and shy smiles. In the communities where we serve, the first day can also mean anxiety: Will I be sent home for missing materials? Will my teacher think I do not belong?\n\nThis year, 27 children connected to Lovaction started school with the materials and fees they needed. A few also received a morning meal on their first day, thanks to the school partnership we are building.\n\nEducation is more than books. It is confidence, safety, and the chance to be seen as a child with a future. One of our members, who is a teacher, put it this way: “When a child arrives prepared, they participate. They raise their hand. It changes the whole year.”\n\nAs we look to the next term, we are assessing new requests. Members can refer a family through the Join and Contact pages, or speak directly with an administrator.",
  },
  {
    title: "Upcoming: Love in Action community day",
    category: "Events",
    status: "draft",
    daysAgo: 1,
    cover: IMG.kids2,
    views: 0,
    excerpt:
      "A full day of sharing, games, food and practical support for families in our community.",
    content:
      "Plans are underway for the next Love in Action community day. We are preparing a day of shared meals, games for children, a health information corner, and a small market of donated clothing and school materials.\n\nThis article is still being prepared. Event details will be announced to members first.",
  },
  {
    title: "Faith in action: a word from our founder",
    category: "Faith",
    status: "published",
    daysAgo: 30,
    cover: IMG.kids3,
    views: 512,
    excerpt:
      "“Love is not only a feeling. It is a decision to move toward someone else's need.”",
    content:
      "When we started Lovaction Ministries, we had no office, no database and no budget. We had a conviction: faith without action is incomplete, and love that stays comfortable is not yet love.\n\nSince then, we have been shaped by children, parents and volunteers who teach us what it means to hope. A child who can stay in school. A mother who can breathe a little easier. A young person who discovers that they are needed.\n\nI am often asked what success looks like for this ministry. It is not numbers alone. It is a community where people know one another, where generosity is normal, and where the most vulnerable child is never invisible.\n\nTo every member: thank you for putting love into action. To those considering joining: come as you are. You do not need to be perfect. You need only be willing.\n\nMay we continue to hope for all. — Emmanuel Rwema, Founder",
  },
];

const GALLERY = [
  { title: "New exercise books for P1 learners", album: "School Support", imageUrl: IMG.classroom, caption: "Volunteers prepare exercise books before the start of the second term.", daysAgo: 2 },
  { title: "Backpacks ready for the new term", album: "School Support", imageUrl: IMG.kids, caption: "Bags, uniforms and shoeboxes sorted by size for 40 children.", daysAgo: 5 },
  { title: "Reading hour at the community centre", album: "School Support", imageUrl: IMG.books, caption: "Saturday reading hour — the quietest and loudest part of our week.", daysAgo: 12 },
  { title: "School-fee support envelopes", album: "School Support", imageUrl: IMG.school, caption: "Every envelope reviewed and recorded before distribution.", daysAgo: 36 },
  { title: "Saturday community clean-up", album: "Community Activities", imageUrl: IMG.volunteers, caption: "Members and neighbours cleaning the shared paths around the market.", daysAgo: 1 },
  { title: "Neighbours sharing a meal", album: "Community Activities", imageUrl: IMG.children, caption: "A simple shared meal after the clean-up.", daysAgo: 8 },
  { title: "Children at play", album: "Community Activities", imageUrl: IMG.kids3, caption: "No programme, no camera directions — just a happy afternoon.", daysAgo: 18 },
  { title: "Home visit in Nyamirambo", album: "Outreach Activities", imageUrl: IMG.child2, caption: "Listening to families during our monthly home-visit Saturday.", daysAgo: 9 },
  { title: "Delivering basic supplies", album: "Outreach Activities", imageUrl: IMG.volunteer, caption: "Soap, flour and cooking oil delivered to four households.", daysAgo: 16 },
  { title: "Listening to family needs", album: "Outreach Activities", imageUrl: IMG.child, caption: "A quiet conversation on a front step can reveal what a form cannot.", daysAgo: 25 },
  { title: "Monthly volunteer planning", album: "Meetings", imageUrl: IMG.meeting, caption: "Planning school visits, transport and referral follow-ups.", daysAgo: 6 },
  { title: "Committee review session", album: "Meetings", imageUrl: IMG.meeting2, caption: "The review committee goes through membership applications together.", daysAgo: 20 },
  { title: "Love in Action community day", album: "Events", imageUrl: IMG.kids2, caption: "The last community day brought over 100 neighbours together.", daysAgo: 45 },
  { title: "Welcoming our newest members", album: "Members", imageUrl: IMG.students, caption: "New members at the monthly welcome circle.", daysAgo: 3 },
  { title: "Annual prayer breakfast", album: "Events", imageUrl: IMG.graduation, caption: "A morning of gratitude and planning for the year ahead.", daysAgo: 60, status: "draft" },
  { title: "Classroom support in Huye", album: "School Support", imageUrl: IMG.class2, caption: "Members visited a partner school in Huye to review support needs.", daysAgo: 55, status: "draft" },
];

const CONTACTS = [
  { name: "Sarah Thompson", email: "sarah.thompson@example.org", phone: "+44 7700 900123", subject: "Partnership with a children's charity", message: "Hello Lovaction team, I lead a small education charity in the UK and we would love to explore a partnership around school materials. Could we schedule a call in the coming weeks?", status: "new", hoursAgo: 2 },
  { name: "Jean-Paul Nsengimana", email: "jp.nsengimana@gmail.com", phone: "+250 788 555 120", subject: "School fee support for my daughter", message: "Good afternoon. My daughter is in P4 and I have struggled to pay the remaining school fees this term. A neighbour told me about Lovaction. Please let me know if there is a way to apply for support.", status: "new", hoursAgo: 8 },
  { name: "Aline Mukamana", email: "aline.mukamana@gmail.com", phone: "+250 788 555 121", subject: "I would like to volunteer", message: "I am a final-year social work student in Kigali and would like to volunteer on weekends. I can help with home visits, translation and record keeping.", status: "read", hoursAgo: 40 },
  { name: "David Rugamba", email: "david.rugamba@example.com", phone: "+250 788 555 122", subject: "How do I become a member?", message: "I was referred by a friend but I am not sure about the process. Could you explain the steps and the requirements for joining?", status: "replied", hoursAgo: 110 },
  { name: "Grace Mutoni", email: "grace.mutoni@gmail.com", phone: "+250 788 555 123", subject: "Thank you for the school kits", message: "My two boys came home with new books and could not stop talking about it. Thank you and may God bless everyone who contributed.", status: "read", hoursAgo: 160 },
];

function daysAgo(days, hours = 0) {
  return new Date(Date.now() - days * DAY - hours * 3600000);
}

function phoneFor(index) {
  return `+250 788 ${String(505100 + index * 137).slice(-6)}`;
}

function safeDate(d) {
  return new Date(d);
}

function buildNewsSlug(title) {
  return slugifyBase(title);
}

async function insertDated(Model, docs) {
  if (!docs.length) return;
  const now = new Date();
  const withTimestamps = docs.map((doc) => ({
    _id: doc._id || new mongoose.Types.ObjectId(),
    createdAt: doc.createdAt || now,
    updatedAt: doc.updatedAt || doc.createdAt || now,
    __v: 0,
    ...doc,
  }));
  await Model.collection.insertMany(withTimestamps, { ordered: false });
}

export async function seedDatabase({ reset = false } = {}) {
  const existing = await User.countDocuments();
  if (existing > 0 && !reset) {
    console.log("  Seed skipped — database already has data.");
    return false;
  }

  if (reset) {
    await Promise.all(
      [
        User,
        Application,
        Referral,
        PointTransaction,
        News,
        GalleryItem,
        ContactMessage,
        AuditLog,
        Notification,
        Settings,
      ].map((Model) => Model.deleteMany({}))
    );
  }

  console.log("  Seeding Lovaction community...");

  const now = new Date();
  const [founderHash, adminHash, memberHash] = await Promise.all([
    bcrypt.hash("Founder@2026", 10),
    bcrypt.hash("Admin@2026", 10),
    bcrypt.hash(MEMBER_PASSWORD, 10),
  ]);

  await Settings.updateOne(
    { key: "main" },
    {
      $set: {
        key: "main",
        orgName: "Lovaction Ministries",
        motto: "Love in Action, Hope for All",
        email: "hello@lovactionministries.org",
        phone: "+250 788 456 780",
        address: "KG 11 Ave, Remera, Kigali, Rwanda",
        socials: {
          facebook: "https://facebook.com/lovactionministries",
          instagram: "https://instagram.com/lovactionministries",
          twitter: "https://x.com/lovactionmin",
          youtube: "https://youtube.com/@lovactionministries",
        },
        pointsPerReferral: 10,
        rankingMetric: "referrals",
        allowPublicLeaderboard: true,
        allowPublicMembers: true,
        joinEnabled: true,
        foundedYear: 2019,
      },
    },
    { upsert: true }
  );

  const userMap = new Map();
  const users = PEOPLE.map((person, index) => {
    const _id = new mongoose.Types.ObjectId();
    const joinedAt = daysAgo(person.days, index % 5);
    const email =
      person.key === "founder"
        ? "founder@lovaction.org"
        : person.key === "aline"
          ? "admin@lovaction.org"
          : person.key === "eric"
            ? "eric.admin@lovaction.org"
            : `${person.username}@lovaction.org`;
    const doc = {
      _id,
      firstName: person.first,
      lastName: person.last,
      username: person.username,
      memberCode: `LOV-${String(index + 1).padStart(4, "0")}`,
      email,
      phone: phoneFor(index + 1),
      password:
        person.role === "founder"
          ? founderHash
          : person.role === "admin"
            ? adminHash
            : memberHash,
      role: person.role,
      status: person.status || "active",
      profileImage: "",
      location: person.location,
      bio:
        person.role === "founder"
          ? "Founder of Lovaction Ministries. " +
            "Believing that every child deserves safety, education and a hopeful future."
          : person.role === "admin"
            ? "Community administrator supporting members, applications and member care."
            : "",
      parentMemberId: null,
      points: 0,
      joinedAt,
      lastLoginAt: null,
      mustChangePassword: false,
      createdAt: joinedAt,
      updatedAt: joinedAt,
    };
    userMap.set(person.key, { ...doc, person });
    return doc;
  });

  for (const person of PEOPLE) {
    if (!person.parent) continue;
    userMap.get(person.key).parentMemberId = userMap.get(person.parent)._id;
    const doc = users.find((u) => u._id.equals(userMap.get(person.key)._id));
    doc.parentMemberId = userMap.get(person.parent)._id;
  }

  await User.collection.insertMany(users);

  const founder = userMap.get("founder");
  const adminIds = [userMap.get("aline")._id, userMap.get("eric")._id];

  // ── Approved applications & referral records ───────────────────────────
  const applications = [];
  const referrals = [];
  const pointEvents = [];
  const auditLogs = [];
  const notifications = [];

  const approvedMembers = PEOPLE.filter(
    (p) => p.role === "member" && p.parent
  );

  approvedMembers.forEach((person, index) => {
    const user = userMap.get(person.key);
    const parent = userMap.get(person.parent);
    const appliedAt = new Date(user.joinedAt.getTime() - 3 * DAY);
    const appId = new mongoose.Types.ObjectId();
    const reviewer = index % 3 === 0 ? adminIds[index % 2] : founder._id;

    applications.push({
      _id: appId,
      firstName: person.first,
      lastName: person.last,
      email: user.email.replace("@lovaction.org", "@gmail.com"),
      phone: `+250 789 ${String(400100 + index * 157).slice(-6)}`,
      reasonForJoining: REASONS[index % REASONS.length],
      referralUsername: parent.username,
      location: person.location,
      message: "",
      profileImage: "",
      status: "approved",
      reviewedBy: reviewer,
      reviewedAt: user.joinedAt,
      rejectionReason: "",
      reviewNote: "",
      createdMemberId: user._id,
      pointsAwarded: 10,
      createdAt: appliedAt,
      updatedAt: user.joinedAt,
      __v: 0,
    });

    referrals.push({
      _id: new mongoose.Types.ObjectId(),
      referrer: parent._id,
      referredMember: user._id,
      application: appId,
      status: "approved",
      pointsAwarded: 10,
      createdAt: appliedAt,
      approvedAt: user.joinedAt,
      updatedAt: user.joinedAt,
      __v: 0,
    });

    pointEvents.push({
      _id: new mongoose.Types.ObjectId(),
      memberId: parent._id,
      type: "referral",
      points: 10,
      description: `New member approved: ${person.first} ${person.last}`,
      relatedMemberId: user._id,
      createdBy: reviewer,
      balanceAfter: 0,
      createdAt: user.joinedAt,
      updatedAt: user.joinedAt,
      __v: 0,
    });
  });

  // Manual point adjustments
  const adjustments = [
    { key: "jean", points: 20, type: "bonus", description: "Bonus for leading the school-kit distribution", days: 18 },
    { key: "jean", points: -5, type: "penalty", description: "Activity report submitted after the deadline", days: 7 },
    { key: "mary", points: 15, type: "bonus", description: "Recognition for organizing the home-visit team", days: 12 },
    { key: "alice", points: 10, type: "bonus", description: "Support with translation during outreach", days: 22 },
    { key: "peter", points: -5, type: "penalty", description: "Incomplete referral information", days: 9 },
    { key: "sandrine", points: 5, type: "bonus", description: "Welcoming new members at the Saturday circle", days: 4 },
  ];

  adjustments.forEach((adj) => {
    const member = userMap.get(adj.key);
    const date = daysAgo(adj.days, 2);
    pointEvents.push({
      _id: new mongoose.Types.ObjectId(),
      memberId: member._id,
      type: adj.type,
      points: adj.points,
      description: adj.description,
      relatedMemberId: null,
      createdBy: founder._id,
      balanceAfter: 0,
      createdAt: date,
      updatedAt: date,
      __v: 0,
    });

    auditLogs.push({
      actor: founder._id,
      actorName: "Emmanuel Rwema",
      action: "points.adjusted",
      entityType: "member",
      entityId: String(member._id),
      description: `Emmanuel Rwema adjusted ${member.firstName} ${member.lastName}'s points by ${adj.points > 0 ? "+" : ""}${adj.points}. Reason: ${adj.description}`,
      meta: { points: adj.points, type: adj.type },
      ip: "127.0.0.1",
      createdAt: date,
      updatedAt: date,
      __v: 0,
    });
  });

  // Calculate running balances and member point totals
  const byMember = new Map();
  pointEvents.forEach((tx) => {
    const key = String(tx.memberId);
    if (!byMember.has(key)) byMember.set(key, []);
    byMember.get(key).push(tx);
  });
  for (const [memberId, txs] of byMember.entries()) {
    txs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    let balance = 0;
    txs.forEach((tx) => {
      balance += tx.points;
      tx.balanceAfter = balance;
    });
    const doc = users.find((u) => String(u._id) === memberId);
    if (doc) doc.points = balance;
  }
  await User.collection.bulkWrite(
    users.map((u) => ({
      updateOne: {
        filter: { _id: u._id },
        update: { $set: { points: u.points } },
      },
    }))
  );

  // ── Pending / rejected applications ───────────────────────────────────
  PENDING_APPLICATIONS.forEach((app, index) => {
    const referrer = PEOPLE.find((p) => p.username === app.referrer);
    const referrerDoc = referrer ? userMap.get(referrer.key) : null;
    const createdAt = new Date(Date.now() - app.hoursAgo * 3600000);
    const appId = new mongoose.Types.ObjectId();
    const status = app.status;

    applications.push({
      _id: appId,
      firstName: app.first,
      lastName: app.last,
      email: app.email,
      phone: app.phone,
      reasonForJoining: REASONS[app.reason],
      referralUsername: app.referrer,
      location: "Kigali, Rwanda",
      message: "",
      profileImage: "",
      status,
      reviewedBy: status === "pending" ? null : adminIds[index % 2],
      reviewedAt: status === "pending" ? null : createdAt,
      rejectionReason: app.rejectionReason || "",
      reviewNote: status === "under_review" ? "Identity and referral being confirmed with the inviting member." : "",
      createdMemberId: null,
      pointsAwarded: 0,
      createdAt,
      updatedAt: createdAt,
      __v: 0,
    });

    if (referrerDoc) {
      referrals.push({
        _id: new mongoose.Types.ObjectId(),
        referrer: referrerDoc._id,
        referredMember: null,
        application: appId,
        status: status === "rejected" ? "rejected" : "pending",
        pointsAwarded: 0,
        createdAt,
        approvedAt: null,
        updatedAt: createdAt,
        __v: 0,
      });
    }

    auditLogs.push({
      actor: null,
      actorName: `${app.first} ${app.last}`,
      action: "application.submitted",
      entityType: "application",
      entityId: String(appId),
      description: `New membership application submitted by ${app.first} ${app.last}, invited by ${app.referrer}.`,
      meta: {},
      ip: "127.0.0.1",
      createdAt,
      updatedAt: createdAt,
      __v: 0,
    });

    if (status === "under_review") {
      auditLogs.push({
        actor: adminIds[index % 2],
        actorName: index % 2 === 0 ? "Aline Uwase" : "Eric Habimana",
        action: "application.under_review",
        entityType: "application",
        entityId: String(appId),
        description: `${index % 2 === 0 ? "Aline Uwase" : "Eric Habimana"} started reviewing ${app.first} ${app.last}'s application.`,
        meta: {},
        ip: "127.0.0.1",
        createdAt: new Date(createdAt.getTime() + 4 * 3600000),
        updatedAt: createdAt,
        __v: 0,
      });
    }
    if (status === "rejected") {
      auditLogs.push({
        actor: adminIds[index % 2],
        actorName: index % 2 === 0 ? "Aline Uwase" : "Eric Habimana",
        action: "application.rejected",
        entityType: "application",
        entityId: String(appId),
        description: `${index % 2 === 0 ? "Aline Uwase" : "Eric Habimana"} rejected ${app.first} ${app.last}'s application. Reason: ${app.rejectionReason}`,
        meta: {},
        ip: "127.0.0.1",
        createdAt: new Date(createdAt.getTime() + 8 * 3600000),
        updatedAt: createdAt,
        __v: 0,
      });
    }

    // Notify admins about the newest pending applications
    if (status === "pending" && app.hoursAgo <= 32) {
      [founder, userMap.get("aline"), userMap.get("eric")].forEach((admin) => {
        notifications.push({
          user: admin._id,
          type: "application",
          title: "New membership application",
          message: `${app.first} ${app.last} applied to join Lovaction Ministries.`,
          link: `/admin/applications/${appId}`,
          read: app.hoursAgo > 20 ? true : false,
          createdAt,
          updatedAt: createdAt,
          __v: 0,
        });
      });
    }
  });

  // Approval audit logs for recent members
  approvedMembers.slice(-8).forEach((person, i) => {
    const user = userMap.get(person.key);
    const reviewer = i % 2 === 0 ? adminIds[0] : founder._id;
    const reviewerDoc = i % 2 === 0 ? userMap.get("aline") : founder;
    auditLogs.push({
      actor: reviewer,
      actorName: `${reviewerDoc.firstName} ${reviewerDoc.lastName}`,
      action: "application.approved",
      entityType: "member",
      entityId: String(user._id),
      description: `${reviewerDoc.firstName} ${reviewerDoc.lastName} approved ${person.first} ${person.last} and welcomed them to the community.`,
      meta: { points: 10 },
      ip: "127.0.0.1",
      createdAt: new Date(user.joinedAt.getTime() + 1800000),
      updatedAt: user.joinedAt,
      __v: 0,
    });
  });

  await Promise.all([
    insertDated(Application, applications),
    insertDated(Referral, referrals),
    insertDated(PointTransaction, pointEvents),
  ]);

  // ── News ───────────────────────────────────────────────────────────────
  const userByKey = (key) => userMap.get(key);
  const newsDocs = NEWS_ITEMS.map((item, index) => {
    const authorMap = {
      founder: founder._id,
      aline: userByKey("aline")._id,
      eric: userByKey("eric")._id,
    };
    const authorKey = index % 3 === 0 ? "aline" : index % 3 === 1 ? "founder" : "eric";
    const publishedAt = item.status === "published" ? daysAgo(item.daysAgo, 4) : null;
    return {
      _id: new mongoose.Types.ObjectId(),
      title: item.title,
      slug: buildNewsSlug(item.title),
      excerpt: item.excerpt,
      content: item.content,
      coverImage: item.cover,
      category: item.category,
      author: authorMap[authorKey],
      status: item.status,
      views: item.views,
      publishedAt,
      createdAt: daysAgo(item.daysAgo + 1, 6),
      updatedAt: publishedAt || daysAgo(item.daysAgo, 1),
      __v: 0,
    };
  });
  await insertDated(News, newsDocs);

  newsDocs.forEach((news) => {
    if (news.status === "published") {
      auditLogs.push({
        actor: news.author,
        actorName: "Lovaction team",
        action: "news.published",
        entityType: "news",
        entityId: String(news._id),
        description: `Published the news article “${news.title}”.`,
        meta: {},
        ip: "127.0.0.1",
        createdAt: news.publishedAt,
        updatedAt: news.publishedAt,
        __v: 0,
      });
    }
  });

  // ── Gallery ────────────────────────────────────────────────────────────
  const galleryDocs = GALLERY.map((item, index) => {
    const uploaderKey = index % 2 === 0 ? "aline" : index % 3 === 0 ? "founder" : "eric";
    const createdAt = daysAgo(item.daysAgo, index);
    return {
      _id: new mongoose.Types.ObjectId(),
      title: item.title,
      caption: item.caption,
      imageUrl: item.imageUrl,
      album: item.album,
      status: item.status || "published",
      uploadedBy: userByKey(uploaderKey)._id,
      createdAt,
      updatedAt: createdAt,
      __v: 0,
    };
  });
  await insertDated(GalleryItem, galleryDocs);
  galleryDocs.slice(0, 5).forEach((item, i) => {
    auditLogs.push({
      actor: item.uploadedBy,
      actorName: "Lovaction team",
      action: "gallery.uploaded",
      entityType: "gallery",
      entityId: String(item._id),
      description: `Added “${item.title}” to the ${item.album} album.`,
      meta: {},
      ip: "127.0.0.1",
      createdAt: item.createdAt,
      updatedAt: item.createdAt,
      __v: 0,
    });
  });

  // ── Contact messages ───────────────────────────────────────────────────
  const contactDocs = CONTACTS.map((c) => {
    const createdAt = daysAgo(0, c.hoursAgo);
    return {
      _id: new mongoose.Types.ObjectId(),
      name: c.name,
      email: c.email,
      phone: c.phone,
      subject: c.subject,
      message: c.message,
      status: c.status,
      createdAt,
      updatedAt: createdAt,
      __v: 0,
    };
  });
  await insertDated(ContactMessage, contactDocs);

  [founder, userMap.get("aline"), userMap.get("eric")].forEach((admin) => {
    notifications.push({
      user: admin._id,
      type: "message",
      title: "New contact message",
      message: "Sarah Thompson: Partnership with a children's charity",
      link: "/admin/messages",
      read: false,
      createdAt: contactDocs[0].createdAt,
      updatedAt: contactDocs[0].createdAt,
      __v: 0,
    });
  });

  // ── Member account status demo ────────────────────────────────────────
  const suspendedUser = userMap.get("fabrice");
  const suspendedAt = daysAgo(4, 3);
  suspendedUser.status = "suspended";
  await User.collection.updateOne(
    { _id: suspendedUser._id },
    { $set: { status: "suspended" } }
  );
  auditLogs.push({
    actor: adminIds[0],
    actorName: "Aline Uwase",
    action: "member.suspended",
    entityType: "member",
    entityId: String(suspendedUser._id),
    description: "Aline Uwase set Fabrice Niyonzima's status to suspended. Reason: membership review pending.",
    meta: { status: "suspended", reason: "membership review pending" },
    ip: "127.0.0.1",
    createdAt: suspendedAt,
    updatedAt: suspendedAt,
    __v: 0,
  });

  const inactiveUser = userMap.get("theogene");
  inactiveUser.status = "inactive";
  await User.collection.updateOne(
    { _id: inactiveUser._id },
    { $set: { status: "inactive" } }
  );
  auditLogs.push({
    actor: adminIds[1],
    actorName: "Eric Habimana",
    action: "member.inactive",
    entityType: "member",
    entityId: String(inactiveUser._id),
    description: "Eric Habimana set Theogene Nsabimana's status to inactive.",
    meta: { status: "inactive" },
    ip: "127.0.0.1",
    createdAt: daysAgo(20, 4),
    updatedAt: daysAgo(20, 4),
    __v: 0,
  });

  // Notifications for newly approved referrals
  approvedMembers.slice(-4).forEach((person, index) => {
    const user = userMap.get(person.key);
    const parent = userMap.get(person.parent);
    notifications.push({
      user: parent._id,
      type: "points",
      title: "Referral approved",
      message: `${person.first} ${person.last} joined through your invitation. +10 points awarded.`,
      link: "/dashboard/referrals",
      read: index > 1,
      createdAt: user.joinedAt,
      updatedAt: user.joinedAt,
      __v: 0,
    });
    notifications.push({
      user: user._id,
      type: "system",
      title: "Welcome to Lovaction",
      message: "Your membership is active. Complete your profile and invite someone you trust.",
      link: "/dashboard/profile",
      read: false,
      createdAt: user.joinedAt,
      updatedAt: user.joinedAt,
      __v: 0,
    });
  });

  notifications.push({
    user: userMap.get("jean")._id,
    type: "points",
    title: "Points awarded",
    message: "+20 points — Bonus for leading the school-kit distribution",
    link: "/dashboard/points",
    read: true,
    createdAt: daysAgo(18, 2),
    updatedAt: daysAgo(18, 2),
    __v: 0,
  });

  await insertDated(AuditLog, auditLogs);
  await insertDated(Notification, notifications);

  console.log(
    `  Seeded ${users.length} members, ${applications.length} applications, ${newsDocs.length} news articles, ${galleryDocs.length} gallery items.`
  );
  return true;
}

const invokedDirectly =
  process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("/seed.js");

if (invokedDirectly) {
  const reset = process.argv.includes("--reset");
  connectDB()
    .then(() => seedDatabase({ reset }))
    .then(() => {
      console.log("  Seed complete.");
      return disconnectDB();
    })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}
