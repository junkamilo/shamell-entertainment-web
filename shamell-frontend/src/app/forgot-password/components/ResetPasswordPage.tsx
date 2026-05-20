import { Suspense } from "react";
import ResetPasswordForm from "./ResetPasswordForm";

function ResetPasswordFallback() {
  return (
    <main className="shamell-admin-bg flex min-h-svh items-center justify-center px-4 py-8">
      <p className="text-sm text-foreground/60 font-body">Loading…</p>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
