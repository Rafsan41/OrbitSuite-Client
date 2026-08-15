"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { SpinningCube } from "@/components/spinning-cube";
import { Skeleton } from "@/components/states";
import { Card } from "@/components/ui";
import { getList } from "@/lib/api-client";
import { formatMoney } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import type { Plan } from "@/lib/types";

const VALUE_PROPS = [
    {
        title: <><span className="text-brand-500">Move faster</span>, not slower</>,
        body: "Give every team a single place to manage billing, so nothing falls through the cracks.",
    },
    {
        title: <>Built for <span className="text-brand-500">accountability</span></>,
        body: "Role-based access and a clear audit trail mean every action has an owner.",
    },
    {
        title: <>Teams, <span className="text-brand-500">managed effortlessly</span></>,
        body: "Invite, promote, and remove members in a few clicks — no spreadsheets required.",
    },
];

const CAPABILITIES = [
    {
        title: "Subscription billing",
        body: "Plans, upgrades, downgrades, and cancellations — synced with Stripe end to end.",
    },
    {
        title: "Multi-tenant access",
        body: "Every organization sees only its own data — enforced server-side, not just hidden in the UI.",
    },
    {
        title: "Revenue reporting",
        body: "Payments, transactions, and MRR by plan — always in view for the platform team.",
    },
];

const TESTIMONIALS = [
    {
        quote: "We moved four tenants over in an afternoon. Suspend and reactivate alone saved our support team hours every week.",
        name: "Priya Shah",
        role: "Ops Lead, Acme Corp",
    },
    {
        quote: "The billing history and role controls are exactly what we needed — nothing extra to configure.",
        name: "Theo Brandt",
        role: "IT Manager, Globex Inc",
    },
    {
        quote: "Clear statuses everywhere. My finance team can finally tell a refund from a rollback at a glance.",
        name: "Nora Kimura",
        role: "Finance Director, Globex Inc",
    },
];

const STATS = [
    ["120+", "Organizations onboarded"],
    ["15,000+", "Members managed"],
    ["$2.4M+", "Processed securely"],
    ["99.9%", "Uptime"],
];

const CARD = "flex-1 min-w-55 max-w-70";
const SECTION_HEADING =
    "mx-auto mb-6 table rounded-lg bg-scrim-strong px-5 py-2 text-center";

