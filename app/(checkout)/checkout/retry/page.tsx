"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthCard, DefinitionRow, FormAlert } from "@/components/patterns";
import { ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useStartCheckout } from "@/hooks/use-checkout";
import { ApiError, get } from "@/lib/api-client";
import { formatMoney, humanize } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import type { CheckoutStatus } from "@/lib/types";

/**
 * Where a PENDING organization lands. It is deliberately not a second checkout
 * form — card details are Stripe's business, on Stripe's domain. This only
 * shows what is owed and hands the browser back over.
 */
export default function CheckoutRetryPage() {
    const router = useRouter();
    const { session } = useAuth();
    const startCheckout = useStartCheckout();

    // A plain fetch, not the polling hook: nothing is in flight on this page,
    // so there is no webhook to wait for.
    const { data, error, isLoading, refetch } = useQuery({
        queryKey: queryKeys.checkoutStatus,
        queryFn: () => get<CheckoutStatus>("/checkout/status"),
        retry: false,
        staleTime: 0,
    });

    // Someone who already paid must never be asked to pay again — which happens
    // if they left this tab open across a successful webhook.
    useEffect(() => {
        if (data?.subscriptionStatus === "ACTIVE") router.replace("/org");
    }, [data?.subscriptionStatus, router]);

    if (isLoading) return <LoadingState />;
    if (error) {
        return (
            <AuthCard size="md">
                <ErrorState error={error} onRetry={() => refetch()} />
            </AuthCard>
        );
    }

    const startError =
        startCheckout.error instanceof ApiError ? startCheckout.error.message : null;

    return (
        <AuthCard size="md">
            <p className="mb-2 text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                Step 2 of 2
            </p>
            <h1 className="m-0 mb-1 text-xl font-semibold tracking-tight">
                Complete your subscription
            </h1>
            <p className="mb-5 text-sm text-muted-foreground">
                {session?.organization?.name ?? "Your organization"} stays inactive
                until payment is confirmed. You&apos;ll finish on Stripe&apos;s
                secure checkout page.
            </p>

            <div className="mb-5 rounded-lg bg-muted px-4 py-1">
                <DefinitionRow label="Plan">{data?.plan?.name ?? "—"}</DefinitionRow>
                <DefinitionRow label="Price">
                    {data?.plan ? `${formatMoney(data.plan.priceCents)}/mo` : "—"}
                </DefinitionRow>
                <DefinitionRow label="Status">
                    {data ? humanize(data.subscriptionStatus) : "—"}
                </DefinitionRow>
            </div>

            {startError && <FormAlert>{startError}</FormAlert>}

            <Button
                size="lg"
                className="h-10 w-full"
                onClick={() => startCheckout.mutate()}
                disabled={startCheckout.isPending || data?.canRetry === false}
            >
                {startCheckout.isPending
                    ? "Redirecting to Stripe…"
                    : "Continue to secure checkout"}
            </Button>

            <p className="mt-3 text-center text-xs text-muted-foreground">
                Card details are entered on Stripe and never touch OrbitSuite.
            </p>
        </AuthCard>
    );
}
