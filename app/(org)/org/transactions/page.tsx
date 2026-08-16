"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { type Column, DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/patterns";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getList } from "@/lib/api-client";
import { formatDateTime, formatMoney, humanize } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import type { LedgerTransaction } from "@/lib/types";

const PAGE_SIZE = 20;
const ANY = "ANY";

const columns: Column<LedgerTransaction>[] = [
    {
        id: "createdAt",
        header: "Date",
        cell: (row) => (
            <span className="whitespace-nowrap">{formatDateTime(row.createdAt)}</span>
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
            <span className="font-medium tabular-nums">
                {formatMoney(row.amountCents, row.payment?.currency ?? "usd")}
            </span>
        ),
    },
];

export default function OrgTransactionsPage() {
    const [status, setStatus] = useState(ANY);
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [page, setPage] = useState(1);

    const params = {
        page,
        limit: PAGE_SIZE,
        ...(status === ANY ? {} : { status }),
        ...(from ? { from } : {}),
        // A date input gives midnight, which would exclude everything that
        // happened on the chosen end date. Push it to the end of that day.
        ...(to ? { to: `${to}T23:59:59.999Z` } : {}),
    };

    const { data, error, isLoading, refetch } = useQuery({
        queryKey: queryKeys.transactions(params),
        // The tenant-scoped route: no organizationId is sent, because the
        // server pins it from the session regardless of what a client asks for.
        queryFn: () => getList<LedgerTransaction[]>("/transactions", params),
        placeholderData: keepPreviousData,
    });

    const withReset =
        <T,>(setter: (value: T) => void) =>
        (value: T) => {
            setter(value);
            setPage(1);
        };

    const isFiltered = status !== ANY || from !== "" || to !== "";

    return (
        <>
            <PageHeader
                title="Transactions"
                description="Your organization's transaction history."
            />

            <DataTable
                columns={columns}
                rows={data?.data}
                rowKey={(row) => row.id}
                filters={[
                    {
                        value: status,
                        onChange: withReset(setStatus),
                        options: [
                            { value: ANY, label: "All statuses" },
                            { value: "SUCCESS", label: "Success" },
                            { value: "PENDING", label: "Pending" },
                            { value: "FAILED", label: "Failed" },
                            { value: "REFUNDED", label: "Refunded" },
                            { value: "ROLLED_BACK", label: "Rolled back" },
                        ],
                        label: "Status",
                    },
                ]}
                action={
                    <div className="flex flex-wrap items-end gap-2">
                        <div className="grid gap-1">
                            <Label htmlFor="from" className="text-xs">
                                From
                            </Label>
                            <Input
                                id="from"
                                type="date"
                                value={from}
                                max={to || undefined}
                                onChange={(e) => withReset(setFrom)(e.target.value)}
                                className="w-40"
                            />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="to" className="text-xs">
                                To
                            </Label>
                            <Input
                                id="to"
                                type="date"
                                value={to}
                                min={from || undefined}
                                onChange={(e) => withReset(setTo)(e.target.value)}
                                className="w-40"
                            />
                        </div>
                        {isFiltered && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setStatus(ANY);
                                    setFrom("");
                                    setTo("");
                                    setPage(1);
                                }}
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                }
                isLoading={isLoading}
                error={error}
                onRetry={() => refetch()}
                empty={{
                    title: isFiltered
                        ? "No transactions match those filters"
                        : "No transactions yet",
                    body: isFiltered
                        ? "Try a wider date range, or clear the filters."
                        : "Transactions are written whenever a payment succeeds, fails or is rolled back.",
                }}
                meta={data?.meta}
                onPageChange={setPage}
            />
        </>
    );
}
