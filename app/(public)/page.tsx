"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { CountUp } from "@/components/count-up";
import { Reveal } from "@/components/reveal";
import { SpinningCube } from "@/components/spinning-cube";
import { SubscribeForm } from "@/components/subscribe-form";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

// Numbers, not display strings — a counter cannot animate "$2.4M+". The
// separators, currency mark and units live in `prefix`/`suffix` so the value
// stays something that can be tweened.
const STATS = [
    { value: 120, suffix: "+", label: "Organizations onboarded" },
    { value: 15000, suffix: "+", label: "Members managed" },
    { value: 2.4, decimals: 1, prefix: "$", suffix: "M+", label: "Processed securely" },
    { value: 99.9, decimals: 1, suffix: "%", label: "Uptime" },
];

// shadcn's Card root carries only vertical padding — horizontal padding is
// normally CardContent's job. These cards hold free-form marketing markup
// rather than the header/content/footer trio, so the padding is set here and
// the width bounds live in one constant to keep every row aligned.
const FAQS = [
    {
        q: "How does billing work?",
        a: "Every organization holds one subscription against a plan, billed monthly through Stripe. Checkout runs on Stripe's own hosted page, so card details never reach OrbitSuite — we only ever see the confirmation Stripe sends us.",
    },
    {
        q: "When does my organization become active?",
        a: "Only once Stripe confirms the payment by webhook. A redirect back from checkout is not treated as proof of payment, so an abandoned or failed payment leaves the organization pending rather than quietly letting it in.",
    },
    {
        q: "Can I change plans later?",
        a: "Yes — upgrade or downgrade at any time from the subscription page, and the change applies to the current subscription immediately. Cancelling keeps access until the end of the period you have already paid for.",
    },
    {
        q: "How is one organization's data kept separate from another's?",
        a: "Tenant scoping is enforced on the server at the data layer, not by hiding things in the interface. A request for another organization's record fails regardless of what the client asks for.",
    },
    {
        q: "Who can see billing and invoices?",
        a: "Organization admins. Members get their own profile and their organization's details, but payments, invoices and member management stay with the admins who own the billing relationship.",
    },
    {
        q: "What happens to a failed payment?",
        a: "It is recorded as failed and kept in your billing history rather than discarded, and the subscription stays put so you can retry checkout. Refunds and rollbacks are tracked as their own statuses, so a reversal never reads as a failure.",
    },
];

const CARD = "min-w-64 max-w-84 flex-1 px-6";
const SECTION_HEADING =
    "mx-auto mb-6 table rounded-lg bg-scrim-strong px-5 py-2 text-center";

