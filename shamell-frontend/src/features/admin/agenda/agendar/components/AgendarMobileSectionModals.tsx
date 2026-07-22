"use client";

import { Modal } from "@/components/admin/overlays";
import type { AgendarMobileSectionModalsProps } from "../types/agendarComponents.types";
import { AgendarClientFields } from "./AgendarClientFields";
import { AgendarEventFields } from "./AgendarEventFields";
import { AgendarLocationField } from "./AgendarClientFields";
import { AgendarLogisticsFields } from "./AgendarLogisticsFields";

export function AgendarMobileSectionModals({ form, catalog }: AgendarMobileSectionModalsProps) {
  return (
    <>
      <Modal
        title="Event setup"
        isOpen={form.mobileSectionModal === "event"}
        onClose={() => form.setMobileSectionModal(null)}
      >
        <div className="space-y-4">
          <AgendarEventFields catalog={catalog} form={form} />
        </div>
      </Modal>
      <Modal
        title="When & where"
        isOpen={form.mobileSectionModal === "logistics"}
        onClose={() => form.setMobileSectionModal(null)}
      >
        <div className="space-y-4">
          <AgendarLogisticsFields form={form} variant="mobile" />
          <AgendarLocationField form={form} />
        </div>
      </Modal>
      <Modal
        title="Client & notes"
        isOpen={form.mobileSectionModal === "client"}
        onClose={() => form.setMobileSectionModal(null)}
      >
        <div className="space-y-4">
          <AgendarClientFields form={form} />
        </div>
      </Modal>
    </>
  );
}
