"use client";

import { useMutation } from "@tanstack/react-query";
import { DownloadIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getBlob } from "@/lib/api-client";

/**
 * Downloads a payment's invoice as a PDF.
 *
 * The file is fetched as a blob rather than linked to directly: the access
 * token lives in memory and travels as an Authorization header, so a plain
 * `<a href>` would arrive unauthenticated and 401. Fetching it through the
 * shared axios instance also means the download inherits the same
 * refresh-and-retry behaviour as every other request.
 */
export function InvoiceDownloadButton({
    paymentId,
    invoiceNumber,
    variant = "outline",
    size = "sm",
}: {
    paymentId: string;
    invoiceNumber: string;
    variant?: "default" | "outline" | "ghost";
    size?: "default" | "sm";
}) {
    const download = useMutation({
        mutationFn: async () => {
            const blob = await getBlob(`/payments/${paymentId}/invoice`);

            // Object URLs are revoked immediately after the click. Left alone
            // they pin the whole blob in memory until the document unloads,
            // and a billing page can produce a lot of them in one session.
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `${invoiceNumber}.pdf`;
            document.body.append(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(url);
        },
        onError: () => {
            // The response body is a blob, not the usual JSON envelope, so
            // there is no server message to quote here.
            toast.error("The invoice could not be generated");
        },
    });

    return (
        <Button
            variant={variant}
            size={size}
            disabled={download.isPending}
            onClick={(event) => {
                // The billing table rows navigate on click; without this the
                // download would also send the user to the detail page.
                event.stopPropagation();
                download.mutate();
            }}
        >
            <DownloadIcon />
            {download.isPending ? "Preparing…" : "Invoice"}
        </Button>
    );
}
