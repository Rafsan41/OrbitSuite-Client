import { Suspense } from "react";
import { SetPasswordForm } from "@/components/set-password-form";
import { LoadingState } from "@/components/states";

export const metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
    // `useSearchParams` suspends, so the boundary is required — without it the
    // whole route is forced into dynamic rendering at build time.
    return (
        <Suspense fallback={<LoadingState />}>
            <SetPasswordForm
                endpoint="/auth/reset-password"
                title="Reset your password"
                description="Choose a new password for your account."
                submitLabel="Reset password"
                doneTitle="Password reset"
                doneBody="Your password has been updated. Log in with your new password."
            />
        </Suspense>
    );
}
