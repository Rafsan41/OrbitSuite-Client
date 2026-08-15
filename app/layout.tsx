import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

/**
 * Applies the stored theme before first paint. Without this the page renders
 * light, then flips to dark once React hydrates.
 */
const THEME_SCRIPT = `
try {
  var stored = localStorage.getItem("orbitsuite-theme");
  var dark = stored ? stored === "dark"
    : window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (dark) document.documentElement.classList.add("dark");
} catch (e) {}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
            <head>
                <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
            </head>
            <body className="min-h-full font-sans">
                <QueryProvider>
                    <AuthProvider>{children}</AuthProvider>
                </QueryProvider>
            </body>
        </html>
    );
}