export default function LandingPage() {
    const { data, isLoading } = useQuery({
        queryKey: queryKeys.plans({ limit: 3 }),
        queryFn: () => getList<Plan[]>("/plans", { limit: 3 }),
    });

    const plans = data?.data ?? [];

    return (
        <div className="w-full max-w-6xl">
            {/* No panel behind the hero. The animated background is the surface
                here — putting a scrim on top of it hides the thing it exists to
                show, and reads as a card floating on another card. */}
            <section className="mb-12 px-8 py-12 text-center">
                <SpinningCube />
                {/* Uppercased in CSS rather than in the string: screen readers
                    treat a run of capitals as an initialism and spell it out,
                    so the accessible name stays "Build smarter. Grow faster."
                    Caps also need the tracking opened back up — `tighter` is
                    tuned for lowercase and collides at this weight. */}
                <h1 className="m-0 mb-3 text-[44px] leading-[1.1] font-extrabold tracking-tight text-balance uppercase">
                    Build smarter. Grow <span className="text-brand-500">faster</span>.
                </h1>
                <p className="mx-auto mb-6 max-w-140 text-[17px] leading-relaxed text-ink-muted">
                    One control plane for organizations, billing, and access — built to
                    keep your team{" "}
                    <span className="font-semibold text-brand-500">moving</span>, not
                    managing spreadsheets.
                </p>
                {/* shadcn Buttons rather than hand-styled anchors, so the fill,
                    hover and focus ring come from the same place as every other
                    button in the product. */}
                <div className="flex justify-center gap-3">
                    <Button asChild size="lg" className="h-11 px-6 text-[15px]">
                        <Link href="/register">Get started</Link>
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="h-11 px-6 text-[15px]"
                    >
                        <Link href="/login">Log in</Link>
                    </Button>
                </div>
            </section>

            <Reveal
                stagger={0.09}
                className="mb-14 flex flex-wrap justify-center gap-4"
            >
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
            </Reveal>

            {/* `scroll-mt` clears the sticky nav pill, which would otherwise
                cover the heading this anchor jumps to. */}
            <section id="features" className="mb-14 scroll-mt-28">
                <h2 className={SECTION_HEADING}>
                    <span className="text-xl font-semibold">
                        What OrbitSuite handles for you
                    </span>
                </h2>
                <Reveal stagger={0.09} className="flex flex-wrap justify-center gap-4">
                    {CAPABILITIES.map((item) => (
                        <Card key={item.title} className={CARD}>
                            <p className="mb-2 text-[15px] font-bold">{item.title}</p>
                            <p className="text-[13px] leading-relaxed text-ink-muted">
                                {item.body}
                            </p>
                        </Card>
                    ))}
                </Reveal>
            </section>

            <section
                id="pricing"
                className="flex scroll-mt-28 flex-wrap justify-center gap-4"
            >
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
                <Reveal stagger={0.09} className="flex flex-wrap justify-center gap-4">
                    {TESTIMONIALS.map((item) => (
                        <Card key={item.name} className={CARD}>
                            <p className="mb-4 text-[13px] leading-relaxed text-ink-soft">
                                &ldquo;{item.quote}&rdquo;
                            </p>
                            <p className="text-[13px] font-semibold">{item.name}</p>
                            <p className="text-xs text-ink-muted">{item.role}</p>
                        </Card>
                    ))}
                </Reveal>
            </section>

            <Reveal
                stagger={0.08}
                className="mt-14 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4 rounded-2xl bg-scrim-strong px-6 py-8 text-center"
            >
                {STATS.map((stat) => (
                    <div key={stat.label}>
                        <CountUp
                            value={stat.value}
                            decimals={stat.decimals}
                            prefix={stat.prefix}
                            suffix={stat.suffix}
                            // `tabular-nums` so the digits keep a fixed width
                            // while counting — proportional figures make the
                            // whole row jitter sideways on every frame.
                            className="block text-[32px] font-extrabold text-brand-500 tabular-nums"
                        />
                        <p className="mt-1 text-[13px] text-ink-muted">{stat.label}</p>
                    </div>
                ))}
            </Reveal>

            <section className="mt-14 rounded-lg border border-line bg-surface px-6 py-10 text-center">
                <h2 className="m-0 mb-2 text-[28px] font-extrabold tracking-tight">
                    Ready to <span className="text-brand-500">accelerate</span> your
                    growth?
                </h2>
                <p className="mb-6 text-sm text-ink-muted">
                    Set up your organization in minutes.
                </p>
                <SubscribeForm />
            </section>

            <section id="faq" className="mt-14 scroll-mt-28">
                <h2 className={SECTION_HEADING}>
                    <span className="text-xl font-semibold">
                        Frequently asked <span className="text-brand-500">questions</span>
                    </span>
                </h2>

                {/*
                  * `type="single" collapsible` — one answer open at a time, and
                  * that one can be closed again. A FAQ where everything can be
                  * open at once is just a wall of text with extra clicks.
                  *
                  * Narrower than the cards above it: these are long lines of
                  * prose, and the full 1152px would push them past a comfortable
                  * reading measure.
                  */}
                <Reveal className="mx-auto max-w-3xl">
                    <Accordion
                        type="single"
                        collapsible
                        className="rounded-xl bg-card px-6 ring-1 ring-foreground/10"
                    >
                        {FAQS.map((faq) => (
                            <AccordionItem key={faq.q} value={faq.q}>
                                <AccordionTrigger className="text-left text-[15px] font-semibold">
                                    {faq.q}
                                </AccordionTrigger>
                                <AccordionContent className="text-[13px] leading-relaxed text-ink-muted">
                                    {faq.a}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </Reveal>
            </section>
        </div>
    );
}
