import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { SmoothScroll } from "@/components/smooth-scroll";
import { AuthProvider } from "@/hooks/use-auth";
import { QueryProvider } from "@/lib/query-provider";
import "./globals.css";

// The design loads Geist from a CDN. Serving it through next/font instead keeps
// the request first-party and removes the swap-in flash.
const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: {
        default: "OrbitSuite",
        template: "%s · OrbitSuite",
    },
    description: "Subscription infrastructure for multi-tenant SaaS.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        // `suppressHydrationWarning` is required by next-themes: it writes the
        // theme class onto <html> before React hydrates, so the server markup
        // and the client's first read legitimately differ.
        <html
            lang="en"
            suppressHydrationWarning
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
            <body className="min-h-full font-sans">
                {/*
                 * next-themes replaces the inline pre-paint script this file used
                 * to carry: it injects an equivalent one, owns the storage key,
                 * and follows the OS setting until the user picks a side.
                 * shadcn's Toaster reads the same context to theme itself.
                 */}
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    storageKey="orbitsuite-theme"
                    disableTransitionOnChange
                >
                    <SmoothScroll />
                    <QueryProvider>
                        <AuthProvider>{children}</AuthProvider>
                    </QueryProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
