/**
 * Every cache key in one place. Invalidation is only reliable if the key that
 * writes and the key that reads are literally the same array — building them
 * ad hoc at call sites is how stale tables happen.
 */
export const queryKeys = {
    session: ["session"] as const,

    plans: (params?: Record<string, unknown>) =>
        params ? (["plans", params] as const) : (["plans"] as const),
    plan: (id: string) => ["plans", id] as const,

    organizations: (params?: Record<string, unknown>) =>
        params
            ? (["organizations", params] as const)
            : (["organizations"] as const),
    organization: (id: string) => ["organizations", id] as const,
    myOrganization: ["organizations", "me"] as const,
    myOrganizationSummary: ["organizations", "me", "summary"] as const,

    members: (params?: Record<string, unknown>) =>
        params ? (["users", params] as const) : (["users"] as const),
    me: ["users", "me"] as const,

    subscription: ["subscriptions", "me"] as const,

    payments: (params?: Record<string, unknown>) =>
        params ? (["payments", params] as const) : (["payments"] as const),
    payment: (id: string) => ["payments", id] as const,

    transactions: (params?: Record<string, unknown>) =>
        params
            ? (["transactions", params] as const)
            : (["transactions"] as const),
    allTransactions: (params?: Record<string, unknown>) =>
        params
            ? (["transactions", "all", params] as const)
            : (["transactions", "all"] as const),

    checkoutStatus: ["checkout", "status"] as const,
    stats: ["stats"] as const,
} as const;
