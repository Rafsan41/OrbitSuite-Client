"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { ApiError, post } from "@/lib/api-client";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/schemas";

export interface SetPasswordFormProps {
    /** `/auth/reset-password` or `/users/accept-invite` — identical request shape. */
    endpoint: string;
    title: string;
    description: string;
    submitLabel: string;
    doneTitle: string;
    doneBody: string;
}

/**
 * Password reset and invite acceptance are the same interaction: an emailed
 * one-time token in the query string, and a password the user types twice.
 * The endpoints differ; the screen does not.
 *
 * The token is read from the URL and never rendered — putting it in a visible
 * field invites it into screenshots and support tickets.
 */
export function SetPasswordForm({
    endpoint,
    title,
    description,
    submitLabel,
    doneTitle,
    doneBody,
}: SetPasswordFormProps) {
    const token = useSearchParams().get("token") ?? "";
    const [done, setDone] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<ResetPasswordValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { password: "", confirmPassword: "" },
    });

    const onSubmit = handleSubmit(async (values) => {
        setFormError(null);
        try {
            // `confirmPassword` is a client-side guard; the API neither wants
            // nor accepts it.
            await post(endpoint, { token, password: values.password });
            setDone(true);
        } catch (error) {
            if (!(error instanceof ApiError)) throw error;

            const { token: tokenError, ...fields } = error.byField();
            for (const [field, message] of Object.entries(fields)) {
                setError(field as keyof ResetPasswordValues, { message });
            }
            // A rejected token is not something the user can fix by retyping,
            // so it belongs at form level rather than against a field.
            if (tokenError || Object.keys(fields).length === 0) {
                setFormError(tokenError ?? error.message);
            }
        }
    });

    if (done) {
        return (
            <AuthCard>
                <AuthCardHeader title={doneTitle} description={doneBody} />
                <Button asChild size="lg" className="h-10 w-full">
                    <Link href="/login">Go to log in</Link>
                </Button>
            </AuthCard>
        );
    }

    // A missing token means the link was truncated or hand-typed. Showing the
    // form anyway would only fail after they had already chosen a password.
    if (!token) {
        return (
            <AuthCard>
                <AuthCardHeader
                    title="This link is incomplete"
                    description="It's missing its token — copy the full link from your email, or request a new one."
                />
                <Button asChild variant="outline" size="lg" className="h-10 w-full">
                    <Link href="/forgot-password">Request a new link</Link>
                </Button>
            </AuthCard>
        );
    }

    return (
        <AuthCard>
            <AuthCardHeader title={title} description={description} />

            <form onSubmit={onSubmit} noValidate>
                <FormField
                    label="New password"
                    htmlFor="password"
                    error={errors.password?.message}
                    hint="At least 8 characters, with upper, lower and a number."
                >
                    <Input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        aria-invalid={!!errors.password}
                        {...register("password")}
                    />
                </FormField>

                <FormField
                    label="Confirm password"
                    htmlFor="confirmPassword"
                    error={errors.confirmPassword?.message}
                >
                    <Input
                        id="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        aria-invalid={!!errors.confirmPassword}
                        {...register("confirmPassword")}
                    />
                </FormField>

                {formError && <FormAlert>{formError}</FormAlert>}

                <Button
                    type="submit"
                    size="lg"
                    className="mt-2 h-10 w-full"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Saving…" : submitLabel}
                </Button>
            </form>
        </AuthCard>
    );
}
