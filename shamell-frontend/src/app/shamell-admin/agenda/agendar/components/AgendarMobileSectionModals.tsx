"use client";

import AdminModal from "@/components/admin/AdminModal";
import type { AgendarCatalog } from "../types/agendar.types";
import type { AgendarFormState } from "../hooks/useAgendarFormState";
import { AgendarClientFields } from "./AgendarClientFields";
import { AgendarEventFields } from "./AgendarEventFields";
import { AgendarLocationField } from "./AgendarClientFields";
import { AgendarLogisticsFields } from "./AgendarLogisticsFields";

type AgendarMobileSectionModalsProps = {
  form: AgendarFormState;
  catalog: AgendarCatalog;
};

export function AgendarMobileSectionModals({ form, catalog }: AgendarMobileSectionModalsProps) {
  return (
    <>
      <AdminModal
        title="Event setup"
        isOpen={form.mobileSectionModal === "event"}
        onClose={() => form.setMobileSectionModal(null)}
      >
        <div className="space-y-4">
          <AgendarEventFields catalog={catalog} form={form} />
        </div>
      </AdminModal>
      <AdminModal
        title="When & where"
        isOpen={form.mobileSectionModal === "logistics"}
        onClose={() => form.setMobileSectionModal(null)}
      >
        <div className="space-y-4">
          <AgendarLogisticsFields form={form} variant="mobile" />
          <AgendarLocationField form={form} />
        </div>
      </AdminModal>
      <AdminModal
        title="Client & notes"
        isOpen={form.mobileSectionModal === "client"}
        onClose={() => form.setMobileSectionModal(null)}
      >
        <div className="space-y-4">
          <AgendarClientFields form={form} />
        </div>
      </AdminModal>
    </>
  );
}
