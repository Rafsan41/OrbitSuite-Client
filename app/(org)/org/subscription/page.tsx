"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DefinitionRow, PageHeader } from "@/components/patterns";
import { ErrorState, LoadingState } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, get, getList, post } from "@/lib/api-client";
import { formatDate, formatMoney } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import type { CurrentSubscription, Plan } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function OrgSubscriptionPage() {
    const queryClient = useQueryClient();
    const [reason, setReason] = useState("");

    const { data, error, isLoading, refetch } = useQuery({
        queryKey: queryKeys.subscription,
        queryFn: () => get<CurrentSubscription>("/subscriptions/me"),
    });

    // Active plans only — the endpoint hides disabled ones, and those are
    // exactly the plans nobody is allowed to move onto.
    const { data: plans } = useQuery({
        queryKey: queryKeys.plans({ limit: 100 }),
        queryFn: () => getList<Plan[]>("/plans", { limit: 100 }),
    });

    const refreshSubscription = async () => {
        await queryClient.invalidateQueries({ queryKey: queryKeys.subscription });
        await queryClient.invalidateQueries({ queryKey: queryKeys.myOrganization });
        await queryClient.invalidateQueries({ queryKey: queryKeys.session });
    };

    const changePlan = useMutation({
        mutationFn: (planId: string) =>
            post<CurrentSubscription>("/subscriptions/change-plan", { planId }),
        onSuccess: async (subscription) => {
            toast.success(`Switched to ${subscription.plan.name}`);
            await refreshSubscription();
        },
        onError: (mutationError) => {
            toast.error(
                mutationError instanceof ApiError
                    ? mutationError.message
                    : "The plan change failed",
            );
        },
    });

    const cancel = useMutation({
        mutationFn: () =>
            post<CurrentSubscription>("/subscriptions/cancel", {
                ...(reason.trim() ? { reason: reason.trim() } : {}),
            }),
        onSuccess: async () => {
            toast.success("Subscription cancelled");
            setReason("");
            await refreshSubscription();
        },
        onError: (mutationError) => {
            toast.error(
                mutationError instanceof ApiError
                    ? mutationError.message
                    : "The cancellation failed",
            );
        },
    });

    if (isLoading) return <LoadingState label="Loading your subscription…" />;
    if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
    if (!data) return null;

    const isActive = data.status === "ACTIVE";
    const days = data.daysUntilRenewal;

    return (
        <>
            <PageHeader
                title="Subscription"
                description="Your current plan, renewal date and billing status."
            />

            <div className="mb-4 grid gap-4 lg:grid-cols-2">
                <Card className="px-6">
                    <p className="mb-2 text-sm font-semibold">Current plan</p>
                    <DefinitionRow label="Status">
                        <StatusBadge status={data.status} />
                    </DefinitionRow>
                    <DefinitionRow label="Plan">{data.plan.name}</DefinitionRow>
                    <DefinitionRow label="Price">
                        {formatMoney(data.plan.priceCents)} /{" "}
                        {data.plan.billingInterval.toLowerCase()}
                    </DefinitionRow>
                    <DefinitionRow label="Current period ends">
                        {formatDate(data.currentPeriodEnd)}
                    </DefinitionRow>
                    <DefinitionRow label="Started">
                        {formatDate(data.createdAt)}
                    </DefinitionRow>
                </Card>

                <Card className="px-6">
                    <p className="mb-2 text-sm font-semibold">Renewal</p>
                    {data.isExpired ? (
                        <p className="py-4 text-sm text-status-failed-fg">
                            This subscription period has ended. Renew to restore full
                            access.
                        </p>
                    ) : days === null ? (
                        <p className="py-4 text-[13px] text-muted-foreground">
                            No renewal date is set on this subscription.
                        </p>
                    ) : (
                        <p className="py-4 text-sm">
                            Renews in{" "}
                            <span className="font-semibold tabular-nums">
                                {days} {days === 1 ? "day" : "days"}
                            </span>
                            , on {formatDate(data.currentPeriodEnd)}.
                        </p>
                    )}

                    {isActive && (
                        <div className="border-t border-border pt-4">
                            <p className="mb-2 text-[13px] font-medium">
                                Cancel subscription
                            </p>
                            <Textarea
                                rows={2}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Reason (optional)"
                                maxLength={500}
                                aria-label="Cancellation reason"
                                className="mb-3"
                            />
                            <ConfirmDialog
                                trigger={
                                    <Button variant="outline">Cancel subscription</Button>
                                }
                                title="Cancel your subscription?"
                                description="Access continues until the end of the current billing period. Your billing history is kept, and you can subscribe again at any time."
                                confirmLabel="Cancel subscription"
                                destructive
                                pending={cancel.isPending}
                                pendingLabel="Cancelling…"
                                onConfirm={() => cancel.mutate()}
                            />
                        </div>
                    )}
                </Card>
            </div>

            <Card className="px-6">
                <p className="mb-1 text-sm font-semibold">Change plan</p>
                <p className="mb-4 text-[13px] text-muted-foreground">
                    {isActive
                        ? "Changes take effect immediately. Stripe prorates the difference against your current period."
                        : "Only an active subscription can change plan."}
                </p>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {(plans?.data ?? []).map((plan) => {
                        const isCurrent = plan.id === data.plan.id;

                        return (
                            <div
                                key={plan.id}
                                className={cn(
                                    "rounded-xl p-4 ring-1",
                                    isCurrent
                                        ? "bg-accent ring-ring"
                                        : "bg-card ring-foreground/10",
                                )}
                            >
                                <p className="m-0 font-semibold">{plan.name}</p>
                                <p className="mt-1 mb-3 text-sm tabular-nums">
                                    {formatMoney(plan.priceCents)}
                                    <span className="text-muted-foreground">
                                        {" "}
                                        / {plan.billingInterval.toLowerCase()}
                                    </span>
                                </p>

                                {isCurrent ? (
                                    <p className="m-0 text-[13px] text-muted-foreground">
                                        Your current plan
                                    </p>
                                ) : (
                                    <ConfirmDialog
                                        trigger={
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={!isActive}
                                            >
                                                {plan.priceCents > data.plan.priceCents
                                                    ? "Upgrade"
                                                    : "Downgrade"}
                                            </Button>
                                        }
                                        title={`Switch to ${plan.name}?`}
                                        description={`You move from ${data.plan.name} at ${formatMoney(data.plan.priceCents)} to ${plan.name} at ${formatMoney(plan.priceCents)} per ${plan.billingInterval.toLowerCase()}. Stripe prorates the difference against the period you have already paid for.`}
                                        confirmLabel="Switch plan"
                                        pending={changePlan.isPending}
                                        pendingLabel="Switching…"
                                        onConfirm={() => changePlan.mutate(plan.id)}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </Card>
        </>
    );
}
