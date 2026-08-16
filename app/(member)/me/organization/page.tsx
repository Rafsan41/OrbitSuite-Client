"use client";

import { useQuery } from "@tanstack/react-query";
import { DefinitionRow, PageHeader } from "@/components/patterns";
import { ErrorState, LoadingState } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { get } from "@/lib/api-client";
import { formatNumber } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import type { OrgStatus } from "@/lib/types";

/**
 * The member's view of their organization. Not a trimmed-down copy of the admin
 * view: the endpoint itself returns only these five fields, so the billing and
 * payment detail never reaches the browser rather than being hidden in markup.
 */
interface OrganizationSummary {
    id: string;
    name: string;
    status: OrgStatus;
    memberCount: number;
    plan: string | null;
}

export default function MyOrganizationPage() {
    const { data, error, isLoading, refetch } = useQuery({
        queryKey: queryKeys.myOrganizationSummary,
        queryFn: () => get<OrganizationSummary>("/organizations/me/summary"),
    });

    if (isLoading) return <LoadingState label="Loading your organization…" />;
    if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
    if (!data) return null;

    return (
        <>
            <PageHeader
                title={data.name}
                description="Your organization, as it stands today."
            />

            <Card className="max-w-lg px-6">
                <DefinitionRow label="Status">
                    <StatusBadge status={data.status} />
                </DefinitionRow>
                <DefinitionRow label="Plan">
                    {data.plan ?? "No plan"}
                </DefinitionRow>
                <DefinitionRow label="Members">
                    {formatNumber(data.memberCount)}
                </DefinitionRow>
            </Card>

            <p className="mt-4 max-w-lg text-[13px] text-muted-foreground">
                Billing, subscription and member management are handled by your
                organization&apos;s administrator.
            </p>
        </>
    );
}
