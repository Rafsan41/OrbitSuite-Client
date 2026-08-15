import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * App-level compositions, kept out of `components/ui/` — that directory is
 * shadcn's, and anything in it can be overwritten by `shadcn add --overwrite`.
 * These are OrbitSuite's own patterns built from those primitives.
 */

/**
 * Every standalone screen outside the app shell — auth, checkout — is one
 * centred card. Widths live here as three named sizes rather than a per-page
 * `max-w-*`, so the cards line up with each other and a screen cannot quietly
 * drift a few pixels off the others.
 */
const CARD_WIDTHS = {
    /** Login, forgot, reset, accept invite — a couple of fields. */
    sm: "max-w-md",
    /** Checkout outcomes — a summary block plus actions. */
    md: "max-w-lg",
    /** Registration — five fields and the plan grid. */
    lg: "max-w-2xl",
} as const;

export function AuthCard({
    size = "sm",
    className,
    children,
}: {
    size?: keyof typeof CARD_WIDTHS;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                "w-full rounded-xl bg-card p-8 text-card-foreground ring-1 ring-foreground/10",
                CARD_WIDTHS[size],
                className,
            )}
        >
            {children}
        </div>
    );
}

/** Title + subtitle for a card screen, so the two never drift apart in spacing. */
export function AuthCardHeader({
    title,
    description,
    centered = false,
}: {
    title: string;
    description?: string;
    centered?: boolean;
}) {
    return (
        <div className={cn("mb-6", centered && "text-center")}>
            <h1 className="m-0 text-xl font-semibold tracking-tight">{title}</h1>
            {description && (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
        </div>
    );
}

export interface FormFieldProps {
    label: string;
    htmlFor?: string;
    /** A server-side error from the API's `errors[]`, or a client zod message. */
    error?: string;
    hint?: string;
    children: React.ReactNode;
    className?: string;
}

/**
 * Deliberately not shadcn's `<Form>`: that wires its own react-hook-form
 * context and field name plumbing, and every form here already holds a typed
 * `useForm` result. This just places the label, hint and message consistently.
 */
export function FormField({
    label,
    htmlFor,
    error,
    hint,
    children,
    className,
}: FormFieldProps) {
    return (
        <div className={cn("mb-3.5 grid gap-1.5", className)}>
            <Label htmlFor={htmlFor}>{label}</Label>
            {children}
            {/* The hint is replaced by the error rather than stacked under it —
                two lines of guidance about one input is one too many. */}
            {hint && !error && (
                <p className="text-xs text-muted-foreground">{hint}</p>
            )}
            {error && (
                <p className="text-xs text-destructive" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}

export function PageHeader({
    title,
    description,
    action,
}: {
    title: string;
    description?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
                <h1 className="m-0 text-2xl font-semibold tracking-tight">{title}</h1>
                {description && (
                    <p className="mt-1 text-[13px] text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {action}
        </div>
    );
}

/** Two-column label/value rows — org profile, invoice detail, subscription. */
export function DefinitionRow({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex justify-between gap-4 border-b border-border py-2.5 text-sm last:border-b-0">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-right font-medium">{children}</span>
        </div>
    );
}

/**
 * The form-level error banner every auth screen shows for a 401/403/429 — the
 * cases the API words correctly and that belong to the form, not a field.
 */
export function FormAlert({ children }: { children: React.ReactNode }) {
    return (
        <p
            role="alert"
            className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-[13px] text-destructive"
        >
            {children}
        </p>
    );
}
