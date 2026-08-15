"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { type Column, DataTable } from "@/components/data-table";
import { FormAlert, FormField, PageHeader } from "@/components/patterns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, getList, patch, post } from "@/lib/api-client";
import { formatMoney } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import type { Plan } from "@/lib/types";

/**
 * The form works in dollars, because that is what the price is to the person
 * typing it; the API works in cents, because floats cannot hold money. The
 * conversion happens once, at this boundary, and nowhere else.
 */
const planFormSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Plan name must be at least 2 characters")
        .max(60, "Plan name must be 60 characters or fewer"),
    priceDollars: z
        .number({ message: "Enter a price" })
        .min(0, "Price cannot be negative"),
    billingInterval: z.enum(["MONTH", "YEAR"]),
    /** One feature per line — a tag input is more UI than this earns. */
    features: z.string(),
});

type PlanFormValues = z.output<typeof planFormSchema>;

const toFeatureList = (value: string) =>
    value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

/** Prisma stores `features` as nullable JSON, so it is not guaranteed to be an array. */
const featuresOf = (plan: Plan): string[] =>
    Array.isArray(plan.features) ? plan.features : [];

function PlanFormDialog({
    plan,
    onClose,
}: {
    /** Absent means create; present means edit. */
    plan?: Plan;
    onClose: () => void;
}) {
    const queryClient = useQueryClient();
    const isEdit = !!plan;
    const [formError, setFormError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors },
    } = useForm<PlanFormValues>({
        resolver: zodResolver(planFormSchema),
        defaultValues: {
            name: plan?.name ?? "",
            priceDollars: plan ? plan.priceCents / 100 : 0,
            billingInterval: plan?.billingInterval ?? "MONTH",
            features: plan ? featuresOf(plan).join("\n") : "",
        },
    });

    // `useWatch`, not `watch()` — the latter returns a fresh function each
    // render, which makes React Compiler bail out of memoizing this component.
    const billingInterval = useWatch({ control, name: "billingInterval" });

    const save = useMutation({
        mutationFn: (values: PlanFormValues) => {
            const features = toFeatureList(values.features);

            // Price and interval are absent from the edit payload on purpose: a
            // Stripe Price is immutable, so changing an amount means issuing a
            // new plan rather than rewriting this one under its subscribers.
            return isEdit
                ? patch<Plan>(`/plans/${plan.id}`, { name: values.name, features })
                : post<Plan>("/plans", {
                      name: values.name,
                      priceCents: Math.round(values.priceDollars * 100),
                      billingInterval: values.billingInterval,
                      features,
                  });
        },
        onSuccess: async () => {
            toast.success(isEdit ? "Plan updated" : "Plan created");
            onClose();
            await queryClient.invalidateQueries({ queryKey: queryKeys.plans() });
        },
        onError: (error) => {
            setFormError(
                error instanceof ApiError
                    ? error.message
                    : "The plan could not be saved",
            );
        },
    });

    return (
        <Dialog open onOpenChange={(next) => !next && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit plan" : "New plan"}</DialogTitle>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit((values) => {
                        setFormError(null);
                        save.mutate(values);
                    })}
                >
                    {formError && <FormAlert>{formError}</FormAlert>}

                    <FormField
                        label="Plan name"
                        htmlFor="plan-name"
                        error={errors.name?.message}
                    >
                        <Input id="plan-name" {...register("name")} />
                    </FormField>

                    <FormField
                        label="Price"
                        htmlFor="plan-price"
                        error={errors.priceDollars?.message}
                        hint={
                            isEdit
                                ? "Fixed once the plan exists — Stripe prices cannot be changed."
                                : "In US dollars."
                        }
                    >
                        <Input
                            id="plan-price"
                            type="number"
                            min={0}
                            step="0.01"
                            disabled={isEdit}
                            {...register("priceDollars", { valueAsNumber: true })}
                        />
                    </FormField>

                    <FormField label="Billing interval" htmlFor="plan-interval">
                        <Select
                            value={billingInterval}
                            onValueChange={(value) =>
                                setValue("billingInterval", value as "MONTH" | "YEAR")
                            }
                            disabled={isEdit}
                        >
                            <SelectTrigger id="plan-interval" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MONTH">Monthly</SelectItem>
                                <SelectItem value="YEAR">Yearly</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormField>

                    <FormField
                        label="Features"
                        htmlFor="plan-features"
                        error={errors.features?.message}
                        hint="One per line. These appear on the pricing cards."
                    >
                        <Textarea id="plan-features" rows={4} {...register("features")} />
                    </FormField>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={save.isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={save.isPending}>
                            {save.isPending
                                ? "Saving…"
                                : isEdit
                                  ? "Save changes"
                                  : "Create plan"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function AdminPlansPage() {
    const queryClient = useQueryClient();
    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState<Plan | null>(null);

    // The catalogue is a handful of rows and the admin needs to see the hidden
    // ones, so it is fetched whole rather than paged.
    const params = { includeInactive: true, limit: 100 };

    const { data, error, isLoading, refetch } = useQuery({
        queryKey: queryKeys.plans(params),
        queryFn: () => getList<Plan[]>("/plans", params),
    });

    const setActive = useMutation({
        mutationFn: ({ id, enable }: { id: string; enable: boolean }) =>
            patch<Plan>(`/plans/${id}/${enable ? "enable" : "disable"}`),
        onSuccess: async (plan) => {
            toast.success(
                plan.isActive
                    ? `${plan.name} is available to new signups`
                    : `${plan.name} is hidden from new signups`,
            );
            await queryClient.invalidateQueries({ queryKey: queryKeys.plans() });
        },
        onError: (mutationError) => {
            toast.error(
                mutationError instanceof ApiError
                    ? mutationError.message
                    : "The plan could not be updated",
            );
        },
    });

    const columns: Column<Plan>[] = [
        {
            id: "name",
            header: "Plan",
            cell: (row) => <span className="font-medium">{row.name}</span>,
        },
        {
            id: "price",
            header: "Price",
            cell: (row) => (
                <span className="tabular-nums">
                    {formatMoney(row.priceCents)} /{" "}
                    {row.billingInterval.toLowerCase()}
                </span>
            ),
        },
        {
            id: "features",
            header: "Features",
            cell: (row) => {
                const features = featuresOf(row);
                return features.length === 0 ? (
                    <span className="text-muted-foreground">None listed</span>
                ) : (
                    <span className="text-muted-foreground">
                        {features.join(" · ")}
                    </span>
                );
            },
        },
        {
            id: "status",
            header: "Status",
            // Not a StatusBadge: `isActive` is a boolean flag on the catalogue,
            // not one of the lifecycle enums that component maps.
            cell: (row) => (
                <Badge
                    variant="outline"
                    className={
                        row.isActive
                            ? "rounded-full border-status-success-border bg-status-success-bg px-2.5 py-0.5 text-[11px] text-status-success-fg"
                            : "rounded-full border-status-neutral-border bg-status-neutral-bg px-2.5 py-0.5 text-[11px] text-status-neutral-fg"
                    }
                >
                    {row.isActive ? "Available" : "Hidden"}
                </Badge>
            ),
        },
        {
            id: "actions",
            header: "",
            align: "right",
            cell: (row) => (
                <div className="flex justify-end gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditing(row)}
                    >
                        Edit
                    </Button>
                    <ConfirmDialog
                        trigger={
                            <Button variant="outline" size="sm">
                                {row.isActive ? "Hide" : "Make available"}
                            </Button>
                        }
                        title={
                            row.isActive
                                ? `Hide ${row.name} from signups?`
                                : `Offer ${row.name} again?`
                        }
                        description={
                            row.isActive
                                ? "New signups will no longer see this plan. Existing subscribers keep it and continue to be billed as before — the plan is never deleted, because their billing history references it."
                                : "This plan will appear on the pricing page and be selectable at registration."
                        }
                        confirmLabel={row.isActive ? "Hide plan" : "Make available"}
                        pending={setActive.isPending}
                        pendingLabel="Saving…"
                        onConfirm={() =>
                            setActive.mutate({ id: row.id, enable: !row.isActive })
                        }
                    />
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Plans"
                description="The subscription catalogue every organization chooses from."
                action={<Button onClick={() => setCreating(true)}>New plan</Button>}
            />

            {creating && <PlanFormDialog onClose={() => setCreating(false)} />}

            {/* Keyed on the plan id so switching rows remounts the form with the
                right defaults — react-hook-form reads defaultValues only once. */}
            {editing && (
                <PlanFormDialog
                    key={editing.id}
                    plan={editing}
                    onClose={() => setEditing(null)}
                />
            )}

            <DataTable
                columns={columns}
                rows={data?.data}
                rowKey={(row) => row.id}
                isLoading={isLoading}
                error={error}
                onRetry={() => refetch()}
                empty={{
                    title: "No plans yet",
                    body: "Create a plan before anyone can register — registration requires choosing one.",
                }}
            />
        </>
    );
}
