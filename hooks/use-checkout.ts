"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ApiError, get, post } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { CheckoutSession, CheckoutStatus } from "@/lib/types";

/**
 * Asks the API for a Stripe Checkout Session and hands the browser over to
 * Stripe. Doubles as the retry path — the backend recreates a session for
 * whatever subscription is still pending.
 *
 * `window.location.assign` rather than the Next router: Stripe Checkout is a
 * different origin, so a client-side navigation cannot reach it.
 */
export function useStartCheckout() {
    return useMutation({
        mutationFn: async () => {
            const session = await post<CheckoutSession>("/checkout/session");
            if (!session.checkoutUrl) {
                throw new ApiError(
                    "Stripe did not return a checkout URL. Try again in a moment.",
                    502,
                );
            }
            return session.checkoutUrl;
        },
        onSuccess: (checkoutUrl) => {
            window.location.assign(checkoutUrl);
        },
    });
}

const POLL_INTERVAL_MS = 2_000;
/** Long enough for a webhook round trip, short enough to not strand anyone. */
const POLL_WINDOW_MS = 90_000;

/**
 * Watches the *server's* view of payment. Stripe's success redirect proves
 * nothing — anyone can type that URL — so activation is only believed once the
 * webhook has moved the subscription to ACTIVE in our own database.
 *
 * Polling stops on its own once that happens, and `hasTimedOut` lets the page
 * offer a way out instead of spinning forever if the webhook never lands.
 */
export function useCheckoutStatus({ enabled = true }: { enabled?: boolean } = {}) {
    const queryClient = useQueryClient();

    // One timer for the whole wait, rather than counting attempts: the question
    // is "has this taken too long", and a deadline says that directly. Clearing
    // `enabled` is what actually stops the polling.
    const [outOfTime, setOutOfTime] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setOutOfTime(true), POLL_WINDOW_MS);
        return () => clearTimeout(timer);
    }, []);

    const query = useQuery({
        queryKey: queryKeys.checkoutStatus,
        queryFn: () => get<CheckoutStatus>("/checkout/status"),
        enabled: enabled && !outOfTime,
        retry: false,
        // Always hit the network: a cached "PENDING" is exactly the answer we
        // are waiting to see change.
        staleTime: 0,
        refetchInterval: (q) =>
            q.state.data?.subscriptionStatus === "ACTIVE" ? false : POLL_INTERVAL_MS,
    });

    const isConfirmed = query.data?.subscriptionStatus === "ACTIVE";
    const hasTimedOut = outOfTime && !isConfirmed;

    return {
        status: query.data,
        error: query.error,
        isLoading: query.isLoading,
        isConfirmed,
        hasTimedOut,
        /** Pull the now-ACTIVE org status into the session the shell reads. */
        adoptConfirmedSession: () =>
            queryClient.invalidateQueries({ queryKey: queryKeys.session }),
    };
}
