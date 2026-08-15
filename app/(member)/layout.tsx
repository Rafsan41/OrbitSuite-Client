import { AppShell } from "@/components/app-shell";

// Every role owns a profile, so this group admits all three. `/me/organization`
// is additionally gated server-side — ORG_MEMBER and ORG_ADMIN only.
export default function MemberLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AppShell allow={["PLATFORM_ADMIN", "ORG_ADMIN", "ORG_MEMBER"]}>
            {children}
        </AppShell>
    );
}
