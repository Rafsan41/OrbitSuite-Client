export type Role = "PLATFORM_ADMIN" | "ORG_ADMIN" | "ORG_MEMBER";

export type OrgStatus =
    | "PENDING"
    | "ACTIVE"
    | "TRIAL"
    | "SUSPENDED"
    | "CANCELLED";

// Mirrors the Prisma SubscriptionStatus enum, which is deliberately not the
// same set as OrgStatus: a subscription can be FAILED but never TRIAL, and an
// organization can be TRIAL but never FAILED.
export type SubscriptionStatus =
    | "ACTIVE"
    | "PENDING"
    | "FAILED"
    | "CANCELLED"
    | "EXPIRED";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

export type TransactionStatus = PaymentStatus | "ROLLED_BACK";

export type UserStatus = "ACTIVE" | "INVITED" | "REMOVED";

/** Every endpoint returns this shape, success or failure. */
export interface ApiEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
    meta?: PageMeta;
    errors?: FieldError[];
}

export interface PageMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface FieldError {
    field: string;
    message: string;
}

export interface Plan {
    id: string;
    name: string;
    priceCents: number;
    billingInterval: "MONTH" | "YEAR";
    features: string[];
    isActive: boolean;
    stripePriceId?: string | null;
}

export interface SessionUser {
    id: string;
    name: string;
    email: string;
    role: Role;
    status: UserStatus;
    organizationId: string | null;
}

export interface SessionOrganization {
    id: string;
    name: string;
    status: OrgStatus;
}

export interface Session {
    user: SessionUser;
    organization: SessionOrganization | null;
    subscription: { status: SubscriptionStatus; plan: Plan | null } | null;
}

export interface Organization {
    id: string;
    name: string;
    /** Nullable in the schema — organizations created before billing details. */
    contactEmail: string | null;
    billingEmail?: string | null;
    status: OrgStatus;
    createdAt: string;
    memberCount?: number;
    plan?: Plan | null;
    subscriptionStatus?: SubscriptionStatus | null;
}

/**
 * `GET /organizations` flattens the row for the table: `plan` is the plan *name*
 * here, not the object, because the endpoint selects only what the list renders.
 * Distinct from `Organization` so a page cannot reach for `plan.priceCents` on a
 * value that is a string.
 */
export interface OrganizationListRow {
    id: string;
    name: string;
    contactEmail: string | null;
    status: OrgStatus;
    createdAt: string;
    memberCount: number;
    plan: string | null;
    subscriptionStatus: SubscriptionStatus | null;
}

/** `GET /organizations/:id` — the Platform Admin detail view, fully expanded. */
export interface OrganizationDetail {
    id: string;
    name: string;
    contactEmail: string | null;
    billingEmail: string | null;
    status: OrgStatus;
    createdAt: string;
    users: Member[];
    /** The raw subscription row with its plan joined — no derived fields. */
    subscription: {
        id: string;
        status: SubscriptionStatus;
        currentPeriodEnd: string | null;
        stripeSubscriptionId: string | null;
        createdAt: string;
        updatedAt: string;
        plan: Plan;
    } | null;
    payments: (Payment & {
        subscription: { id: string; status: SubscriptionStatus } | null;
    })[];
    /** Capped at the 50 most recent by the endpoint. */
    transactions: OrganizationTransaction[];
}

/**
 * A ledger row from `/transactions` or `/transactions/all`. The joined payment
 * carries the currency — the transaction table itself has no currency column,
 * so an amount is only ever meaningful alongside its payment.
 */
export interface LedgerTransaction extends OrganizationTransaction {
    /** Present only on `/transactions/all`, which is the cross-tenant view. */
    organization?: { id: string; name: string };
    payment: { id: string; status: PaymentStatus; currency: string } | null;
}

/**
 * Transactions as the organization detail endpoint returns them — raw rows, so
 * `metadata` rather than the derived `description` the transactions module adds.
 */
export interface OrganizationTransaction {
    id: string;
    type: string;
    status: TransactionStatus;
    amountCents: number;
    paymentId: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
}

export interface Member {
    id: string;
    name: string;
    email: string;
    role: Role;
    status: UserStatus;
    createdAt: string;
}

