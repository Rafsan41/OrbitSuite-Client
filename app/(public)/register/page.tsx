"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
    AuthCard,
    AuthCardHeader,
    FormAlert,
    FormField,
} from "@/components/patterns";
import { LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useStartCheckout } from "@/hooks/use-checkout";
import { ApiError, getList, post, setAccessToken } from "@/lib/api-client";
import { formatMoney } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { registerSchema, type RegisterValues } from "@/lib/schemas";
import type { Plan, RegisterResult } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
    // `useSearchParams` suspends, so the boundary is required — without it this
    // route drops out of static prerendering entirely.
    return (
        <Suspense fallback={<LoadingState />}>
            <RegisterForm />
        </Suspense>
    );
}

function RegisterForm() {
    const [formError, setFormError] = useState<string | null>(null);
    const startCheckout = useStartCheckout();
    // Carried over from the landing page's subscribe field, so the address is
    // typed once rather than twice.
    const prefilledEmail = useSearchParams().get("email") ?? "";

    const plansQuery = useQuery({
        queryKey: queryKeys.plans({ limit: 6 }),
        queryFn: () => getList<Plan[]>("/plans", { limit: 6 }),
    });
    const plans = plansQuery.data?.data ?? [];

    const {
        register,
        handleSubmit,
        setError,
        control,
        formState: { errors, isSubmitting },
    } = useForm<RegisterValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            organizationName: "",
            name: "",
            email: prefilledEmail,
            password: "",
            planId: "",
        },
    });

    // `useWatch`, not `watch()`: the latter returns a fresh function each render,
    // which opts the whole component out of React Compiler memoization.
    const selectedPlanId = useWatch({ control, name: "planId" });

    const onSubmit = handleSubmit(async (values) => {
        setFormError(null);
        try {
            const result = await post<RegisterResult>("/auth/register", values);
            // The org exists but is PENDING, and the admin is already
            // authenticated — that token is what lets the very next call create
            // a checkout session without a round trip through the login form.
            setAccessToken(result.accessToken);
            await startCheckout.mutateAsync();
            // No navigation here: that resolves into a full-page handover to
            // Stripe, so anything after this line would race the unload.
        } catch (error) {
            if (!(error instanceof ApiError)) throw error;

            const fields = error.byField();
            if (Object.keys(fields).length > 0) {
                for (const [field, message] of Object.entries(fields)) {
                    setError(field as keyof RegisterValues, { message });
                }
            } else {
                setFormError(error.message);
            }
        }
    });

    // One flag for both halves: the account may already exist while Stripe is
    // still being contacted, and re-submitting then would 409.
    const busy = isSubmitting || startCheckout.isPending;

    return (
        <AuthCard size="lg">
            <AuthCardHeader
                title="Create your organization"
                description="You'll set up billing on the next step."
            />

            <form onSubmit={onSubmit} noValidate>
                {/* Two columns from `sm` up: the four identity fields pair off
                    naturally, and on a 672px card a single column would leave
                    most of the width empty. */}
                <div className="grid gap-x-4 sm:grid-cols-2">
                    <FormField
                        label="Organization name"
                        htmlFor="organizationName"
                        error={errors.organizationName?.message}
                    >
                        <Input
                            id="organizationName"
                            autoComplete="organization"
                            placeholder="Acme Inc."
                            aria-invalid={!!errors.organizationName}
                            {...register("organizationName")}
                        />
                    </FormField>

                    <FormField
                        label="Your name"
                        htmlFor="name"
                        error={errors.name?.message}
                    >
                        <Input
                            id="name"
                            autoComplete="name"
                            aria-invalid={!!errors.name}
                            {...register("name")}
                        />
                    </FormField>

                    <FormField
                        label="Email"
                        htmlFor="email"
                        error={errors.email?.message}
                    >
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
                        hint="8+ characters, with upper, lower and a number."
                    >
                        <Input
                            id="password"
                            type="password"
                            autoComplete="new-password"
                            aria-invalid={!!errors.password}
                            {...register("password")}
                        />
                    </FormField>
                </div>

                {/* A fieldset + legend, not a label: the group has four inputs,
                    and a <label> may only name one. */}
                <fieldset className="mt-2 mb-5 grid gap-1.5 border-0 p-0">
                    <legend className="mb-1.5 text-sm leading-none font-medium">
                        Plan
                    </legend>

                    {plansQuery.isLoading ? (
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                            <Skeleton className="h-18" />
                            <Skeleton className="h-18" />
                            <Skeleton className="h-18" />
                            <Skeleton className="h-18" />
                        </div>
                    ) : plans.length === 0 ? (
                        <p className="text-[13px] text-muted-foreground">
                            No plans are available right now. Please try again later.
                        </p>
                    ) : (
                        /*
                         * Real radios rather than styled buttons: one choice out
                         * of a set is exactly what a radio group means, and it
                         * brings arrow-key navigation and the right screen-reader
                         * announcement with it. The input is visually hidden but
                         * never `display:none`, which would drop it from the tab
                         * order entirely.
                         */
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                            {plans.map((plan) => {
                                const selected = plan.id === selectedPlanId;
                                return (
                                    <label
                                        key={plan.id}
                                        // Selected styling comes from form state
                                        // rather than a `has-[:checked]:` variant:
                                        // the value is already being watched for
                                        // other reasons, and one source of truth
                                        // beats two that can disagree.
                                        className={cn(
                                            "cursor-pointer rounded-lg p-3 ring-1 transition-colors",
                                            "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                                            selected
                                                ? "bg-brand-50 text-brand-700 ring-2 ring-brand-600"
                                                : "ring-foreground/10 hover:ring-brand-300",
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            value={plan.id}
                                            className="sr-only"
                                            {...register("planId")}
                                        />
                                        <span className="block text-[13px] font-semibold">
                                            {plan.name}
                                        </span>
                                        <span className="block text-base font-bold tabular-nums">
                                            {formatMoney(plan.priceCents)}
                                            <span
                                                className={cn(
                                                    "text-[11px] font-normal",
                                                    !selected && "text-muted-foreground",
                                                )}
                                            >
                                                /
                                                {plan.billingInterval === "YEAR"
                                                    ? "yr"
                                                    : "mo"}
                                            </span>
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    )}

                    {errors.planId && (
                        <p className="text-xs text-destructive" role="alert">
                            {errors.planId.message}
                        </p>
                    )}
                </fieldset>

                {formError && <FormAlert>{formError}</FormAlert>}

                <Button
                    type="submit"
                    size="lg"
                    className="h-10 w-full"
                    disabled={busy}
                >
                    {busy ? "Redirecting to checkout…" : "Continue to checkout"}
                </Button>
            </form>

            <p className="mt-4 text-center text-[13px] text-muted-foreground">
                Already have an account? <Link href="/login">Log in</Link>
            </p>
        </AuthCard>
    );
}
