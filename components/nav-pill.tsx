"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Two marks, one per theme. The light logo carries dark ink that disappears
 * against a dark background, so the swap is a legibility fix rather than a
 * flourish.
 *
 * Both are rendered and toggled with CSS instead of picking one from
 * `useTheme()`: the theme is only known after hydration, so a JS choice would
 * flash the wrong mark on first paint. Their intrinsic sizes differ, so each
 * carries its own — `w-auto` lets each find its width at a shared 36px height.
 */
const LOGOS = {
  light: {
    src: "https://res.cloudinary.com/drebyi1rz/image/upload/v1786816165/35de1e0d-c0bc-48cf-8064-f567d06edb3d-removebg-preview_d6fafk.png",
    width: 577,
    height: 433,
  },
  dark: {
    src: "https://res.cloudinary.com/drebyi1rz/image/upload/v1786840749/c2587ab1-7c8f-4886-8685-038fd88f0d6a_cqbyug.png",
    width: 900,
    height: 846,
  },
} as const;
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

/**
 * `href` is what the link points at; `match` is the path that makes it current.
 * The two differ for Features, which is a section of the landing page rather
 * than a route of its own, and so is never "the current page".
 */
const LINKS = [
  { href: "/", match: "/", label: "Home" },
  { href: "/#features", match: null, label: "Features" },
  { href: "/about", match: "/about", label: "About" },
  { href: "/contact", match: "/contact", label: "Contact" },
] as const;

/**
 * The floating glass header from the design.
 *
 * Three grid zones — brand, links, actions — rather than a flex row, so the
 * centre column is centred against the *header*, not against whatever the two
 * sides happen to measure. The right side changes width once a session exists
 * ("Dashboard" replacing "Log in / Get started"), and under `justify-between`
 * that would drag the links visibly off-centre.
 */
export function NavPill() {
  const pathname = usePathname();
  const { session, homePath } = useAuth();

  return (
    <header
      className="sticky top-4 z-100 mx-6 my-4 grid grid-cols-[1fr_auto_1fr] items-center
                       gap-4 rounded-full border border-glass bg-scrim px-7 py-3.5
                       shadow-[0_8px_32px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,0.5)]
                       backdrop-blur-xl backdrop-saturate-180">
      <Link
        href="/"
        className="flex items-center gap-2 justify-self-start text-2xl font-bold tracking-tight text-ink no-underline hover:no-underline">
        {/* A fixed 48px slot, wide enough for the wider of the two marks.
            Each is still sized by height and finds its own width — forcing a
            square would squash them, and the two differ in aspect — but the
            slot stops the wordmark sliding sideways when the theme flips.

            `priority` because the logo sits in the initial viewport on every
            page and would otherwise pop in after first paint. Decorative: the
            wordmark beside it already names the link, so an alt here would
            only repeat it. */}
        <span className="flex h-9 w-12 shrink-0 items-center justify-center">
          <Image
            src={LOGOS.light.src}
            alt=""
            width={LOGOS.light.width}
            height={LOGOS.light.height}
            priority
            className="h-9 w-auto dark:hidden"
          />
          <Image
            src={LOGOS.dark.src}
            alt=""
            width={LOGOS.dark.width}
            height={LOGOS.dark.height}
            priority
            className="hidden h-9 w-auto dark:block"
          />
        </span>
        OrbitSuite
      </Link>

      {/* Hidden below md: four links plus the actions will not fit inside a
                pill, and the actions are what people came for. */}
      <nav className="hidden items-center gap-1 md:flex ">
        {LINKS.map((link) => {
          const current = link.match !== null && pathname === link.match;
          return (
            <Link
              key={link.label}
              href={link.href}
              aria-current={current ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-2 text-lg font-medium no-underline hover:no-underline",
                current
                  ? "bg-scrim-strong text-ink"
                  : "text-ink-soft hover:text-ink",
              )}>
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* `size="lg"` so the actions keep pace with the enlarged links —
          shadcn's default 32px button reads undersized beside 16px nav text. */}
      <div className="flex items-center gap-2 justify-self-end">
        <ThemeToggle className="size-9" />
        {session ? (
          <Button asChild size="lg" className="text-base">
            <Link href={homePath}>Dashboard</Link>
          </Button>
        ) : (
          <>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="hidden text-base sm:inline-flex">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="lg" className="text-base">
              <Link href="/register">Get started</Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
