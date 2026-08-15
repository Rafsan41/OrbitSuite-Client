"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button, FormField, Input } from "@/components/ui";
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
        formState: { errors, isSubmitting },
    } = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    const onSubmit = handleSubmit(async (values) => {
        setFormError(null);
        try {
            const session = await login(values.email, values.password);
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
    });

    return (
        <div className="w-full max-w-95 rounded-lg border border-line bg-surface p-8">
            <h1 className="m-0 mb-1 text-xl font-semibold">Log in</h1>
            <p className="mb-6 text-[13px] text-ink-muted">
                Welcome back to OrbitSuite.
            </p>

            <form onSubmit={onSubmit} noValidate>
                <FormField label="Email" htmlFor="email" error={errors.email?.message}>
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@company.com"
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
                        {...register("password")}
                    />
                </FormField>

                <div className="mb-5 text-right">
                    <Link href="/forgot-password" className="text-[13px]">
                        Forgot password?
                    </Link>
                </div>

                {formError && (
                    <p
                        role="alert"
                        className="mb-4 rounded-md border border-status-failed-border bg-status-failed-bg px-3 py-2 text-[13px] text-status-failed-fg"
                    >
                        {formError}
                    </p>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Logging in…" : "Log in"}
                </Button>
            </form>

            <p className="mt-4 text-center text-[13px] text-ink-muted">
                No account? <Link href="/register">Create an organization</Link>
            </p>
        </div>
    );
}