export interface Subscription {
    id: string;
    status: SubscriptionStatus;
    plan: Plan | null;
    currentPeriodEnd: string | null;
    daysUntilRenewal: number | null;
    isExpired: boolean;
    cancelledAt?: string | null;
}

export interface Payment {
    id: string;
    invoiceNumber?: string;
    amountCents: number;
    currency: string;
    status: PaymentStatus;
    createdAt: string;
    plan?: Plan | null;
    organization?: Pick<Organization, "id" | "name"> | null;
    periodStart?: string | null;
    periodEnd?: string | null;
}

export interface Transaction {
    id: string;
    type: string;
    status: TransactionStatus;
    amountCents: number;
    currency: string;
    description?: string | null;
    createdAt: string;
    organization?: Pick<Organization, "id" | "name"> | null;
}

/** `GET /organizations/me` — the Org Admin's own organization. */
export interface MyOrganization {
    id: string;
    name: string;
    contactEmail: string | null;
    billingEmail: string | null;
    status: OrgStatus;
    createdAt: string;
    subscription: { status: SubscriptionStatus; plan: Plan } | null;
    _count: { users: number };
}

/** `GET /subscriptions/me` — the raw row plus two fields derived server-side. */
export interface CurrentSubscription {
    id: string;
    status: SubscriptionStatus;
    currentPeriodEnd: string | null;
    stripeSubscriptionId: string | null;
    createdAt: string;
    plan: Plan;
    organization: { name: string; status: OrgStatus };
    /** Negative once the period has already ended. */
    daysUntilRenewal: number | null;
    isExpired: boolean;
}

/** `GET /payments` — billing history for the caller's own organization. */
export interface PaymentListRow {
    id: string;
    amountCents: number;
    currency: string;
    status: PaymentStatus;
    createdAt: string;
    subscription: {
        id: string;
        status: SubscriptionStatus;
        plan: { name: string; billingInterval: "MONTH" | "YEAR" };
    } | null;
    transactions: { id: string; type: string; status: TransactionStatus }[];
}

/**
 * `GET /payments/:id` — the data an invoice would be rendered from. The PDF
 * itself is a listed bonus in the brief and is deliberately not implemented.
 */
export interface InvoiceDetail {
    id: string;
    invoiceNumber: string;
    amountCents: number;
    currency: string;
    status: PaymentStatus;
    createdAt: string;
    stripePaymentIntentId: string | null;
    organization: {
        name: string;
        billingEmail: string | null;
        contactEmail: string | null;
    };
    subscription: {
        currentPeriodEnd: string | null;
        plan: { name: string; priceCents: number; billingInterval: "MONTH" | "YEAR" };
    } | null;
    transactions: OrganizationTransaction[];
}

/** The plan fields checkout returns — a `select`, not a whole `Plan`. */
export interface CheckoutPlan {
    name: string;
    priceCents: number;
}

export interface CheckoutStatus {
    subscriptionStatus: SubscriptionStatus;
    organizationStatus: OrgStatus;
    plan: CheckoutPlan | null;
    canRetry: boolean;
}

export interface CheckoutSession {
    /** Stripe can return null; the caller must treat that as a failure. */
    checkoutUrl: string | null;
    sessionId: string;
    plan: CheckoutPlan & { billingInterval: "MONTH" | "YEAR" };
}

/** `POST /auth/register` — the refresh token is a cookie, so it isn't here. */
export interface RegisterResult {
    user: SessionUser;
    organization: SessionOrganization;
    subscription: { id: string; status: SubscriptionStatus };
    plan: { id: string; name: string; priceCents: number };
    accessToken: string;
}

export interface PlatformStats {
    organizations: {
        total: number;
        byStatus: Partial<Record<OrgStatus, number>>;
        recentSignups: {
            id: string;
            name: string;
            status: OrgStatus;
            createdAt: string;
        }[];
    };
    users: { total: number };
    subscriptions: {
        active: number;
        byPlan: {
            planName: string;
            subscribers: number;
            monthlyRecurringCents: number;
        }[];
    };
    revenue: {
        totalCents: number;
        successfulPayments: number;
        failedPayments: number;
    };
}
