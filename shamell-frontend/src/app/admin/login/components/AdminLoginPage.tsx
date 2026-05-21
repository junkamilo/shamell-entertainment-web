"use client";

import { AdminLoginForm } from "./AdminLoginForm";

export function AdminLoginPage() {
  return (
    <main className="admin-main shamell-admin-bg flex min-h-svh items-center justify-center px-4 py-8 sm:py-12">
      <section className="admin-panel w-full max-w-md border-shamell-line-strong p-7 sm:p-8 md:max-w-xl md:p-10">
        <AdminLoginForm />
      </section>
    </main>
  );
}
