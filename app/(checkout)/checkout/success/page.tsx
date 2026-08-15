"use client";

import { CircleCheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard, AuthCardHeader } from "@/components/patterns";
import { ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { useCheckoutStatus } from "@/hooks/use-checkout";
import { formatMoney } from "@/lib/format";

export default function CheckoutSuccessPage() {
    const router = useRouter();
    const [continuing, setContinuing] = useState(false);
    const { status, error, isConfirmed, hasTimedOut, adoptConfirmedSession } =
        useCheckoutStatus();

    const goToApp = async () => {
        setContinuing(true);
        // The cached session still says PENDING — it was fetched before the
        // webhook landed. Refetch it first, or the org layout will bounce
        // straight back here on arrival.
        await adoptConfirmedSession();
        router.replace("/org");
    };

    if (error) {
        return (
            <AuthCard size="md">
                <ErrorState error={error} />
            </AuthCard>
        );
    }

    if (isConfirmed) {
        return (
            <AuthCard size="md" className="text-center">
                <CircleCheckIcon
                    className="mx-auto mb-3 size-9 text-status-success-fg"
                    aria-hidden
                />
                <AuthCardHeader
                    centered
                    title="Payment confirmed"
                    description={`Your organization is now active${
                        status?.plan
                            ? ` on ${status.plan.name} — ${formatMoney(status.plan.priceCents)}/mo`
                            : ""
                    }.`}
                />
                <Button
                    size="lg"
                    className="h-10 w-full"
                    onClick={goToApp}
                    disabled={continuing}
                >
                    {continuing ? "Opening…" : "Continue to OrbitSuite"}
                </Button>
            </AuthCard>
        );
    }

    if (hasTimedOut) {
        return (
            <AuthCard size="md" className="text-center">
                <AuthCardHeader
                    centered
                    title="Still waiting on Stripe"
                    description="Your payment may still go through — confirmations occasionally take a few minutes. Nothing is lost; check again shortly, or return to checkout."
                />
                <div className="flex justify-center gap-3">
                    <Button size="lg" onClick={() => window.location.reload()}>
                        Check again
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => router.push("/checkout/retry")}
                    >
                        Back to checkout
                    </Button>
                </div>
            </AuthCard>
        );
    }

    return (
        <AuthCard size="md" className="text-center">
            <div role="status" aria-live="polite">
                <p className="mb-2.5 text-sm font-semibold">
                    Confirming your payment
                    <span aria-hidden className="animate-pulse">
                        …
                    </span>
                </p>
                <p className="m-0 text-xs text-muted-foreground">
                    We only activate your account once Stripe confirms payment by
                    webhook — a redirect alone isn&apos;t proof of payment.
                </p>
            </div>
        </AuthCard>
    );
}
