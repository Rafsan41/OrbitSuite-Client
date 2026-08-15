/**
 * The API returns every monetary amount as an integer number of cents.
 * Nothing in the UI may render a raw amount — always route it through here.
 */
export const formatMoney = (cents: number, currency = "USD"): string =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
    }).format(cents / 100);

/** Compact form for stat cards, where "$2.4M" beats "$2,400,000.00". */
export const formatMoneyCompact = (cents: number, currency = "USD"): string =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(cents / 100);

export const formatNumber = (value: number): string =>
    new Intl.NumberFormat("en-US").format(value);

export const formatDate = (iso: string | null | undefined): string => {
    if (!iso) return "—";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(date);
};

export const formatDateTime = (iso: string | null | undefined): string => {
    if (!iso) return "—";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
};

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 1000 * 60 * 60 * 24 * 365],
    ["month", 1000 * 60 * 60 * 24 * 30],
    ["day", 1000 * 60 * 60 * 24],
    ["hour", 1000 * 60 * 60],
    ["minute", 1000 * 60],
];

/** "3 days ago" for the recent-signups list. */
export const formatRelative = (iso: string | null | undefined): string => {
    if (!iso) return "—";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "—";

    const diff = date.getTime() - Date.now();
    const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

    for (const [unit, ms] of RELATIVE_UNITS) {
        if (Math.abs(diff) >= ms) {
            return formatter.format(Math.round(diff / ms), unit);
        }
    }
    return "just now";
};

/** `ORG_ADMIN` → `Org admin`. Used for role labels and status text. */
export const humanize = (value: string): string => {
    const lower = value.toLowerCase().replace(/_/g, " ");
    return lower.charAt(0).toUpperCase() + lower.slice(1);
};

export const ROLE_LABELS: Record<string, string> = {
    PLATFORM_ADMIN: "Platform admin",
    ORG_ADMIN: "Organization admin",
    ORG_MEMBER: "Member",
};
