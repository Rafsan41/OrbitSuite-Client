"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
    AuthCard,
    AuthCardHeader,
    FormAlert,
    FormField,
} from "@/components/patterns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-client";
import { loginSchema, type LoginValues } from "@/lib/schemas";

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [formError, setFormError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setError,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    // Shared by the form and the demo buttons, so there is one sign-in path and
    // one set of routing rules rather than two that can drift.
    const signIn = async (email: string, password: string) => {
        setFormError(null);
        try {
            const session = await login(email, password);
            if (session.user.role === "PLATFORM_ADMIN") {
                router.replace("/admin");
            } else if (session.organization?.status === "PENDING") {
                // Registered but never paid — checkout, not the product.
                router.replace("/checkout/retry");
            } else if (session.user.role === "ORG_ADMIN") {
                router.replace("/org");
            } else {
                router.replace("/me");
            }
        } catch (error) {
            if (!(error instanceof ApiError)) throw error;

            // A 400 carries per-field detail; everything else (401 bad
            // credentials, 403 suspended organization, 429 rate limit) is a
            // form-level message the backend has already worded correctly.
            const fields = error.byField();
            if (Object.keys(fields).length > 0) {
                for (const [field, message] of Object.entries(fields)) {
                    setError(field as keyof LoginValues, { message });
                }
            } else {
                setFormError(error.message);
            }
        }
    };

    const onSubmit = handleSubmit((values) => signIn(values.email, values.password));

    // Fills the fields as well as signing in, so it is visible which account
    // was used rather than the form jumping to a panel from nowhere.
    const submitAs = (email: string, password: string) => {
        setValue("email", email);
        setValue("password", password);
        void signIn(email, password);
    };

    return (
        <AuthCard>
            <AuthCardHeader title="Log in" description="Welcome back to OrbitSuite." />

            <form onSubmit={onSubmit} noValidate>
                <FormField label="Email" htmlFor="email" error={errors.email?.message}>
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@company.com"
                        aria-invalid={!!errors.email}
                        {...register("email")}
                    />
                </FormField>

                <FormField
                    label="Password"
                    htmlFor="password"
                    error={errors.password?.message}
                >
                    <Input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        aria-invalid={!!errors.password}
                        {...register("password")}
                    />
                </FormField>

                <div className="mb-5 text-right">
                    <Link href="/forgot-password" className="text-[13px]">
                        Forgot password?
                    </Link>
                </div>

                {formError && <FormAlert>{formError}</FormAlert>}

                <Button
                    type="submit"
                    size="lg"
                    className="h-10 w-full"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Logging in…" : "Log in"}
                </Button>
            </form>

            <p className="mt-4 text-center text-[13px] text-muted-foreground">
                No account? <Link href="/register">Create an organization</Link>
            </p>

            <DemoLogins onPick={submitAs} disabled={isSubmitting} />
        </AuthCard>
    );
}

/** The accounts `prisma/seed.ts` creates, with its shared demo password. */
const DEMO_ACCOUNTS = [
    { label: "Platform Admin", email: "platform.admin@orbitsuite.test" },
    { label: "Org Admin", email: "admin@acme.test" },
    { label: "Member", email: "member@acme.test" },
];

const DEMO_PASSWORD = "Password123!";

/**
 * One-click sign-in for the seeded accounts, so each panel can be checked
 * without retyping credentials.
 *
 * `process.env.NODE_ENV` is inlined at build time, so this whole block — the
 * labels and the password with it — is eliminated from a production bundle
 * rather than merely hidden. Shipping demo credentials to real users would be
 * a live set of working logins on the sign-in page.
 */
function DemoLogins({
    onPick,
    disabled,
}: {
    onPick: (email: string, password: string) => void;
    disabled: boolean;
}) {
    if (process.env.NODE_ENV !== "development") return null;

    return (
        <div className="mt-6 border-t border-border pt-4">
            <p className="mb-2 text-center text-[11px] tracking-wide text-muted-foreground uppercase">
                Development only — seeded accounts
            </p>
            <div className="flex flex-wrap justify-center gap-2">
                {DEMO_ACCOUNTS.map((account) => (
                    <Button
                        key={account.email}
                        variant="outline"
                        size="sm"
                        disabled={disabled}
                        onClick={() => onPick(account.email, DEMO_PASSWORD)}
                    >
                        {account.label}
                    </Button>
                ))}
            </div>
        </div>
    );
}
