import { z } from "zod";

/**
 * Mirrors the backend's password rule exactly. The server is still the
 * authority — this only saves a round trip and gives the user the message
 * against the field instead of at the top of the form.
 */
export const passwordSchema = z
    .string()
    .min(8, "At least 8 characters")
    .max(72, "At most 72 characters")
    .regex(/[a-z]/, "Needs a lowercase letter")
    .regex(/[A-Z]/, "Needs an uppercase letter")
    .regex(/[0-9]/, "Needs a number");

export const emailSchema = z.email("A valid email is required");

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
    organizationName: z.string().min(2, "At least 2 characters").max(100),
    name: z.string().min(2, "At least 2 characters").max(100),
    email: emailSchema,
    password: passwordSchema,
    planId: z.string().min(1, "Choose a plan"),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

/**
 * The backend takes only `token` + `password`. The confirm field is a
 * client-side typo guard on a value the user cannot see and cannot undo, so it
 * is validated here and dropped before the request goes out.
 */
const passwordWithConfirmation = z
    .object({ password: passwordSchema, confirmPassword: z.string() })
    .refine((v) => v.password === v.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export const resetPasswordSchema = passwordWithConfirmation;

export const acceptInviteSchema = passwordWithConfirmation;

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
});

export const profileSchema = z.object({
    name: z.string().min(2, "At least 2 characters").max(100),
    email: emailSchema,
});

export const organizationSchema = z.object({
    name: z.string().min(2, "At least 2 characters").max(100),
    contactEmail: emailSchema,
    billingEmail: emailSchema,
});

export const inviteSchema = z.object({
    name: z.string().min(2, "At least 2 characters").max(100),
    email: emailSchema,
    role: z.enum(["ORG_ADMIN", "ORG_MEMBER"]),
});

export const contactSchema = z.object({
    name: z.string().min(2, "At least 2 characters").max(100),
    email: emailSchema,
    message: z
        .string()
        .min(10, "Tell us a little more — at least 10 characters")
        .max(2000, "At most 2000 characters"),
});

export const planSchema = z.object({
    name: z.string().min(2, "At least 2 characters").max(100),
    priceCents: z.coerce
        .number()
        .int("Whole cents only")
        .min(0, "Cannot be negative"),
    billingInterval: z.enum(["MONTH", "YEAR"]),
    features: z.string(),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type AcceptInviteValues = z.infer<typeof acceptInviteSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
export type OrganizationValues = z.infer<typeof organizationSchema>;
export type InviteValues = z.infer<typeof inviteSchema>;
export type ContactValues = z.infer<typeof contactSchema>;
export type PlanValues = z.infer<typeof planSchema>;
