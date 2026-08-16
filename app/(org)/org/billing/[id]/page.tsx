"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { use } from "react";
import { DefinitionRow, PageHeader } from "@/components/patterns";
import { ErrorState, LoadingState } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { get } from "@/lib/api-client";
import { formatDateTime, formatMoney, humanize } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import type { InvoiceDetail } from "@/lib/types";

export default function InvoiceDetailPage({
    params,
}: PageProps<"/org/billing/[id]">) {
    const { id } = use(params);

    const { data, error, isLoading, refetch } = useQuery({
        queryKey: queryKeys.payment(id),
        queryFn: () => get<InvoiceDetail>(`/payments/${id}`),
    });

    if (isLoading) return <LoadingState label="Loading invoice…" />;
    if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
    if (!data) return null;

    return (
        <>
            <div className="mb-4">
                <Link href="/org/billing" className="text-[13px] text-muted-foreground">
                    ← Billing history
                </Link>
            </div>

            <PageHeader
                title={data.invoiceNumber}
                description={`Issued ${formatDateTime(data.createdAt)}`}
            />

            <div className="mb-4 grid gap-4 lg:grid-cols-2">
                <Card className="px-6">
                    <p className="mb-2 text-sm font-semibold">Payment</p>
                    <DefinitionRow label="Status">
                        <StatusBadge status={data.status} />
                    </DefinitionRow>
                    <DefinitionRow label="Amount">
                        {formatMoney(data.amountCents, data.currency)}
                    </DefinitionRow>
                    <DefinitionRow label="Plan">
                        {data.subscription?.plan.name ?? "—"}
                    </DefinitionRow>
                    <DefinitionRow label="Period ends">
                        {data.subscription?.currentPeriodEnd
                            ? formatDateTime(data.subscription.currentPeriodEnd)
                            : "—"}
                    </DefinitionRow>
                    {/* Shown because it is the reference Stripe support asks for
                        when a charge is disputed. */}
                    <DefinitionRow label="Stripe reference">
                        <span className="font-mono text-xs">
                            {data.stripePaymentIntentId ?? "—"}
                        </span>
                    </DefinitionRow>
                </Card>

                <Card className="px-6">
                    <p className="mb-2 text-sm font-semibold">Billed to</p>
                    <DefinitionRow label="Organization">
                        {data.organization.name}
                    </DefinitionRow>
                    <DefinitionRow label="Billing email">
                        {data.organization.billingEmail ??
                            data.organization.contactEmail ??
                            "—"}
                    </DefinitionRow>
                </Card>
            </div>

            <Card className="px-6">
                <p className="mb-3 text-sm font-semibold">
                    Transactions for this payment
                </p>
                {data.transactions.length === 0 ? (
                    <p className="py-4 text-[13px] text-muted-foreground">
                        No transactions recorded against this payment.
                    </p>
                ) : (
                    <ul className="m-0 grid list-none gap-2.5 p-0">
                        {data.transactions.map((transaction) => (
                            <li
                                key={transaction.id}
                                className="flex flex-wrap items-center justify-between gap-3 text-sm"
                            >
                                <span>
                                    {humanize(transaction.type)}
                                    <span className="ml-2 text-[13px] text-muted-foreground">
                                        {formatDateTime(transaction.createdAt)}
                                    </span>
                                </span>
                                <span className="flex items-center gap-3">
                                    <StatusBadge status={transaction.status} />
                                    <span className="font-medium tabular-nums">
                                        {formatMoney(
                                            transaction.amountCents,
                                            data.currency,
                                        )}
                                    </span>
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </>
    );
}