export default function LandingPage() {
    const { data, isLoading } = useQuery({
        queryKey: queryKeys.plans({ limit: 3 }),
        queryFn: () => getList<Plan[]>("/plans", { limit: 3 }),
    });

    const plans = data?.data ?? [];

    return (
        <div className="w-full max-w-220">
            <section className="mb-12 rounded-2xl bg-scrim-strong px-8 py-12 text-center shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
                <SpinningCube />
                <h1 className="m-0 mb-3 text-[44px] leading-[1.1] font-extrabold tracking-tighter text-balance">
                    Bill smarter. Grow <span className="text-brand-500">faster</span>.
                </h1>
                <p className="mx-auto mb-6 max-w-140 text-[17px] leading-relaxed text-ink-muted">
                    One control plane for organizations, billing, and access — built to
                    keep your team{" "}
                    <span className="font-semibold text-brand-500">moving</span>, not
                    managing spreadsheets.
                </p>
                <div className="flex justify-center gap-3">
                    <Link
                        href="/register"
                        className="rounded-md bg-brand-600 px-5 py-3 text-[15px] font-medium text-white no-underline hover:bg-brand-700 hover:no-underline"
                    >
                        Get started
                    </Link>
                    <Link
                        href="/login"
                        className="rounded-md border border-line bg-surface px-5 py-3 text-[15px] font-medium text-ink no-underline hover:bg-page hover:no-underline"
                    >
                        Log in
                    </Link>
                </div>
            </section>

            <section className="mb-14 flex flex-wrap justify-center gap-4">
                {VALUE_PROPS.map((item, index) => (
                    <Card key={index} className={CARD}>
                        <p className="mb-2 text-[15px] font-bold tracking-tight">
                            {item.title}
                        </p>
                        <p className="text-[13px] leading-relaxed text-ink-muted">
                            {item.body}
                        </p>
                    </Card>
                ))}
            </section>

            <section className="mb-14">
                <h2 className={SECTION_HEADING}>
                    <span className="text-xl font-semibold">
                        What OrbitSuite handles for you
                    </span>
                </h2>
                <div className="flex flex-wrap justify-center gap-4">
                    {CAPABILITIES.map((item) => (
                        <Card key={item.title} className={CARD}>
                            <p className="mb-2 text-[15px] font-bold">{item.title}</p>
                            <p className="text-[13px] leading-relaxed text-ink-muted">
                                {item.body}
                            </p>
                        </Card>
                    ))}
                </div>
            </section>

            <section id="pricing" className="flex flex-wrap justify-center gap-4">
                {isLoading &&
                    Array.from({ length: 3 }, (_, index) => (
                        <Card key={`plan-skeleton-${index}`} className={CARD}>
                            <Skeleton className="mb-2 h-3 w-20" />
                            <Skeleton className="mb-4 h-7 w-28" />
                            <Skeleton className="mb-2 h-2.5 w-full" />
                            <Skeleton className="h-2.5 w-4/5" />
                        </Card>
                    ))}

                {!isLoading &&
                    plans.map((plan) => (
                        <Card key={plan.id} className={CARD}>
                            <p className="mb-1 text-sm font-semibold">{plan.name}</p>
                            <p className="mb-4 text-[28px] font-bold tabular-nums">
                                {formatMoney(plan.priceCents)}
                                <span className="text-[13px] font-normal text-ink-muted">
                                    /{plan.billingInterval === "YEAR" ? "yr" : "mo"}
                                </span>
                            </p>
                            {plan.features.map((feature) => (
                                <p
                                    key={feature}
                                    className="mb-2 flex gap-2 text-[13px] text-ink-soft"
                                >
                                    <span className="text-brand-500" aria-hidden>
                                        ✓
                                    </span>
                                    <span>{feature}</span>
                                </p>
                            ))}
                        </Card>
                    ))}
            </section>

            <section className="mt-14">
                <h2 className={SECTION_HEADING}>
                    <span className="text-[22px] font-bold tracking-tight">
                        Trusted by teams built to{" "}
                        <span className="text-brand-500">win</span>
                    </span>
                </h2>
                <div className="flex flex-wrap justify-center gap-4">
                    {TESTIMONIALS.map((item) => (
                        <Card key={item.name} className={CARD}>
                            <p className="mb-4 text-[13px] leading-relaxed text-ink-soft">
                                &ldquo;{item.quote}&rdquo;
                            </p>
                            <p className="text-[13px] font-semibold">{item.name}</p>
                            <p className="text-xs text-ink-muted">{item.role}</p>
                        </Card>
                    ))}
                </div>
            </section>

            <section className="mt-14 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4 rounded-2xl bg-scrim-strong px-6 py-8 text-center">
                {STATS.map(([value, label]) => (
                    <div key={label}>
                        <p className="text-[32px] font-extrabold text-brand-500">
                            {value}
                        </p>
                        <p className="mt-1 text-[13px] text-ink-muted">{label}</p>
                    </div>
                ))}
            </section>

            <section className="mt-14 rounded-lg border border-line bg-surface px-6 py-10 text-center">
                <h2 className="m-0 mb-2 text-[28px] font-extrabold tracking-tight">
                    Ready to <span className="text-brand-500">accelerate</span> your
                    growth?
                </h2>
                <p className="mb-5 text-sm text-ink-muted">
                    Set up your organization in minutes.
                </p>
                <Link
                    href="/register"
                    className="inline-block rounded-md bg-brand-600 px-5 py-3 text-[15px] font-medium text-white no-underline hover:bg-brand-700 hover:no-underline"
                >
                    Get started
                </Link>
            </section>
        </div>
    );
}
