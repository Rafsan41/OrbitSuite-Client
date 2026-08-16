"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { type Column, DataTable } from "@/components/data-table";
import { FormAlert, FormField, PageHeader } from "@/components/patterns";
import { StatusBadge } from "@/components/status-badge";
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
import { useAuth } from "@/hooks/use-auth";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ApiError, del, getList, patch, post } from "@/lib/api-client";
import { formatDate, ROLE_LABELS } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { type InviteValues, inviteSchema } from "@/lib/schemas";
import type { Member, Role } from "@/lib/types";

const PAGE_SIZE = 20;
const ANY = "ANY";

function InviteDialog({ onClose }: { onClose: () => void }) {
    const queryClient = useQueryClient();
    const [formError, setFormError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        setError,
        formState: { errors },
    } = useForm<InviteValues>({
        resolver: zodResolver(inviteSchema),
        defaultValues: { name: "", email: "", role: "ORG_MEMBER" },
    });

    const invite = useMutation({
        mutationFn: (values: InviteValues) => post<unknown>("/users/invite", values),
        onSuccess: async () => {
            toast.success("Invitation sent");
            onClose();
            await queryClient.invalidateQueries({ queryKey: queryKeys.members() });
        },
        onError: (error) => {
            if (error instanceof ApiError && error.fieldErrors.length > 0) {
                for (const [field, message] of Object.entries(error.byField())) {
                    setError(field as keyof InviteValues, { message });
                }
                return;
            }
            // A duplicate email returns a 409 whose message already reads
            // correctly for both cases the API distinguishes.
            setFormError(
                error instanceof ApiError
                    ? error.message
                    : "The invitation could not be sent",
            );
        },
    });

    return (
        <Dialog open onOpenChange={(next) => !next && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite a member</DialogTitle>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit((values) => {
                        setFormError(null);
                        invite.mutate(values);
                    })}
                >
                    {formError && <FormAlert>{formError}</FormAlert>}

                    <FormField
                        label="Name"
                        htmlFor="invite-name"
                        error={errors.name?.message}
                    >
                        <Input id="invite-name" {...register("name")} />
                    </FormField>

                    <FormField
                        label="Email"
                        htmlFor="invite-email"
                        error={errors.email?.message}
                        hint="They receive a link to set their own password."
                    >
                        <Input id="invite-email" type="email" {...register("email")} />
                    </FormField>

                    <FormField label="Role" htmlFor="invite-role">
                        <Select
                            defaultValue="ORG_MEMBER"
                            onValueChange={(value) =>
                                setValue("role", value as InviteValues["role"])
                            }
                        >
                            <SelectTrigger id="invite-role" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ORG_MEMBER">Member</SelectItem>
                                <SelectItem value="ORG_ADMIN">
                                    Organization admin
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </FormField>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={invite.isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={invite.isPending}>
                            {invite.isPending ? "Sending…" : "Send invitation"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function OrgMembersPage() {
    const { session } = useAuth();
    const queryClient = useQueryClient();

    const [inviting, setInviting] = useState(false);
    const [search, setSearch] = useState("");
    const [role, setRole] = useState(ANY);
    const [status, setStatus] = useState(ANY);
    const [page, setPage] = useState(1);

    const debouncedSearch = useDebouncedValue(search);

    const params = {
        page,
        limit: PAGE_SIZE,
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
        ...(role === ANY ? {} : { role }),
        ...(status === ANY ? {} : { status }),
    };

    const { data, error, isLoading, refetch } = useQuery({
        queryKey: queryKeys.members(params),
        queryFn: () => getList<Member[]>("/users", params),
        placeholderData: keepPreviousData,
    });

    const refreshMembers = () =>
        queryClient.invalidateQueries({ queryKey: queryKeys.members() });

    const changeRole = useMutation({
        mutationFn: ({ id, nextRole }: { id: string; nextRole: Role }) =>
            patch<Member>(`/users/${id}/role`, { role: nextRole }),
        onSuccess: async (member) => {
            toast.success(`${member.name} is now ${ROLE_LABELS[member.role]}`);
            await refreshMembers();
        },
        onError: (mutationError) => {
            // The API refuses to demote the last active admin. That message is
            // worth showing verbatim — it explains itself.
            toast.error(
                mutationError instanceof ApiError
                    ? mutationError.message
                    : "The role could not be changed",
            );
        },
    });

    const remove = useMutation({
        mutationFn: (id: string) => del<Member>(`/users/${id}`),
        onSuccess: async (member) => {
            toast.success(`${member.name} was removed`);
            await refreshMembers();
        },
        onError: (mutationError) => {
            toast.error(
                mutationError instanceof ApiError
                    ? mutationError.message
                    : "The member could not be removed",
            );
        },
    });

    const withReset =
        <T,>(setter: (value: T) => void) =>
        (value: T) => {
            setter(value);
            setPage(1);
        };

    const columns: Column<Member>[] = [
        {
            id: "name",
            header: "Member",
            cell: (row) => (
                <div>
                    <span className="font-medium">{row.name}</span>
                    {row.id === session?.user.id && (
                        <span className="ml-2 text-xs text-muted-foreground">you</span>
                    )}
                    <span className="block text-xs text-muted-foreground">
                        {row.email}
                    </span>
                </div>
            ),
        },
        {
            id: "role",
            header: "Role",
            cell: (row) => ROLE_LABELS[row.role] ?? row.role,
        },
        {
            id: "status",
            header: "Status",
            cell: (row) => <StatusBadge status={row.status} />,
        },
        {
            id: "createdAt",
            header: "Joined",
            cell: (row) => (
                <span className="whitespace-nowrap text-muted-foreground">
                    {formatDate(row.createdAt)}
                </span>
            ),
        },
        {
            id: "actions",
            header: "",
            align: "right",
            cell: (row) => {
                // The API rejects acting on yourself, and a removed member has
                // nothing left to act on. Hiding the controls means nobody is
                // offered a button that can only ever return an error.
                if (row.id === session?.user.id || row.status === "REMOVED") {
                    return null;
                }

                const nextRole: Role =
                    row.role === "ORG_ADMIN" ? "ORG_MEMBER" : "ORG_ADMIN";

                return (
                    <div className="flex justify-end gap-2">
                        <ConfirmDialog
                            trigger={
                                <Button variant="outline" size="sm">
                                    {row.role === "ORG_ADMIN"
                                        ? "Make member"
                                        : "Make admin"}
                                </Button>
                            }
                            title={`Change ${row.name}'s role?`}
                            description={
                                nextRole === "ORG_ADMIN"
                                    ? "Organization admins can manage members, billing and the subscription."
                                    : "They keep access to the product but lose member, billing and subscription management."
                            }
                            confirmLabel="Change role"
                            pending={changeRole.isPending}
                            pendingLabel="Saving…"
                            onConfirm={() => changeRole.mutate({ id: row.id, nextRole })}
                        />
                        <ConfirmDialog
                            trigger={
                                <Button variant="outline" size="sm">
                                    Remove
                                </Button>
                            }
                            title={`Remove ${row.name}?`}
                            description="They lose access immediately. The account is marked removed rather than deleted, so payment and transaction history stays readable."
                            confirmLabel="Remove member"
                            destructive
                            pending={remove.isPending}
                            pendingLabel="Removing…"
                            onConfirm={() => remove.mutate(row.id)}
                        />
                    </div>
                );
            },
        },
    ];

    const isFiltered = role !== ANY || status !== ANY || debouncedSearch.trim() !== "";

    return (
        <>
            <PageHeader
                title="Members"
                description="Everyone with access to your organization."
                action={<Button onClick={() => setInviting(true)}>Invite member</Button>}
            />

            {inviting && <InviteDialog onClose={() => setInviting(false)} />}

            <DataTable
                columns={columns}
                rows={data?.data}
                rowKey={(row) => row.id}
                search={{
                    value: search,
                    onChange: withReset(setSearch),
                    placeholder: "Search name or email…",
                }}
                filters={[
                    {
                        value: role,
                        onChange: withReset(setRole),
                        options: [
                            { value: ANY, label: "All roles" },
                            { value: "ORG_ADMIN", label: "Organization admin" },
                            { value: "ORG_MEMBER", label: "Member" },
                        ],
                        label: "Role",
                    },
                    {
                        value: status,
                        onChange: withReset(setStatus),
                        options: [
                            { value: ANY, label: "All statuses" },
                            { value: "ACTIVE", label: "Active" },
                            { value: "INVITED", label: "Invited" },
                            { value: "REMOVED", label: "Removed" },
                        ],
                        label: "Status",
                    },
                ]}
                isLoading={isLoading}
                error={error}
                onRetry={() => refetch()}
                empty={{
                    title: isFiltered
                        ? "No members match those filters"
                        : "No members yet",
                    body: isFiltered
                        ? "Try a different role or status, or clear the search."
                        : "Invite someone to get started.",
                }}
                meta={data?.meta}
                onPageChange={setPage}
            />
        </>
    );
}
