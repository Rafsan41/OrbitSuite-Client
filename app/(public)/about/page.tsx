import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "About",
    description:
        "OrbitSuite is subscription infrastructure for multi-tenant SaaS — organizations, billing and access in one control plane.",
};

const PILLARS = [
    {
        title: "Our mission",
        body: "Give every SaaS team billing and tenancy infrastructure that just works, so they can spend their time on what actually makes their product different.",
    },
    {
        title: "How we work",
        body: "Restraint over flash. Clear status, clean data, and access control enforced on the server — never just hidden in the interface.",
    },
    {
        title: "Tenancy, enforced",
        body: "Every organization sees only its own records, and the boundary is applied at the data layer. A forgotten filter in a query cannot leak another tenant's data.",
    },
    {
        title: "Billing you can audit",
        body: "Payments, refunds and rollbacks each keep their own status, so a reversal never reads as a failure and finance can tell the two apart at a glance.",
    },
    {
        title: "Where we're headed",
        body: "Every release scoped tightly and shipped reliably — the same discipline we help our customers run their own billing with.",
    },
];

// A server component: nothing here is interactive, so none of it needs to ship
// as JavaScript. `Reveal` is the one client island.
export default function AboutPage() {
    return (
        <div className="w-full max-w-4xl">
            <section className="mb-10 rounded-2xl bg-scrim-strong px-8 py-10 text-center shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
                <h1 className="m-0 mb-3 text-[36px] leading-tight font-extrabold tracking-tight text-balance">
                    Built for teams that{" "}
                    <span className="text-brand-500">bill teams</span>
                </h1>
                <p className="mx-auto max-w-130 text-base leading-relaxed text-ink-muted">
                    OrbitSuite is subscription infrastructure for multi-tenant SaaS —
                    the control plane behind organizations, billing and access, so
                    founders can spend their time on product, not plumbing.
                </p>
            </section>

            {/* The fifth card is left to sit alone on the last row rather than
                stretched to fill it — a widened odd card reads as more important
                than the other four, which is not the intent. */}
            <Reveal
                stagger={0.08}
                className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
                {PILLARS.map((pillar) => (
                    <Card key={pillar.title} className="px-6">
                        <p className="mb-2 text-[15px] font-bold">{pillar.title}</p>
                        <p className="text-[13px] leading-relaxed text-ink-muted">
                            {pillar.body}
                        </p>
                    </Card>
                ))}
            </Reveal>

            <div className="text-center">
                <Button asChild size="lg" className="h-11 px-6 text-[15px]">
                    <Link href="/register">Get started</Link>
                </Button>
            </div>
        </div>
    );
}
