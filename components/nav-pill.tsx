"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "./theme-toggle";

/**
 * The floating glass header from the design. It drops the link for whichever
 * page you are already on — the design draws three separate nav variants for
 * exactly that, which is one variant per public marketing page.
 */
export function NavPill() {
    const pathname = usePathname();
    const { session, homePath } = useAuth();

    const showAbout = pathname !== "/about";
    const showContact = pathname !== "/contact";

    return (
        <header
            className="sticky top-4 z-100 mx-6 my-4 flex items-center justify-between
                       rounded-full border border-glass bg-scrim px-7 py-3.5
                       shadow-[0_8px_32px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,0.5)]
                       backdrop-blur-xl backdrop-saturate-180"
        >
            <Link
                href="/"
                className="text-lg font-bold tracking-tight text-ink no-underline hover:no-underline"
            >
                OrbitSuite
            </Link>

            <nav className="flex items-center gap-2">
                <ThemeToggle />
                {showAbout && (
                    <Link
                        href="/about"
                        className="px-3 py-2 text-sm font-medium text-ink-soft no-underline hover:text-ink hover:no-underline"
                    >
                        About
                    </Link>
                )}
                {showContact && (
                    <Link
                        href="/contact"
                        className="px-3 py-2 text-sm font-medium text-ink-soft no-underline hover:text-ink hover:no-underline"
                    >
                        Contact
                    </Link>
                )}

                {session ? (
                    <Link
                        href={homePath}
                        className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white no-underline hover:bg-brand-700 hover:no-underline"
                    >
                        Dashboard
                    </Link>
                ) : (
                    <>
                        <Link
                            href="/login"
                            className="px-3 py-2 text-sm font-medium text-ink-soft no-underline hover:text-ink hover:no-underline"
                        >
                            Log in
                        </Link>
                        <Link
                            href="/register"
                            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white no-underline hover:bg-brand-700 hover:no-underline"
                        >
                            Get started
                        </Link>
                    </>
                )}
            </nav>
        </header>
    );
}
