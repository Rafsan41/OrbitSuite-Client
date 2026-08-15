"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type Column, DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/patterns";
import { StatusBadge } from "@/components/status-badge";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getList } from "@/lib/api-client";
import { formatDate, formatNumber } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import type { OrganizationListRow, OrgStatus } from "@/lib/types";

const PAGE_SIZE = 20;

/**
 * Radix's Select refuses an empty string as an item value — it reserves that to
 * mean "nothing selected". So the no-filter option carries a sentinel and is
 * stripped before the request, rather than being sent as `status=`.
 */
const ANY_STATUS = "ANY";

const STATUS_OPTIONS: { value: OrgStatus | typeof ANY_STATUS; label: string }[] = [
    { value: ANY_STATUS, label: "All statuses" },
    { value: "ACTIVE", label: "Active" },
    { value: "PENDING", label: "Pending" },
    { value: "TRIAL", label: "Trial" },
    { value: "SUSPENDED", label: "Suspended" },
    { value: "CANCELLED", label: "Cancelled" },
];

const columns: Column<OrganizationListRow>[] = [
    {
        id: "name",
        header: "Organization",
        cell: (row) => (
            <div>
                <span className="font-medium">{row.name}</span>
                <span className="block text-xs text-muted-foreground">
                    {row.contactEmail ?? "No contact email"}
                </span>
            </div>
        ),
    },
    {
        id: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
    },
    {
        id: "plan",
        header: "Plan",
        // An organization with no subscription row is a real state — it
        // registered and never completed checkout.
        cell: (row) =>
            row.plan ?? <span className="text-muted-foreground">No plan</span>,
    },
    {
        id: "subscription",
        header: "Subscription",
        cell: (row) =>
            row.subscriptionStatus ? (
                <StatusBadge status={row.subscriptionStatus} />
            ) : (
                <span className="text-muted-foreground">—</span>
            ),
    },
    {
        id: "members",
        header: "Members",
        align: "right",
        cell: (row) => (
            <span className="tabular-nums">{formatNumber(row.memberCount)}</span>
        ),
    },
    {
        id: "createdAt",
        header: "Signed up",
        align: "right",
        cell: (row) => (
            <span className="whitespace-nowrap text-muted-foreground">
                {formatDate(row.createdAt)}
            </span>
        ),
    },
];

export default function AdminOrganizationsPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<string>(ANY_STATUS);
    const [page, setPage] = useState(1);

    const debouncedSearch = useDebouncedValue(search);

    const params = {
        page,
        limit: PAGE_SIZE,
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
        ...(status === ANY_STATUS ? {} : { status }),
    };

    const { data, error, isLoading, refetch } = useQuery({
        queryKey: queryKeys.organizations(params),
        queryFn: () => getList<OrganizationListRow[]>("/organizations", params),
        // Without this the table empties and re-skeletons every time a keystroke
        // lands. Holding the previous page keeps the rows in place while the
        // next result set is in flight.
        placeholderData: keepPreviousData,
    });

    /**
     * Narrowing the result set has to send you back to page 1 — page 4 of a
     * filter that now yields six rows is an empty table that reads as a bug.
     * Done in the handlers rather than an effect, so there is never a render
     * that requests a page which cannot exist.
     */
    const onSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const onStatusChange = (value: string) => {
        setStatus(value);
        setPage(1);
    };

    const isFiltered = status !== ANY_STATUS || debouncedSearch.trim() !== "";

    return (
        <>
            <PageHeader
                title="Organizations"
                description="Every tenant on the platform, with its plan and current standing."
            />

            <DataTable
                columns={columns}
                rows={data?.data}
                rowKey={(row) => row.id}
                onRowClick={(row) => router.push(`/admin/organizations/${row.id}`)}
                search={{
                    value: search,
                    onChange: onSearchChange,
                    placeholder: "Search name or email…",
                }}
                filters={[
                    {
                        value: status,
                        onChange: onStatusChange,
                        options: STATUS_OPTIONS,
                        label: "Status",
                    },
                ]}
                isLoading={isLoading}
                error={error}
                onRetry={() => refetch()}
                empty={{
                    title: isFiltered
                        ? "No organizations match those filters"
                        : "No organizations yet",
                    body: isFiltered
                        ? "Try a different status, or clear the search."
                        : "Organizations appear here once someone completes registration and pays.",
                }}
                meta={data?.meta}
                onPageChange={setPage}
            />
        </>
    );
}
