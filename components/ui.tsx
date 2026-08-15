import { forwardRef } from "react";

/** Joins class names, dropping falsy entries. */
export const cx = (...parts: (string | false | null | undefined)[]) =>
    parts.filter(Boolean).join(" ");

/* -------------------------------------------------------------------------- */
/* Button                                                                      */
/* -------------------------------------------------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "link";
type ButtonSize = "sm" | "md";

const BUTTON_BASE =
    "inline-flex items-center justify-center gap-2 rounded-md font-medium " +
    "cursor-pointer transition-colors disabled:cursor-not-allowed " +
    "disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 " +
    "focus-visible:outline-accent-600";

// The design fills buttons with #e37434. White on that measures 3.08:1 and
// fails WCAG AA, so the fill is brand-600 (#b85a24, 4.67:1). #e37434 stays the
// brand colour for the logo, headings and anything 24px or larger.
const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    secondary: "bg-surface text-ink border border-line hover:bg-page",
    ghost: "bg-transparent text-ink-soft hover:text-ink",
    danger:
        "bg-surface text-status-failed-fg border border-status-failed-border hover:bg-status-failed-bg",
    link: "bg-transparent text-accent-600 hover:text-accent-700 hover:underline p-0",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
    sm: "text-[13px] px-3.5 py-2",
    md: "text-sm px-4 py-2.5",
};

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    function Button(
        { variant = "primary", size = "md", className, type, ...props },
        ref,
    ) {
        return (
            <button
                ref={ref}
                // Buttons inside a <form> default to type="submit", which turns
                // every "Cancel" into an accidental submit.
                type={type ?? "button"}
                className={cx(
                    BUTTON_BASE,
                    BUTTON_VARIANTS[variant],
                    variant !== "link" && BUTTON_SIZES[size],
                    className,
                )}
                {...props}
            />
        );
    },
);

/* -------------------------------------------------------------------------- */
/* Form controls                                                               */
/* -------------------------------------------------------------------------- */

const CONTROL =
    "w-full rounded-md border border-line bg-surface px-3 py-2.5 text-sm " +
    "text-ink outline-none transition-colors disabled:opacity-60";

export const Input = forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cx(CONTROL, className)} {...props} />;
});

export const Textarea = forwardRef<
    HTMLTextAreaElement,
    React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
    return (
        <textarea
            ref={ref}
            className={cx(CONTROL, "min-h-25 resize-y", className)}
            {...props}
        />
    );
});

export const Select = forwardRef<
    HTMLSelectElement,
    React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, ...props }, ref) {
    return <select ref={ref} className={cx(CONTROL, className)} {...props} />;
});

export function Label({
    className,
    ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
    return (
        <label
            className={cx(
                "mb-1.5 block text-[13px] font-medium text-ink-soft",
                className,
            )}
            {...props}
        />
    );
}

export interface FormFieldProps {
    label: string;
    htmlFor?: string;
    /** Server-side field error from the API's `errors[]`, or a client zod message. */
    error?: string;
    hint?: string;
    children: React.ReactNode;
    className?: string;
}

export function FormField({
    label,
    htmlFor,
    error,
    hint,
    children,
    className,
}: FormFieldProps) {
    return (
        <div className={cx("mb-3.5", className)}>
            <Label htmlFor={htmlFor}>{label}</Label>
            {children}
            {hint && !error && (
                <p className="mt-1 text-xs text-ink-muted">{hint}</p>
            )}
            {error && (
                <p className="mt-1 text-xs text-status-failed-fg" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Surfaces                                                                    */
/* -------------------------------------------------------------------------- */

export function Card({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cx(
                "rounded-lg border border-line bg-surface p-6",
                className,
            )}
            {...props}
        />
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
                <h1 className="m-0 text-2xl font-semibold tracking-tight">
                    {title}
                </h1>
                {description && (
                    <p className="mt-1 text-[13px] text-ink-muted">
                        {description}
                    </p>
                )}
            </div>
            {action}
        </div>
    );
}

/** Two-column label/value rows — used by org profile, invoice and subscription. */
export function DefinitionRow({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex justify-between gap-4 border-b border-line-soft py-2.5 text-sm last:border-b-0">
            <span className="text-ink-muted">{label}</span>
            <span className="text-right font-medium">{children}</span>
        </div>
    );
}
