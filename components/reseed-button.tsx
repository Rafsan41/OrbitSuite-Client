"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ApiError, post } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";

/**
 * Reseeds the demo database, so every panel can be visited against known data.
 *
 * Destructive and irreversible, hence the confirm step — this drops every
 * organization, user, payment and transaction and rebuilds them. It exists only
 * in development: the backend route is not registered outside it, and the
 * NODE_ENV check below is inlined at build time so the button is stripped from
 * a production bundle rather than merely hidden.
 */
export function ReseedButton() {
    const { logout } = useAuth();
    const [open, setOpen] = useState(false);

    const reseed = useMutation({
        mutationFn: () => post<{ sessionsInvalidated: boolean }>("/dev/seed"),
        onSuccess: async () => {
            setOpen(false);
            toast.success("Database reseeded — signing you back out");
            // The user row this session points at has been deleted and recreated
            // with a new id, so the token in memory now refers to nothing.
            // Staying signed in would mean every request 401ing with no
            // explanation; a clean trip through the login page is honest.
            await logout();
        },
        onError: (error) => {
            toast.error(
                error instanceof ApiError ? error.message : "Reseed failed",
            );
        },
    });

    if (process.env.NODE_ENV !== "development") return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    Reseed demo data
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reseed the database?</DialogTitle>
                    <DialogDescription>
                        This deletes every organization, user, subscription,
                        payment and transaction, then recreates the demo set —
                        Acme Corp, Globex Inc and the five test accounts. It
                        cannot be undone, and it will sign you out.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                        variant="destructive"
                        onClick={() => reseed.mutate()}
                        disabled={reseed.isPending}
                    >
                        {reseed.isPending ? "Reseeding…" : "Delete and reseed"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
