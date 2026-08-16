"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
    DefinitionRow,
    FormAlert,
    FormField,
    PageHeader,
} from "@/components/patterns";
import { ErrorState, LoadingState } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiError, get, patch } from "@/lib/api-client";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { type OrganizationValues, organizationSchema } from "@/lib/schemas";
import type { MyOrganization } from "@/lib/types";

function OrganizationForm({
    organization,
    onDone,
}: {
    organization: MyOrganization;
    onDone: () => void;
}) {
    const queryClient = useQueryClient();
    const [formError, setFormError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<OrganizationValues>({
        resolver: zodResolver(organizationSchema),
        defaultValues: {
            name: organization.name,
            contactEmail: organization.contactEmail ?? "",
            billingEmail: organization.billingEmail ?? "",
        },
    });

    const save = useMutation({
        mutationFn: (values: OrganizationValues) =>
            patch<MyOrganization>("/organizations/me", values),
        onSuccess: async () => {
            toast.success("Organization updated");
            onDone();
            // The organization name is part of the session too, so both caches
            // must be refreshed or the shell keeps showing the old one.
            await queryClient.invalidateQueries({
                queryKey: queryKeys.myOrganization,
            });
            await queryClient.invalidateQueries({ queryKey: queryKeys.session });
        },
        onError: (error) => {
            if (error instanceof ApiError && error.fieldErrors.length > 0) {
                for (const [field, message] of Object.entries(error.byField())) {
                    setError(field as keyof OrganizationValues, { message });
                }
                return;
            }
            setFormError(
                error instanceof ApiError
                    ? error.message
                    : "Your organization could not be saved",
            );
        },
    });

    return (
        <form
            onSubmit={handleSubmit((values) => {
                setFormError(null);
                save.mutate(values);
            })}
        >
            {formError && <FormAlert>{formError}</FormAlert>}

            <FormField label="Name" htmlFor="org-name" error={errors.name?.message}>
                <Input id="org-name" {...register("name")} />
            </FormField>

            <FormField
                label="Contact email"
                htmlFor="org-contact"
                error={errors.contactEmail?.message}
                hint="Where account notices are sent."
            >
                <Input id="org-contact" type="email" {...register("contactEmail")} />
            </FormField>

            <FormField
                label="Billing email"
                htmlFor="org-billing"
                error={errors.billingEmail?.message}
                hint="Where invoices and payment receipts go."
            >
                <Input id="org-billing" type="email" {...register("billingEmail")} />
            </FormField>

            <div className="mt-2 flex gap-2">
                <Button type="submit" disabled={save.isPending}>
                    {save.isPending ? "Saving…" : "Save changes"}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={onDone}
                    disabled={save.isPending}
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
}

export default function OrganizationProfilePage() {
    const [editing, setEditing] = useState(false);

    const { data, error, isLoading, refetch } = useQuery({
        queryKey: queryKeys.myOrganization,
        queryFn: () => get<MyOrganization>("/organizations/me"),
    });

    if (isLoading) return <LoadingState label="Loading your organization…" />;
    if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
    if (!data) return null;

    const subscription = data.subscription;

    return (
        <>
            <PageHeader
                title={data.name}
                description="Your organization's profile and current plan."
                action={
                    !editing && (
                        <Button variant="outline" onClick={() => setEditing(true)}>
                            Edit profile
                        </Button>
                    )
                }
            />

            <div className="grid gap-4 lg:grid-cols-2">
                <Card className="px-6">
                    <p className="mb-2 text-sm font-semibold">Profile</p>
                    {editing ? (
                        <OrganizationForm
                            organization={data}
                            onDone={() => setEditing(false)}
                        />
                    ) : (
                        <>
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
                                {formatNumber(data._count.users)}
                            </DefinitionRow>
                            <DefinitionRow label="Created">
                                {formatDate(data.createdAt)}
                            </DefinitionRow>
                        </>
                    )}
                </Card>

                <Card className="px-6">
                    <p className="mb-2 text-sm font-semibold">Plan</p>
                    {subscription ? (
                        <>
                            <DefinitionRow label="Subscription">
                                <StatusBadge status={subscription.status} />
                            </DefinitionRow>
                            <DefinitionRow label="Plan">
                                {subscription.plan.name}
                            </DefinitionRow>
                            <DefinitionRow label="Price">
                                {formatMoney(subscription.plan.priceCents)} /{" "}
                                {subscription.plan.billingInterval.toLowerCase()}
                            </DefinitionRow>
                            <p className="pt-4">
                                <Link href="/org/subscription" className="text-sm">
                                    Manage subscription →
                                </Link>
                            </p>
                        </>
                    ) : (
                        <p className="py-6 text-center text-[13px] text-muted-foreground">
                            No subscription on file.
                        </p>
                    )}
                </Card>
            </div>
        </>
    );
}
