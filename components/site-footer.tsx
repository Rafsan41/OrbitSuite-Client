import Link from "next/link";

const LINK =
    "text-[13px] text-ink-soft no-underline hover:text-ink hover:underline";
const HEADING =
    "mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted";

export function SiteFooter() {
    return (
        <footer className="border-t border-line bg-surface px-8 pt-10 pb-6">
            <div className="mx-auto flex max-w-256 flex-wrap justify-between gap-8">
                <div className="max-w-65">
                    <p className="mb-2 text-base font-bold tracking-tight">
                        OrbitSuite
                    </p>
                    <p className="text-[13px] leading-relaxed text-ink-muted">
                        Subscription infrastructure for multi-tenant SaaS.
                    </p>
                </div>

                <div className="flex flex-wrap gap-12">
                    <div>
                        <p className={HEADING}>Product</p>
                        <div className="flex flex-col gap-2">
                            <Link href="/#pricing" className={LINK}>
                                Pricing
                            </Link>
                            <Link href="/register" className={LINK}>
                                Get started
                            </Link>
                        </div>
                    </div>
                    <div>
                        <p className={HEADING}>Company</p>
                        <div className="flex flex-col gap-2">
                            <Link href="/about" className={LINK}>
                                About
                            </Link>
                            <Link href="/contact" className={LINK}>
                                Contact
                            </Link>
                        </div>
                    </div>
                    <div>
                        <p className={HEADING}>Account</p>
                        <div className="flex flex-col gap-2">
                            <Link href="/login" className={LINK}>
                                Log in
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto mt-8 max-w-256 border-t border-line-soft pt-4 text-center text-xs text-ink-muted">
                © {new Date().getFullYear()} OrbitSuite. All rights reserved.
            </div>
        </footer>
    );
}
