"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormAlert, FormField, PageHeader } from "@/components/patterns";
import { ErrorState, LoadingState } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiError, get, patch, post } from "@/lib/api-client";
import { formatDate, ROLE_LABELS } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import {
    type ChangePasswordValues,
    changePasswordSchema,
    type ProfileValues,
    profileSchema,
} from "@/lib/schemas";
import type { Member } from "@/lib/types";

function ProfileForm({ profile }: { profile: Member }) {
    const queryClient = useQueryClient();
    const [formError, setFormError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isDirty },
    } = useForm<ProfileValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: { name: profile.name, email: profile.email },
    });

    const save = useMutation({
        mutationFn: (values: ProfileValues) => patch<Member>("/users/me", values),
        onSuccess: async () => {
            toast.success("Profile updated");
            // The session carries the name and email shown in the sidebar, so
            // both caches have to be refreshed, not just this page's.
            await queryClient.invalidateQueries({ queryKey: queryKeys.me });
            await queryClient.invalidateQueries({ queryKey: queryKeys.session });
        },
        onError: (error) => {
            if (error instanceof ApiError && error.fieldErrors.length > 0) {
                for (const [field, message] of Object.entries(error.byField())) {
                    setError(field as keyof ProfileValues, { message });
                }
                return;
            }
            setFormError(
                error instanceof ApiError
                    ? error.message
                    : "Your profile could not be saved",
            );
        },
    });

    return (
        <Card className="px-6">
            <p className="mb-4 text-sm font-semibold">Profile</p>

            <form
                onSubmit={handleSubmit((values) => {
                    setFormError(null);
                    save.mutate(values);
                })}
            >
                {formError && <FormAlert>{formError}</FormAlert>}

                <FormField
                    label="Name"
                    htmlFor="profile-name"
                    error={errors.name?.message}
                >
                    <Input id="profile-name" {...register("name")} />
                </FormField>

                <FormField
                    label="Email"
                    htmlFor="profile-email"
                    error={errors.email?.message}
                    hint="You will sign in with this address."
                >
                    <Input
                        id="profile-email"
                        type="email"
                        autoComplete="email"
                        {...register("email")}
                    />
                </FormField>

                <Button
                    type="submit"
                    className="mt-2"
                    disabled={save.isPending || !isDirty}
                >
                    {save.isPending ? "Saving…" : "Save changes"}
                </Button>
            </form>
        </Card>
    );
}

function ChangePasswordForm() {
    const [formError, setFormError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<ChangePasswordValues>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: { currentPassword: "", newPassword: "" },
    });

    const change = useMutation({
        mutationFn: (values: ChangePasswordValues) =>
            post<null>("/auth/change-password", values),
        onSuccess: () => {
            toast.success("Password changed");
            // Clearing matters here beyond tidiness: leaving the old password
            // sitting in a form field is the one value that should not linger.
            reset();
        },
        onError: (error) => {
            // A wrong current password is a field problem, not a form problem,
            // and the API reports it as a plain 400 rather than a field error.
            if (error instanceof ApiError && error.status === 400) {
                setError("currentPassword", { message: error.message });
                return;
            }
            setFormError(
                error instanceof ApiError
                    ? error.message
                    : "Your password could not be changed",
            );
        },
    });

    return (
        <Card className="px-6">
            <p className="mb-4 text-sm font-semibold">Change password</p>

            <form
                onSubmit={handleSubmit((values) => {
                    setFormError(null);
                    change.mutate(values);
                })}
            >
                {formError && <FormAlert>{formError}</FormAlert>}

                <FormField
                    label="Current password"
                    htmlFor="current-password"
                    error={errors.currentPassword?.message}
                >
                    <Input
                        id="current-password"
                        type="password"
                        autoComplete="current-password"
                        {...register("currentPassword")}
                    />
                </FormField>

                <FormField
                    label="New password"
                    htmlFor="new-password"
                    error={errors.newPassword?.message}
                    hint="At least 8 characters, with an uppercase letter, a lowercase letter and a number."
                >
                    <Input
                        id="new-password"
                        type="password"
                        autoComplete="new-password"
                        {...register("newPassword")}
                    />
                </FormField>

                <Button type="submit" className="mt-2" disabled={change.isPending}>
                    {change.isPending ? "Changing…" : "Change password"}
                </Button>
            </form>
        </Card>
    );
}

export default function MyProfilePage() {
    const { data, error, isLoading, refetch } = useQuery({
        queryKey: queryKeys.me,
        queryFn: () => get<Member>("/users/me"),
    });

    if (isLoading) return <LoadingState label="Loading your profile…" />;
    if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
    if (!data) return null;

    return (
        <>
            <PageHeader
                title="My profile"
                description="Your account details and password."
            />

            <div className="mb-4 flex flex-wrap items-center gap-3 text-[13px] text-muted-foreground">
                <span>{ROLE_LABELS[data.role] ?? data.role}</span>
                <StatusBadge status={data.status} />
                <span>Joined {formatDate(data.createdAt)}</span>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                {/* Keyed on the profile id so the form remounts with fresh
                    defaults if the identity behind the session ever changes. */}
                <ProfileForm key={data.id} profile={data} />
                <ChangePasswordForm />
            </div>
        </>
    );
}
