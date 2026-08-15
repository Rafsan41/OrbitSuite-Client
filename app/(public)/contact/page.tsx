"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AuthCard, AuthCardHeader, FormField } from "@/components/patterns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { contactSchema, type ContactValues } from "@/lib/schemas";

/** Where the mail goes. One constant, so the copy and the link cannot disagree. */
const CONTACT_ADDRESS = "hello@orbitsuite.test";

export default function ContactPage() {
    const [sent, setSent] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ContactValues>({
        resolver: zodResolver(contactSchema),
        defaultValues: { name: "", email: "", message: "" },
    });

    /**
     * There is no contact endpoint on the API, so this hands the message to the
     * visitor's own mail client rather than pretending to deliver it. A form
     * that reports "Message sent" while sending nothing is worse than no form
     * at all: someone waits for a reply that was never going to come.
     */
    const onSubmit = handleSubmit((values) => {
        const subject = `OrbitSuite enquiry from ${values.name}`;
        const body = `${values.message}\n\n—\n${values.name}\n${values.email}`;
        window.location.assign(
            `mailto:${CONTACT_ADDRESS}?subject=${encodeURIComponent(
                subject,
            )}&body=${encodeURIComponent(body)}`,
        );
        setSent(true);
    });

    if (sent) {
        return (
            <AuthCard>
                <AuthCardHeader
                    title="Over to your mail app"
                    description="We've opened a draft addressed to us with your message in it. Send it from there and we'll reply within a business day."
                />
                <div className="grid gap-2">
                    <Button asChild size="lg" className="h-10 w-full">
                        <Link href="/">Back to home</Link>
                    </Button>
                    {/* Not every browser has a mail handler registered, and a
                        mailto that silently does nothing would otherwise leave
                        the visitor on a success screen with no way back. */}
                    <Button
                        variant="ghost"
                        size="lg"
                        className="h-10 w-full"
                        onClick={() => setSent(false)}
                    >
                        Nothing opened — show the form again
                    </Button>
                </div>
            </AuthCard>
        );
    }

    return (
        <AuthCard>
            <AuthCardHeader
                title="Get in touch"
                description="Questions about plans or a demo? We'd love to hear from you."
            />

            <form onSubmit={onSubmit} noValidate>
                <FormField label="Name" htmlFor="name" error={errors.name?.message}>
                    <Input
                        id="name"
                        autoComplete="name"
                        aria-invalid={!!errors.name}
                        {...register("name")}
                    />
                </FormField>

                <FormField label="Email" htmlFor="email" error={errors.email?.message}>
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@company.com"
                        aria-invalid={!!errors.email}
                        {...register("email")}
                    />
                </FormField>

                <FormField
                    label="Message"
                    htmlFor="message"
                    error={errors.message?.message}
                >
                    <Textarea
                        id="message"
                        rows={5}
                        placeholder="What can we help with?"
                        aria-invalid={!!errors.message}
                        {...register("message")}
                    />
                </FormField>

                <Button
                    type="submit"
                    size="lg"
                    className="mt-2 h-10 w-full"
                    disabled={isSubmitting}
                >
                    Send message
                </Button>
            </form>

            <p className="mt-4 text-center text-[13px] text-ink-muted">
                Or email us directly at{" "}
                <a href={`mailto:${CONTACT_ADDRESS}`}>{CONTACT_ADDRESS}</a>.
            </p>
        </AuthCard>
    );
}
