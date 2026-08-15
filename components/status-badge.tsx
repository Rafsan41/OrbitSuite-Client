import { humanize } from "@/lib/format";
import { cx } from "./ui";

/**
 * The backend exposes 18 status values across five Prisma enums. They collapse
 * to 12 colour tokens here, and this is the only place any status becomes a
 * colour — no page decides for itself.
 *
 * Three of these choices are deliberate and easy to get wrong:
 *  - CANCELLED / REMOVED are grey, not red. They are intended outcomes; red
 *    would make ordinary churn look like a system fault.
 *  - SUSPENDED (orange) is not FAILED (red). One is an admin action, the other
 *    a payment problem, and they sit side by side on the platform table.
 *  - ROLLED_BACK is rose — adjacent to red but distinct, because it is the
 *    status that shows the transaction rollback worked.
 */
const STATUS_TOKENS = {
    ACTIVE: "success",
    SUCCESS: "success",
    PENDING: "pending",
    FAILED: "failed",
    CANCELLED: "neutral",
    REMOVED: "neutral",
    SUSPENDED: "warning",
    REFUNDED: "refund",
    ROLLED_BACK: "rollback",
    INVITED: "info",
    TRIAL: "info",
    EXPIRED: "expired",
} as const;

type StatusToken = (typeof STATUS_TOKENS)[keyof typeof STATUS_TOKENS];

const TOKEN_CLASSES: Record<StatusToken, string> = {
    success:
        "bg-status-success-bg text-status-success-fg border-status-success-border",
    pending:
        "bg-status-pending-bg text-status-pending-fg border-status-pending-border",
    failed:
        "bg-status-failed-bg text-status-failed-fg border-status-failed-border",
    neutral:
        "bg-status-neutral-bg text-status-neutral-fg border-status-neutral-border",
    warning:
        "bg-status-warning-bg text-status-warning-fg border-status-warning-border",
    refund:
        "bg-status-refund-bg text-status-refund-fg border-status-refund-border",
    rollback:
        "bg-status-rollback-bg text-status-rollback-fg border-status-rollback-border",
    info: "bg-status-info-bg text-status-info-fg border-status-info-border",
    expired:
        "bg-status-expired-bg text-status-expired-fg border-status-expired-border",
};

export type KnownStatus = keyof typeof STATUS_TOKENS;

export function StatusBadge({
    status,
    className,
}: {
    status: string;
    className?: string;
}) {
    // An unmapped status must still render something legible rather than an
    // unstyled string — a new backend enum value should look odd, not vanish.
    const token: StatusToken = STATUS_TOKENS[status as KnownStatus] ?? "neutral";

    return (
        <span
            className={cx(
                "inline-flex items-center rounded-full border px-2.5 py-0.5",
                "text-[11px] font-medium whitespace-nowrap",
                TOKEN_CLASSES[token],
                className,
            )}
        >
            {humanize(status)}
        </span>
    );
}
