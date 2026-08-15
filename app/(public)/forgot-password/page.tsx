"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
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
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/schemas";

export default function ForgotPasswordPage() {
    const [submitted, setSubmitted] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ForgotPasswordValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: "" },
    });

    const onSubmit = handleSubmit(async (values) => {
        setFormError(null);
        try {
            await post("/auth/forgot-password", values);
            setSubmitted(true);
        } catch (error) {
            if (!(error instanceof ApiError)) throw error;
            // A 429 is the one thing worth surfacing. Everything else this
            // endpoint can return is deliberately indistinguishable — revealing
            // whether an address is registered is an account-enumeration
            // oracle, so the confirmation screen shows either way.
            if (error.status === 429) setFormError(error.message);
            else setSubmitted(true);
        }
    });

    if (submitted) {
        return (
            <AuthCard>
                <AuthCardHeader
                    title="Check your email"
                    description="If an account exists for that address, we've sent a password reset link. It expires in one hour."
                />
                <Button asChild variant="outline" size="lg" className="h-10 w-full">
                    <Link href="/login">Back to log in</Link>
                </Button>
            </AuthCard>
        );
    }

    return (
        <AuthCard>
            <AuthCardHeader
                title="Forgot password"
                description="Enter your email and we'll send a reset link."
            />

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

                {formError && <FormAlert>{formError}</FormAlert>}

                <Button
                    type="submit"
                    size="lg"
                    className="mt-2 h-10 w-full"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Sending…" : "Send reset link"}
                </Button>
            </form>

            <p className="mt-4 text-center text-[13px] text-muted-foreground">
                Remembered it? <Link href="/login">Log in</Link>
            </p>
        </AuthCard>
    );
}
