"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ModuleHero } from "@/components/admin/layout";
import { useAdminSession } from "@/features/admin/auth/hooks/useAdminSession";
import { hasAdminPermission } from "@/lib/admin/permissions";
import { AGENDA_HUB_PATH } from "@/lib/admin/routes";
import { useAgregarAdminPage } from "../hooks/useAgregarAdminPage";
import AgregarAdminOnboardingSection from "./AgregarAdminOnboardingSection";
import AgregarAdminProgressBar from "./AgregarAdminProgressBar";
import AgregarAdminStepPills from "./AgregarAdminStepPills";

export default function AgregarAdminPageContent() {
  const router = useRouter();
  const { permissions, isLoggedIn } = useAdminSession();
  const canInvite = hasAdminPermission(permissions, "admin.invite");
  const page = useAgregarAdminPage();

  useEffect(() => {
    if (!isLoggedIn) return;
    if (!canInvite) {
      router.replace(AGENDA_HUB_PATH);
    }
  }, [canInvite, isLoggedIn, router]);

  if (!canInvite) {
    return (
      <div className="mx-auto w-full max-w-6xl py-12 text-sm text-foreground/55">
        Redirecting…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <ModuleHero
        title="Add administrator"
        subtitle="Send the real admin invitation by email and finish onboarding the new administrator on this screen."
        bordered={false}
      />

      <AgregarAdminProgressBar phase={page.form.phase} />
      <AgregarAdminStepPills phase={page.form.phase} />
      <AgregarAdminOnboardingSection page={page} />
    </div>
  );
}
