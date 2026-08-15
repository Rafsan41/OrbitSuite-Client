"use client";

import { useState } from "react";
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

export interface ConfirmDialogProps {
    /** The control that opens it — rendered as the trigger, so it keeps its own styling. */
    trigger: React.ReactNode;
    title: string;
    /** Say what will actually happen, including anything that cannot be undone. */
    description: React.ReactNode;
    confirmLabel: string;
    cancelLabel?: string;
    /** Red confirm button. Reserve it for genuinely destructive outcomes. */
    destructive?: boolean;
    pending?: boolean;
    pendingLabel?: string;
    onConfirm: () => void;
}

/**
 * One confirmation dialog for every irreversible action in the product.
 *
 * Confirming closes the dialog and fires the callback; the outcome is reported
 * by the caller's toast, because only the caller knows whether the request
 * succeeded. `pending` exists for the window where the dialog is reopened while
 * a previous request is still in flight — it disables both buttons and blocks
 * dismissal rather than letting a second identical request go out.
 */
export function ConfirmDialog({
    trigger,
    title,
    description,
    confirmLabel,
    cancelLabel = "Cancel",
    destructive = false,
    pending = false,
    pendingLabel,
    onConfirm,
}: ConfirmDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (pending) return;
                setOpen(next);
            }}
        >
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" disabled={pending}>
                            {cancelLabel}
                        </Button>
                    </DialogClose>
                    <Button
                        variant={destructive ? "destructive" : "default"}
                        disabled={pending}
                        onClick={() => {
                            onConfirm();
                            setOpen(false);
                        }}
                    >
                        {pending ? (pendingLabel ?? "Working…") : confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
