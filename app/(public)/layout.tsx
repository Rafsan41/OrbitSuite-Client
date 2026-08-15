"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { NavPill } from "@/components/nav-pill";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/hooks/use-auth";

/** Signed-in users have no business on these two; everything else stays open. */
const SIGNED_OUT_ONLY = new Set(["/login", "/register"]);

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { session, isLoading, homePath } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && session && SIGNED_OUT_ONLY.has(pathname)) {
            router.replace(homePath);
        }
    }, [isLoading, session, pathname, homePath, router]);

    return (
        <div className="bg-anim flex min-h-screen flex-col">
            <NavPill />
            <main className="flex flex-1 items-center justify-center px-4 pt-6 pb-28">
                {children}
            </main>
            <SiteFooter />
        </div>
    );
}
