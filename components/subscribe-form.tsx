"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { emailSchema } from "@/lib/schemas";

/**
 * Email field plus Subscribe, side by side, closing the landing page.
 *
 * There is no newsletter endpoint on the API, so this does not claim to have
 * stored anything. It carries the address into registration instead — the same
 * conversion the button here used to make, minus retyping the email. A
 * "thanks, you're subscribed!" for a list that does not exist would be a
 * promise nothing can keep.
 */
export function SubscribeForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        const parsed = emailSchema.safeParse(email);
        if (!parsed.success) {
            setError(parsed.error.issues[0]?.message ?? "Enter a valid email");
            return;
        }

        setError(null);
        router.push(`/register?email=${encodeURIComponent(parsed.data)}`);
    };

    return (
        <form onSubmit={onSubmit} noValidate className="mx-auto max-w-md">
            {/* One row from `sm` up, stacked below it — a button beside an input
                on a 375px screen leaves the field too narrow to read the address
                being typed into it. */}
            <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    aria-label="Work email"
                    aria-invalid={!!error}
                    value={email}
                    onChange={(event) => {
                        setEmail(event.target.value);
                        if (error) setError(null);
                    }}
                    className="h-11 flex-1"
                />
                <Button type="submit" size="lg" className="h-11 px-6 text-[15px]">
                    Subscribe
                </Button>
            </div>

            {error && (
                <p role="alert" className="mt-2 text-left text-xs text-destructive">
                    {error}
                </p>
            )}
        </form>
    );
}
