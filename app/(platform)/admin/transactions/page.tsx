"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
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
import type { LedgerTransaction, OrganizationListRow } from "@/lib/types";

const PAGE_SIZE = 20;

/** Radix's Select reserves the empty string, so "no filter" needs a sentinel. */
const ANY = "ANY";

const STATUS_OPTIONS = [
    { value: ANY, label: "All statuses" },
    { value: "SUCCESS", label: "Success" },
    { value: "PENDING", label: "Pending" },
    { value: "FAILED", label: "Failed" },
    { value: "REFUNDED", label: "Refunded" },
    { value: "ROLLED_BACK", label: "Rolled back" },
];

const columns: Column<LedgerTransaction>[] = [
    {
        id: "createdAt",
        header: "Date",
        cell: (row) => (
            <span className="whitespace-nowrap">{formatDateTime(row.createdAt)}</span>
        ),
    },
    {
        id: "organization",
        header: "Organization",
        // The row itself is not clickable here, deliberately: the useful target
        // is the organization, and a whole-row link would swallow this one.
        cell: (row) =>
            row.organization ? (
                <Link href={`/admin/organizations/${row.organization.id}`}>
                    {row.organization.name}
                </Link>
            ) : (
                <span className="text-muted-foreground">—</span>
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

export default function AdminTransactionsPage() {
    const [status, setStatus] = useState(ANY);
    const [organizationId, setOrganizationId] = useState(ANY);
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [page, setPage] = useState(1);

    // The filter dropdown needs every organization, not the first page of them.
    const { data: organizations } = useQuery({
        queryKey: queryKeys.organizations({ limit: 100 }),
        queryFn: () =>
            getList<OrganizationListRow[]>("/organizations", { limit: 100 }),
    });

    const params = {
        page,
        limit: PAGE_SIZE,
        ...(status === ANY ? {} : { status }),
        ...(organizationId === ANY ? {} : { organizationId }),
        ...(from ? { from } : {}),
        // A date input yields midnight, which would exclude everything that
        // happened on the chosen end date. Push it to the end of that day.
        ...(to ? { to: `${to}T23:59:59.999Z` } : {}),
    };

    const { data, error, isLoading, refetch } = useQuery({
        queryKey: queryKeys.allTransactions(params),
        queryFn: () => getList<LedgerTransaction[]>("/transactions/all", params),
        placeholderData: keepPreviousData,
    });

    /** Any narrowing resets paging — page 4 of a smaller result set is empty. */
    const withReset =
        <T,>(setter: (value: T) => void) =>
        (value: T) => {
            setter(value);
            setPage(1);
        };

    const isFiltered =
        status !== ANY || organizationId !== ANY || from !== "" || to !== "";

    const clearFilters = () => {
        setStatus(ANY);
        setOrganizationId(ANY);
        setFrom("");
        setTo("");
        setPage(1);
    };

    return (
        <>
            <PageHeader
                title="Transactions"
                description="Every recorded transaction across all organizations."
            />

            <DataTable
                columns={columns}
                rows={data?.data}
                rowKey={(row) => row.id}
                filters={[
                    {
                        value: status,
                        onChange: withReset(setStatus),
                        options: STATUS_OPTIONS,
                        label: "Status",
                    },
                    {
                        value: organizationId,
                        onChange: withReset(setOrganizationId),
                        options: [
                            { value: ANY, label: "All organizations" },
                            ...(organizations?.data ?? []).map((org) => ({
                                value: org.id,
                                label: org.name,
                            })),
                        ],
                        label: "Organization",
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
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
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
