import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api-client";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
    return (
        <div
            className="flex flex-col items-center justify-center gap-3 px-4 py-14 text-center"
            role="status"
            aria-live="polite"
        >
            <Skeleton className="h-2 w-40" />
            <Skeleton className="h-2 w-28" />
            <span className="sr-only">{label}</span>
        </div>
    );
}

/**
 * A 403 is not a failure to render — the user simply cannot see this. Saying
 * "something went wrong" there sends people to support for a working system.
 */
export function ErrorState({
    error,
    onRetry,
}: {
    error: unknown;
    onRetry?: () => void;
}) {
    const status = error instanceof ApiError ? error.status : 0;
    const forbidden = status === 403;
    const message =
        error instanceof ApiError
            ? error.message
            : "The request failed. Check your connection and try again.";

    return (
        <div className="px-4 py-14 text-center">
            <p className="mb-1 text-sm font-medium">
                {forbidden
                    ? "You don't have access to this"
                    : "Couldn't load this data"}
            </p>
            <p className="mb-4 text-[13px] text-muted-foreground">{message}</p>
            {onRetry && !forbidden && (
                <Button variant="outline" size="sm" onClick={onRetry}>
                    Retry
                </Button>
            )}
        </div>
    );
}

export function EmptyState({
    title,
    body,
    action,
}: {
    title: string;
    body?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="px-4 py-14 text-center">
            <p className="mb-1 text-sm font-medium">{title}</p>
            {body && (
                <p className="mb-4 text-[13px] text-muted-foreground">{body}</p>
            )}
            {action}
        </div>
    );
}
