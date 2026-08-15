"use client";

import { EmptyState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { PageMeta } from "@/lib/types";
import { cn } from "@/lib/utils";

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

/**
 * One table for every list in the product. Eight pages need a table with search,
 * filters, pagination and four states; eight bespoke implementations is where
 * this build would have run out of hours.
 *
 * shadcn's Table supplies the markup and spacing; the state handling, toolbar
 * and pagination are ours, because shadcn deliberately ships no data table.
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
                            className="w-56"
                            aria-label={search.placeholder ?? "Search"}
                        />
                    )}
                    {filters?.map((filter, index) => (
                        <Select
                            key={filter.label ?? index}
                            value={filter.value}
                            onValueChange={filter.onChange}
                        >
                            <SelectTrigger
                                className="w-auto min-w-36"
                                aria-label={filter.label ?? "Filter"}
                            >
                                <SelectValue placeholder={filter.label ?? "Filter"} />
                            </SelectTrigger>
                            <SelectContent>
                                {filter.options.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ))}
                </div>
            )}

            <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
                <Table className="min-w-160">
                    <TableHeader className="bg-muted">
                        <TableRow>
                            {columns.map((column) => (
                                <TableHead
                                    key={column.id}
                                    className={cn(
                                        "text-[11px] font-semibold tracking-wide uppercase",
                                        column.align === "right" && "text-right",
                                    )}
                                >
                                    {column.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading &&
                            Array.from({ length: 5 }, (_, index) => (
                                <TableRow key={`skeleton-${index}`}>
                                    <TableCell colSpan={columnCount}>
                                        <Skeleton className="h-3 w-full" />
                                    </TableCell>
                                </TableRow>
                            ))}

                        {/* `!!error`, not `error` — a bare `unknown` inside a JSX
                            expression widens the whole node to `unknown`. */}
                        {!isLoading && !!error && (
                            <TableRow>
                                <TableCell colSpan={columnCount}>
                                    <ErrorState error={error} onRetry={onRetry} />
                                </TableCell>
                            </TableRow>
                        )}

                        {!isLoading && !error && !hasRows && (
                            <TableRow>
                                <TableCell colSpan={columnCount}>
                                    <EmptyState
                                        title={empty?.title ?? "Nothing here yet"}
                                        body={empty?.body}
                                        action={empty?.action}
                                    />
                                </TableCell>
                            </TableRow>
                        )}

                        {!isLoading &&
                            !error &&
                            hasRows &&
                            rows.map((row) => (
                                <TableRow
                                    key={rowKey(row)}
                                    onClick={
                                        onRowClick ? () => onRowClick(row) : undefined
                                    }
                                    className={cn(onRowClick && "cursor-pointer")}
                                >
                                    {columns.map((column) => (
                                        <TableCell
                                            key={column.id}
                                            className={cn(
                                                "text-sm",
                                                column.align === "right" && "text-right",
                                                column.className,
                                            )}
                                        >
                                            {column.cell(row)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </div>

            {meta && meta.total > 0 && !isLoading && !error && (
                <div className="flex items-center justify-between pt-4">
                    <span className="text-xs text-muted-foreground">
                        Showing {from}–{to} of {meta.total}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={meta.page <= 1}
                            onClick={() => onPageChange?.(meta.page - 1)}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
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
