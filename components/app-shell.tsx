"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_LABELS } from "@/lib/format";
import type { Role } from "@/lib/types";
import { LoadingState } from "./states";
import { ThemeToggle } from "./theme-toggle";
import { cx } from "./ui";

interface NavItem {
    href: string;
    label: string;
}

/**
 * Nav is derived from the role, never from a flag on the item. Access is
 * enforced server-side regardless — the point here is not to show people doors
 * they cannot open.
 */
const NAV_BY_ROLE: Record<Role, NavItem[]> = {
    PLATFORM_ADMIN: [
        { href: "/admin", label: "Overview" },
        { href: "/admin/organizations", label: "Organizations" },
        { href: "/admin/plans", label: "Plans" },
        { href: "/admin/transactions", label: "Transactions" },
    ],
    ORG_ADMIN: [
        { href: "/org", label: "Organization" },
        { href: "/org/members", label: "Members" },
        { href: "/org/subscription", label: "Subscription" },
        { href: "/org/billing", label: "Billing" },
        { href: "/org/transactions", label: "Transactions" },
    ],
    ORG_MEMBER: [
        { href: "/me", label: "My profile" },
        { href: "/me/organization", label: "Organization" },
    ],
};

/** Every role needs its own profile, so it hangs below the role-specific items. */
const PROFILE_ITEM: NavItem = { href: "/me", label: "My profile" };

export function AppShell({
    allow,
    children,
}: {
    allow: Role[];
    children: React.ReactNode;
}) {
    const { session, isLoading, logout, homePath } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [navOpen, setNavOpen] = useState(false);

    const role = session?.user.role;
    const permitted = !!role && allow.includes(role);

    useEffect(() => {
        if (isLoading) return;
        if (!session) {
            router.replace("/login");
        } else if (!permitted) {
            // Wrong area for this role — send them to their own home rather
            // than showing an error for a page that simply isn't theirs.
            router.replace(homePath);
        } else if (session.organization?.status === "PENDING") {
            // Registered but never paid. The product stays closed until a
            // Stripe webhook confirms payment.
            router.replace("/checkout/retry");
        }
    }, [isLoading, session, permitted, homePath, router]);

    if (isLoading || !session || !permitted) {
        return <LoadingState label="Checking your session…" />;
    }

    const items = [...NAV_BY_ROLE[session.user.role]];
    if (session.user.role !== "ORG_MEMBER") items.push(PROFILE_ITEM);

    const isActive = (href: string) =>
        pathname === href ||
        // `/org` must not light up for `/org/members`, but `/org/billing` must
        // light up for `/org/billing/abc123`.
        (href !== "/org" && href !== "/admin" && href !== "/me"
            ? pathname.startsWith(`${href}/`)
            : false);

    return (
        <div className="flex min-h-screen">
            <aside
                className={cx(
                    "flex w-60 shrink-0 flex-col justify-between border-r border-line",
                    "bg-surface px-4 py-6 md:sticky md:top-0 md:h-screen",
                    navOpen ? "fixed inset-y-0 left-0 z-50" : "hidden md:flex",
                )}
            >
                <div>
                    <p className="px-3 text-base font-bold tracking-tight">
                        OrbitSuite
                    </p>
                    <p className="mb-5 px-3 text-[11px] tracking-wide text-ink-muted uppercase">
                        {ROLE_LABELS[session.user.role]}
                    </p>

                    <nav className="flex flex-col gap-0.5">
                        {items.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setNavOpen(false)}
                                aria-current={isActive(item.href) ? "page" : undefined}
                                className={cx(
                                    "rounded-md px-3 py-2 text-sm no-underline hover:no-underline",
                                    isActive(item.href)
                                        ? "bg-accent-50 font-medium text-accent-700"
                                        : "text-ink-soft hover:bg-page hover:text-ink",
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="border-t border-line-soft pt-4">
                    <p className="px-3 text-[13px] font-medium">{session.user.name}</p>
                    <p className="mb-3 overflow-hidden px-3 text-xs text-ellipsis whitespace-nowrap text-ink-muted">
                        {session.user.email}
                    </p>
                    <div className="mb-2 flex items-center gap-2 px-3">
                        <ThemeToggle className="h-7 w-7" />
                        <span className="text-xs text-ink-muted">Dark mode</span>
                    </div>
                    <button
                        type="button"
                        onClick={logout}
                        className="w-full cursor-pointer rounded-md px-3 py-2 text-left text-[13px] text-ink-soft hover:bg-page hover:text-ink"
                    >
                        Log out
                    </button>
                </div>
            </aside>

            <div className="min-w-0 flex-1">
                <button
                    type="button"
                    onClick={() => setNavOpen((open) => !open)}
                    className="m-4 cursor-pointer rounded-md border border-line px-3 py-2 text-sm md:hidden"
                    aria-expanded={navOpen}
                >
                    {navOpen ? "Close menu" : "Menu"}
                </button>
                <div className="mx-auto max-w-320 p-8">{children}</div>
            </div>
        </div>
    );
}
