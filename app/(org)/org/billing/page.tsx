"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type Column, DataTable } from "@/components/data-table";
import { InvoiceDownloadButton } from "@/components/invoice-download-button";
import { PageHeader } from "@/components/patterns";
import { StatusBadge } from "@/components/status-badge";
import { getList } from "@/lib/api-client";
import { formatDateTime, formatMoney } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import type { PaymentListRow } from "@/lib/types";

const PAGE_SIZE = 20;
const ANY = "ANY";

const columns: Column<PaymentListRow>[] = [
    {
        id: "createdAt",
        header: "Date",
        cell: (row) => (
            <span className="whitespace-nowrap">{formatDateTime(row.createdAt)}</span>
        ),
    },
    {
        id: "invoiceNumber",
        header: "Invoice",
        cell: (row) => (
            <span className="font-mono text-xs text-muted-foreground">
                {row.invoiceNumber}
            </span>
        ),
    },
    {
        id: "plan",
        header: "Plan",
        // A payment can outlive the subscription it was taken against, so the
        // join is nullable even though it is populated in ordinary cases.
        cell: (row) =>
            row.subscription?.plan.name ?? (
                <span className="text-muted-foreground">—</span>
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
    {
        id: "invoice",
        header: "",
        align: "right",
        cell: (row) => (
            <InvoiceDownloadButton
                paymentId={row.id}
                invoiceNumber={row.invoiceNumber}
            />
        ),
    },
];

export default function OrgBillingPage() {
    const router = useRouter();
    const [status, setStatus] = useState(ANY);
    const [page, setPage] = useState(1);

    const params = {
        page,
        limit: PAGE_SIZE,
        ...(status === ANY ? {} : { status }),
    };

    const { data, error, isLoading, refetch } = useQuery({
        queryKey: queryKeys.payments(params),
        queryFn: () => getList<PaymentListRow[]>("/payments", params),
        placeholderData: keepPreviousData,
    });

    return (
        <>
            <PageHeader
                title="Billing history"
                description="Every payment taken against your organization."
            />

            <DataTable
                columns={columns}
                rows={data?.data}
                rowKey={(row) => row.id}
                onRowClick={(row) => router.push(`/org/billing/${row.id}`)}
                filters={[
                    {
                        value: status,
                        onChange: (value) => {
                            setStatus(value);
                            setPage(1);
                        },
                        options: [
                            { value: ANY, label: "All statuses" },
                            { value: "SUCCESS", label: "Success" },
                            { value: "PENDING", label: "Pending" },
                            { value: "FAILED", label: "Failed" },
                            { value: "REFUNDED", label: "Refunded" },
                        ],
                        label: "Status",
                    },
                ]}
                isLoading={isLoading}
                error={error}
                onRetry={() => refetch()}
                empty={{
                    title:
                        status === ANY
                            ? "No payments yet"
                            : "No payments with that status",
                    body:
                        status === ANY
                            ? "Payments appear here once Stripe confirms one by webhook."
                            : undefined,
                }}
                meta={data?.meta}
                onPageChange={setPage}
            />
        </>
    );
}
