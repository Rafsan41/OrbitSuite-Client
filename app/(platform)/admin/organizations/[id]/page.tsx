"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { use } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { type Column, DataTable } from "@/components/data-table";
import { DefinitionRow, PageHeader } from "@/components/patterns";
import { ErrorState, LoadingState } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiError, get, patch } from "@/lib/api-client";
import {
    formatDate,
    formatDateTime,
    formatMoney,
    formatNumber,
    humanize,
    ROLE_LABELS,
} from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import type {
    Member,
    OrganizationDetail,
    OrganizationTransaction,
} from "@/lib/types";

const memberColumns: Column<Member>[] = [
    {
        id: "name",
        header: "Member",
        cell: (row) => (
            <div>
                <span className="font-medium">{row.name}</span>
                <span className="block text-xs text-muted-foreground">
                    {row.email}
                </span>
            </div>
        ),
    },
    {
        id: "role",
        header: "Role",
        cell: (row) => ROLE_LABELS[row.role] ?? humanize(row.role),
    },
    {
        id: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
    },
    {
        id: "createdAt",
        header: "Joined",
        align: "right",
        cell: (row) => (
            <span className="whitespace-nowrap text-muted-foreground">
                {formatDate(row.createdAt)}
            </span>
        ),
    },
];

type PaymentRow = OrganizationDetail["payments"][number];

const paymentColumns: Column<PaymentRow>[] = [
    {
        id: "createdAt",
        header: "Date",
        cell: (row) => (
            <span className="whitespace-nowrap">
                {formatDateTime(row.createdAt)}
            </span>
        ),
    },
    {
        id: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
    },
    {
        id: "amount",
        header: "Amount",
        align: "right",
        cell: (row) => (
            <span className="font-medium tabular-nums">
                {formatMoney(row.amountCents, row.currency)}
            </span>
        ),
    },
];

const transactionColumns: Column<OrganizationTransaction>[] = [
    {
        id: "createdAt",
        header: "Date",
        cell: (row) => (
            <span className="whitespace-nowrap">
                {formatDateTime(row.createdAt)}
            </span>
        ),
    },
    {
        id: "type",
        header: "Type",
        cell: (row) => humanize(row.type),
    },
    {
        id: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
    },
    {
        id: "amount",
        header: "Amount",
        align: "right",
        cell: (row) => (
            <span className="tabular-nums">{formatMoney(row.amountCents)}</span>
        ),
    },
];

