"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { PageHeader } from "@/components/patterns";
import { ReseedButton } from "@/components/reseed-button";
import { ErrorState, LoadingState } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { get } from "@/lib/api-client";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import type { PlatformStats } from "@/lib/types";

export default function PlatformOverviewPage() {
    const { data, error, isLoading, refetch } = useQuery({
        queryKey: queryKeys.stats,
        queryFn: () => get<PlatformStats>("/stats"),
    });

    if (isLoading) return <LoadingState label="Loading platform statistics…" />;
    if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
    if (!data) return null;

    const headline = [
        { label: "Organizations", value: formatNumber(data.organizations.total) },
        { label: "Users", value: formatNumber(data.users.total) },
        { label: "Active subscriptions", value: formatNumber(data.subscriptions.active) },
        { label: "Revenue", value: formatMoney(data.revenue.totalCents) },
    ];

    return (
        <>
            <PageHeader
                title="Overview"
                description="Platform-wide totals across every organization."
                action={<ReseedButton />}
            />

            <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {headline.map((stat) => (
                    <Card key={stat.label} className="px-6">
                        <p className="text-[13px] text-muted-foreground">{stat.label}</p>
                        <p className="mt-1 text-[28px] font-bold tabular-nums">
                            {stat.value}
                        </p>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card className="px-6">
                    <p className="mb-3 text-sm font-semibold">Payments</p>
                    <dl className="grid grid-cols-2 gap-4">
                        <div>
                            <dt className="text-[13px] text-muted-foreground">
                                Successful
                            </dt>
                            <dd className="text-xl font-bold text-status-success-fg tabular-nums">
                                {formatNumber(data.revenue.successfulPayments)}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-[13px] text-muted-foreground">Failed</dt>
                            {/* Zero failures is good news, so it is not painted
                                red — only a non-zero count is worth alarm. */}
                            <dd
                                className={
                                    data.revenue.failedPayments > 0
                                        ? "text-xl font-bold text-status-failed-fg tabular-nums"
                                        : "text-xl font-bold text-muted-foreground tabular-nums"
                                }
                            >
                                {formatNumber(data.revenue.failedPayments)}
                            </dd>
                        </div>
                    </dl>
                </Card>

                <Card className="px-6">
                    <p className="mb-3 text-sm font-semibold">Organizations by status</p>
                    {Object.keys(data.organizations.byStatus).length === 0 ? (
                        <p className="text-[13px] text-muted-foreground">
                            No organizations yet.
                        </p>
                    ) : (
                        <ul className="m-0 grid list-none gap-2 p-0">
                            {Object.entries(data.organizations.byStatus).map(
                                ([status, count]) => (
                                    <li
                                        key={status}
                                        className="flex items-center justify-between gap-3"
                                    >
                                        <StatusBadge status={status} />
                                        <span className="text-sm font-medium tabular-nums">
                                            {formatNumber(count ?? 0)}
                                        </span>
                                    </li>
                                ),
                            )}
                        </ul>
                    )}
                </Card>

                <Card className="px-6">
                    <p className="mb-3 text-sm font-semibold">
                        Monthly recurring revenue by plan
                    </p>
                    {data.subscriptions.byPlan.length === 0 ? (
                        <p className="text-[13px] text-muted-foreground">
                            No active subscriptions yet.
                        </p>
                    ) : (
                        <ul className="m-0 grid list-none gap-2.5 p-0">
                            {data.subscriptions.byPlan.map((row) => (
                                <li
                                    key={row.planName}
                                    className="flex items-center justify-between gap-3 text-sm"
                                >
                                    <span>
                                        {row.planName}
                                        <span className="ml-2 text-[13px] text-muted-foreground">
                                            {formatNumber(row.subscribers)}{" "}
                                            {row.subscribers === 1
                                                ? "subscriber"
                                                : "subscribers"}
                                        </span>
                                    </span>
                                    <span className="font-medium tabular-nums">
                                        {formatMoney(row.monthlyRecurringCents)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                <Card className="px-6">
                    <p className="mb-3 text-sm font-semibold">
                        Recent signups
                        <span className="ml-2 font-normal text-muted-foreground">
                            last 30 days
                        </span>
                    </p>
                    {data.organizations.recentSignups.length === 0 ? (
                        <p className="text-[13px] text-muted-foreground">
                            No signups in the last 30 days.
                        </p>
                    ) : (
                        <ul className="m-0 grid list-none gap-2.5 p-0">
                            {data.organizations.recentSignups.map((org) => (
                                <li
                                    key={org.id}
                                    className="flex items-center justify-between gap-3 text-sm"
                                >
                                    <Link href={`/admin/organizations/${org.id}`}>
                                        {org.name}
                                    </Link>
                                    <span className="flex items-center gap-2">
                                        <StatusBadge status={org.status} />
                                        <span className="text-[13px] text-muted-foreground">
                                            {formatDate(org.createdAt)}
                                        </span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>
        </>
    );
}
