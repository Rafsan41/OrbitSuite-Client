"use client";

import { useRouter } from "next/navigation";
import { AuthCard, AuthCardHeader, FormAlert } from "@/components/patterns";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useStartCheckout } from "@/hooks/use-checkout";
import { ApiError } from "@/lib/api-client";

export default function CheckoutCancelPage() {
    const router = useRouter();
    const { logout } = useAuth();
    const startCheckout = useStartCheckout();

    const message =
        startCheckout.error instanceof ApiError ? startCheckout.error.message : null;

    return (
        <AuthCard size="md" className="text-center">
            <AuthCardHeader
                centered
                title="Checkout cancelled"
                description="No payment was made. Your organization is saved — you can pick up where you left off whenever you're ready."
            />

            {message && <FormAlert>{message}</FormAlert>}

            <div className="flex justify-center gap-3">
                <Button
                    size="lg"
                    onClick={() => startCheckout.mutate()}
                    disabled={startCheckout.isPending}
                >
                    {startCheckout.isPending ? "Redirecting…" : "Try again"}
                </Button>
                <Button
                    variant="outline"
                    size="lg"
                    onClick={() => router.push("/checkout/retry")}
                >
                    Review plan
                </Button>
            </div>

            <Button variant="ghost" size="sm" className="mt-4" onClick={logout}>
                Log out
            </Button>
        </AuthCard>
    );
}
