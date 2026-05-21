"use client";

import AdminModuleHero from "@/components/admin/AdminModuleHero";
import { useAgregarAdminPage } from "../hooks/useAgregarAdminPage";
import AgregarAdminOnboardingSection from "./AgregarAdminOnboardingSection";
import AgregarAdminProgressBar from "./AgregarAdminProgressBar";
import AgregarAdminStepPills from "./AgregarAdminStepPills";

export default function AgregarAdminPageContent() {
  const page = useAgregarAdminPage();

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AdminModuleHero
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
