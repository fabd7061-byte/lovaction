import { z } from "zod";

const name = z
  .string({ required_error: "This field is required." })
  .trim()
  .min(2, "Must be at least 2 characters.")
  .max(60, "Must be at most 60 characters.");

const email = z
  .string({ required_error: "Email is required." })
  .trim()
  .toLowerCase()
  .email("Please enter a valid email address.");

const phone = z
  .string({ required_error: "Phone number is required." })
  .trim()
  .min(8, "Please enter a valid phone number.")
  .max(25, "Please enter a valid phone number.")
  .regex(/^[+\d][\d\s()-]{7,24}$/, "Please enter a valid phone number.");

const optionalUrl = z
  .string()
  .trim()
  .max(600)
  .refine(
    (v) => !v || /^(https?:\/\/|\/uploads\/)/.test(v),
    "Please provide a valid image URL."
  )
  .optional()
  .or(z.literal(""));

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, "Enter your username, email or member code."),
  password: z.string().min(1, "Password is required."),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password is too long.")
    .regex(/[A-Za-z]/, "Password must contain a letter.")
    .regex(/[0-9]/, "Password must contain a number."),
});

export const applicationSchema = z.object({
  firstName: name,
  lastName: name,
  email,
  phone,
  reasonForJoining: z
    .string({ required_error: "Please tell us why you want to join." })
    .trim()
    .min(20, "Please write at least 20 characters.")
    .max(1200, "Please keep it under 1200 characters."),
  referralUsername: z
    .string({ required_error: "Please enter the username of the member who invited you." })
    .trim()
    .min(3, "Please enter a valid referral username.")
    .max(60),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().max(1200).optional().or(z.literal("")),
  profileImage: optionalUrl,
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(120),
  email,
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  subject: z.string().trim().min(3, "Please enter a subject.").max(180),
  message: z
    .string()
    .trim()
    .min(10, "Please write a slightly longer message.")
    .max(2000, "Please keep your message under 2000 characters."),
});

export const memberUpdateSchema = z.object({
  firstName: name.optional(),
  lastName: name.optional(),
  email: email.optional(),
  phone: phone.optional(),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  bio: z.string().trim().max(600).optional().or(z.literal("")),
  profileImage: optionalUrl,
  parentMemberId: z.string().trim().nullable().optional(),
});

export const statusSchema = z.object({
  status: z.enum(["active", "suspended", "inactive"], {
    errorMap: () => ({ message: "Invalid status." }),
  }),
  reason: z.string().trim().max(400).optional().or(z.literal("")),
});

export const roleSchema = z.object({
  role: z.enum(["admin", "member"], {
    errorMap: () => ({ message: "Role must be admin or member." }),
  }),
});

export const rejectSchema = z.object({
  reason: z
    .string({ required_error: "A rejection reason is required." })
    .trim()
    .min(5, "Please provide a clear rejection reason.")
    .max(800),
});

export const reviewSchema = z.object({
  note: z.string().trim().max(800).optional().or(z.literal("")),
});

export const pointAdjustSchema = z.object({
  memberId: z.string().min(1, "Member is required."),
  points: z
    .number({ required_error: "Points value is required." })
    .int("Points must be a whole number.")
    .refine((v) => v !== 0, "Points cannot be zero.")
    .refine((v) => Math.abs(v) <= 10000, "Maximum adjustment is 10,000 points."),
  type: z.enum(["admin_adjustment", "bonus", "penalty"]),
  description: z
    .string({ required_error: "A reason is required." })
    .trim()
    .min(3, "Please explain the adjustment.")
    .max(400),
});

export const newsSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters.").max(180),
  excerpt: z.string().trim().min(10, "Excerpt must be at least 10 characters.").max(400),
  content: z.string().trim().min(20, "Article content is too short."),
  coverImage: optionalUrl,
  category: z.enum([
    "Education",
    "Community",
    "Faith",
    "Events",
    "Impact",
    "Announcements",
  ]),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const gallerySchema = z.object({
  title: z.string().trim().min(2, "Title is required.").max(160),
  caption: z.string().trim().max(600).optional().or(z.literal("")),
  imageUrl: z
    .string({ required_error: "An image is required." })
    .trim()
    .refine((v) => /^(https?:\/\/|\/uploads\/)/.test(v), "Please upload an image."),
  album: z.string().trim().min(2, "Album is required.").max(80),
  status: z.enum(["draft", "published"]).default("published"),
});

export const settingsSchema = z.object({
  orgName: z.string().trim().min(2).max(120).optional(),
  motto: z.string().trim().min(2).max(180).optional(),
  email: email.optional(),
  phone: z.string().trim().min(5).max(30).optional(),
  address: z.string().trim().min(2).max(180).optional(),
  socials: z
    .object({
      facebook: z.string().trim().max(300).optional().or(z.literal("")),
      instagram: z.string().trim().max(300).optional().or(z.literal("")),
      twitter: z.string().trim().max(300).optional().or(z.literal("")),
      youtube: z.string().trim().max(300).optional().or(z.literal("")),
    })
    .optional(),
  pointsPerReferral: z.number().int().min(0).max(1000).optional(),
  rankingMetric: z.enum(["referrals", "points"]).optional(),
  allowPublicLeaderboard: z.boolean().optional(),
  allowPublicMembers: z.boolean().optional(),
  joinEnabled: z.boolean().optional(),
  foundedYear: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
});

export const contactStatusSchema = z.object({
  status: z.enum(["new", "read", "replied"]),
});
