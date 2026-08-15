import { Suspense } from "react";
import { SetPasswordForm } from "@/components/set-password-form";
import { LoadingState } from "@/components/states";

export const metadata = { title: "Accept your invite" };

export default function AcceptInvitePage() {
    return (
        <Suspense fallback={<LoadingState />}>
            <SetPasswordForm
                endpoint="/users/accept-invite"
                title="Accept your invite"
                description="Set a password to join your team on OrbitSuite."
                submitLabel="Set password"
                doneTitle="You're all set"
                doneBody="Your password has been created. Log in to join your organization."
            />
        </Suspense>
    );
}
