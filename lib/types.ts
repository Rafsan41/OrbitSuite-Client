export type Role = "PLATFORM_ADMIN" | "ORG_ADMIN" | "ORG_MEMBER";

export type OrgStatus =
    | "PENDING"
    | "ACTIVE"
    | "TRIAL"
    | "SUSPENDED"
    | "CANCELLED";

export type SubscriptionStatus =
    | "ACTIVE"
    | "PENDING"
    | "TRIAL"
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
    contactEmail: string;
    billingEmail?: string | null;
    status: OrgStatus;
    createdAt: string;
    memberCount?: number;
    plan?: Plan | null;
    subscriptionStatus?: SubscriptionStatus | null;
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

export interface CheckoutStatus {
    subscriptionStatus: SubscriptionStatus | null;
    organizationStatus: OrgStatus;
    plan: Plan | null;
    canRetry: boolean;
}

export interface PlatformStats {
    organizations: {
        total: number;
        byStatus: Partial<Record<OrgStatus, number>>;
        recentSignups: { id: string; name: string; createdAt: string }[];
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
