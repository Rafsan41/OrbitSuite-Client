"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { NavPill } from "@/components/nav-pill";
import { SiteFooter } from "@/components/site-footer";
import { LoadingState } from "@/components/states";
import { useAuth } from "@/hooks/use-auth";

/**
 * Checkout sits between the public site and the app: it needs a session, but
 * not the sidebar — an organization that has not paid yet has nothing to
 * navigate to. Only the Org Admin who owns the billing relationship belongs
 * here; the API enforces the same rule, this just avoids rendering a page that
 * would do nothing but 403.
 */
export default function CheckoutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { session, isLoading, homePath } = useAuth();
    const router = useRouter();

    const allowed = session?.user.role === "ORG_ADMIN";

    useEffect(() => {
        if (isLoading) return;
        if (!session) router.replace("/login");
        else if (!allowed) router.replace(homePath);
    }, [isLoading, session, allowed, homePath, router]);

    return (
        <div className="bg-anim flex min-h-screen flex-col">
            <NavPill />
            <main className="flex flex-1 items-center justify-center px-4 pt-6 pb-28">
                {isLoading || !allowed ? <LoadingState /> : children}
            </main>
            <SiteFooter />
        </div>
    );
}