export default function AdminOrganizationDetailPage({
    params,
}: PageProps<"/admin/organizations/[id]">) {
    const { id } = use(params);
    const queryClient = useQueryClient();

    const { data, error, isLoading, refetch } = useQuery({
        queryKey: queryKeys.organization(id),
        queryFn: () => get<OrganizationDetail>(`/organizations/${id}`),
    });

    const setSuspended = useMutation({
        mutationFn: (suspend: boolean) =>
            patch<{ status: OrganizationDetail["status"] }>(
                `/organizations/${id}/${suspend ? "suspend" : "reactivate"}`,
            ),
        onSuccess: async (organization, suspend) => {
            // Reactivation does not always land on ACTIVE: the backend returns
            // the organization to PENDING when its subscription cannot support
            // being live. Reporting the status the server actually set avoids
            // claiming an outcome the page will then contradict.
            toast.success(
                suspend
                    ? "Organization suspended"
                    : `Organization reactivated as ${humanize(organization.status)}`,
            );

            // Prefix match — one call covers this detail view and the list.
            await queryClient.invalidateQueries({
                queryKey: queryKeys.organizations(),
            });
            await queryClient.invalidateQueries({ queryKey: queryKeys.stats });
        },
        onError: (mutationError) => {
            toast.error(
                mutationError instanceof ApiError
                    ? mutationError.message
                    : "The status change failed",
            );
        },
    });

    if (isLoading) return <LoadingState label="Loading organization…" />;
    if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
    if (!data) return null;

    const isSuspended = data.status === "SUSPENDED";
    const subscription = data.subscription;

    return (
        <>
            <div className="mb-4">
                <Link
                    href="/admin/organizations"
                    className="text-[13px] text-muted-foreground"
                >
                    ← All organizations
                </Link>
            </div>

            <PageHeader
                title={data.name}
                description={data.contactEmail ?? "No contact email on file"}
                action={
                    <ConfirmDialog
                        trigger={
                            <Button variant={isSuspended ? "default" : "outline"}>
                                {isSuspended ? "Reactivate" : "Suspend"}
                            </Button>
                        }
                        title={
                            isSuspended
                                ? `Reactivate ${data.name}?`
                                : `Suspend ${data.name}?`
                        }
                        description={
                            isSuspended
                                ? "Members will be able to sign in again. If the subscription is not active, the organization returns to Pending rather than Active."
                                : "Members are refused at login and on token refresh, so existing sessions end within 15 minutes. Billing is unaffected, and you can reactivate at any time."
                        }
                        confirmLabel={isSuspended ? "Reactivate" : "Suspend"}
                        destructive={!isSuspended}
                        pending={setSuspended.isPending}
                        pendingLabel="Saving…"
                        onConfirm={() => setSuspended.mutate(!isSuspended)}
                    />
                }
            />

            <div className="mb-4 grid gap-4 lg:grid-cols-2">
                <Card className="px-6">
                    <p className="mb-2 text-sm font-semibold">Profile</p>
                    <DefinitionRow label="Status">
                        <StatusBadge status={data.status} />
                    </DefinitionRow>
                    <DefinitionRow label="Contact email">
                        {data.contactEmail ?? "—"}
                    </DefinitionRow>
                    <DefinitionRow label="Billing email">
                        {data.billingEmail ?? "—"}
                    </DefinitionRow>
                    <DefinitionRow label="Members">
                        {formatNumber(data.users.length)}
                    </DefinitionRow>
                    <DefinitionRow label="Signed up">
                        {formatDate(data.createdAt)}
                    </DefinitionRow>
                </Card>

                <Card className="px-6">
                    <p className="mb-2 text-sm font-semibold">Subscription</p>
                    {subscription ? (
                        <>
                            <DefinitionRow label="Status">
                                <StatusBadge status={subscription.status} />
                            </DefinitionRow>
                            <DefinitionRow label="Plan">
                                {subscription.plan.name}
                            </DefinitionRow>
                            <DefinitionRow label="Price">
                                {formatMoney(subscription.plan.priceCents)} /{" "}
                                {subscription.plan.billingInterval.toLowerCase()}
                            </DefinitionRow>
                            <DefinitionRow label="Renews">
                                {formatDate(subscription.currentPeriodEnd)}
                            </DefinitionRow>
                            <DefinitionRow label="Started">
                                {formatDate(subscription.createdAt)}
                            </DefinitionRow>
                        </>
                    ) : (
                        <p className="py-6 text-center text-[13px] text-muted-foreground">
                            This organization has never had a subscription — it
                            registered without completing checkout.
                        </p>
                    )}
                </Card>
            </div>

            <div className="mb-6">
                <DataTable
                    title="Members"
                    columns={memberColumns}
                    rows={data.users}
                    rowKey={(row) => row.id}
                    empty={{ title: "No members" }}
                />
            </div>

            <div className="mb-6">
                <DataTable
                    title="Payment history"
                    columns={paymentColumns}
                    rows={data.payments}
                    rowKey={(row) => row.id}
                    empty={{
                        title: "No payments",
                        body: "Payments appear here once Stripe confirms one by webhook.",
                    }}
                />
            </div>

            <DataTable
                title="Transactions"
                columns={transactionColumns}
                rows={data.transactions}
                rowKey={(row) => row.id}
                empty={{ title: "No transactions" }}
            />
        </>
    );
}
