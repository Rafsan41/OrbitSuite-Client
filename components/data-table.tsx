"use client";

import type { PageMeta } from "@/lib/types";
import { EmptyState, ErrorState, Skeleton } from "./states";
import { Button, Input, Select, cx } from "./ui";

export interface Column<T> {
    /** Stable identity for the React key — not necessarily a field name. */
    id: string;
    header: string;
    cell: (row: T) => React.ReactNode;
    align?: "left" | "right";
    className?: string;
}

export interface FilterConfig {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    label?: string;
}

export interface DataTableProps<T> {
    title?: string;
    action?: React.ReactNode;
    columns: Column<T>[];
    rows: T[] | undefined;
    rowKey: (row: T) => string;
    onRowClick?: (row: T) => void;

    search?: {
        value: string;
        onChange: (value: string) => void;
        placeholder?: string;
    };
    filters?: FilterConfig[];

    isLoading?: boolean;
    error?: unknown;
    onRetry?: () => void;

    empty?: { title: string; body?: string; action?: React.ReactNode };

    meta?: PageMeta | null;
    onPageChange?: (page: number) => void;
}

const HEADER_CELL =
    "px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-muted";

/**
 * One table for every list in the product. Eight pages need a table with search,
 * filters, pagination and four states; eight bespoke implementations is where
 * this build would have run out of hours.
 */
export function DataTable<T>({
    title,
    action,
    columns,
    rows,
    rowKey,
    onRowClick,
    search,
    filters,
    isLoading,
    error,
    onRetry,
    empty,
    meta,
    onPageChange,
}: DataTableProps<T>) {
    const columnCount = columns.length;
    const hasRows = !!rows && rows.length > 0;
    const showToolbar = !!search || (filters && filters.length > 0);

    const from = meta ? (meta.page - 1) * meta.limit + 1 : 0;
    const to = meta ? Math.min(meta.page * meta.limit, meta.total) : 0;

    return (
        <div className="w-full">
            {(title || action) && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    {title && (
                        <h2 className="m-0 text-lg font-semibold tracking-tight">
                            {title}
                        </h2>
                    )}
                    {action}
                </div>
            )}

            {showToolbar && (
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    {search && (
                        <Input
                            type="search"
                            value={search.value}
                            onChange={(e) => search.onChange(e.target.value)}
                            placeholder={search.placeholder ?? "Search…"}
                            className="w-55"
                            aria-label={search.placeholder ?? "Search"}
                        />
                    )}
                    {filters?.map((filter, index) => (
                        <Select
                            key={filter.label ?? index}
                            value={filter.value}
                            onChange={(e) => filter.onChange(e.target.value)}
                            className="w-auto"
                            aria-label={filter.label ?? "Filter"}
                        >
                            {filter.options.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Select>
                    ))}
                </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-line bg-surface">
                <table className="w-full min-w-160 border-collapse">
                    <thead className="bg-page">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.id}
                                    scope="col"
                                    className={cx(
                                        HEADER_CELL,
                                        column.align === "right"
                                            ? "text-right"
                                            : "text-left",
                                    )}
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading &&
                            Array.from({ length: 5 }, (_, index) => (
                                <tr
                                    key={`skeleton-${index}`}
                                    className="border-t border-line-soft"
                                >
                                    <td colSpan={columnCount} className="px-4 py-3.5">
                                        <Skeleton className="h-3 w-full" />
                                    </td>
                                </tr>
                            ))}

                        {!isLoading && !!error && (
                            <tr>
                                <td colSpan={columnCount}>
                                    <ErrorState error={error} onRetry={onRetry} />
                                </td>
                            </tr>
                        )}

                        {!isLoading && !error && !hasRows && (
                            <tr>
                                <td colSpan={columnCount}>
                                    <EmptyState
                                        title={empty?.title ?? "Nothing here yet"}
                                        body={empty?.body}
                                        action={empty?.action}
                                    />
                                </td>
                            </tr>
                        )}

                        {!isLoading &&
                            !error &&
                            hasRows &&
                            rows.map((row) => (
                                <tr
                                    key={rowKey(row)}
                                    onClick={
                                        onRowClick ? () => onRowClick(row) : undefined
                                    }
                                    className={cx(
                                        "border-t border-line-soft",
                                        onRowClick && "cursor-pointer hover:bg-page",
                                    )}
                                >
                                    {columns.map((column) => (
                                        <td
                                            key={column.id}
                                            className={cx(
                                                "px-4 py-3.5 text-sm",
                                                column.align === "right"
                                                    ? "text-right"
                                                    : "text-left",
                                                column.className,
                                            )}
                                        >
                                            {column.cell(row)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            {meta && meta.total > 0 && !isLoading && !error && (
                <div className="flex items-center justify-between pt-4">
                    <span className="text-xs text-ink-muted">
                        Showing {from}–{to} of {meta.total}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={meta.page <= 1}
                            onClick={() => onPageChange?.(meta.page - 1)}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={meta.page >= meta.totalPages}
                            onClick={() => onPageChange?.(meta.page + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
