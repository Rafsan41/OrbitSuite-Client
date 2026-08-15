"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingState } from "@/components/states";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_LABELS } from "@/lib/format";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

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

    const nav = (
        <>
            <div>
                <p className="px-3 text-base font-bold tracking-tight">OrbitSuite</p>
                <p className="mb-5 px-3 text-[11px] tracking-wide text-muted-foreground uppercase">
                    {ROLE_LABELS[session.user.role]}
                </p>

                <nav className="flex flex-col gap-0.5">
                    {items.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setNavOpen(false)}
                            aria-current={isActive(item.href) ? "page" : undefined}
                            className={cn(
                                "rounded-lg px-3 py-2 text-sm no-underline hover:no-underline",
                                isActive(item.href)
                                    ? "bg-accent font-medium text-accent-foreground"
                                    : "text-foreground/75 hover:bg-muted hover:text-foreground",
                            )}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>

            <div>
                <Separator className="mb-4" />
                <p className="px-3 text-[13px] font-medium">{session.user.name}</p>
                <p className="mb-3 overflow-hidden px-3 text-xs text-ellipsis whitespace-nowrap text-muted-foreground">
                    {session.user.email}
                </p>
                <div className="mb-2 flex items-center gap-2 px-3">
                    <ThemeToggle className="size-7" />
                    <span className="text-xs text-muted-foreground">Dark mode</span>
                </div>
                <Button
                    variant="ghost"
                    className="w-full justify-start px-3 font-normal"
                    onClick={logout}
                >
                    Log out
                </Button>
            </div>
        </>
    );

    return (
        // The static half of the public shell's texture — same grid, same
        // spacing, no motion. Cards and tables paint over it, so it shows only
        // in the gutters.
        <div className="bg-pattern flex min-h-screen">
            {/* Two renderings of one nav rather than one that repositions: the
                mobile copy needs Sheet's focus trap and dismiss behaviour, and
                the desktop copy has to stay in the document flow beside the
                content so the two columns actually sit side by side. */}
            <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-border bg-card px-4 py-6 md:sticky md:top-0 md:flex md:h-screen">
                {nav}
            </aside>

            <div className="min-w-0 flex-1">
                <Sheet open={navOpen} onOpenChange={setNavOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="m-4 md:hidden">
                            <MenuIcon />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64 px-4 py-6">
                        <SheetTitle className="sr-only">Navigation</SheetTitle>
                        <div className="flex h-full flex-col justify-between">{nav}</div>
                    </SheetContent>
                </Sheet>

                <div className="mx-auto w-full max-w-7xl px-6 py-8 md:px-8">
                    {children}
                </div>
            </div>
        </div>
    );
}
