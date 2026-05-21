"use client";

import AdminAccordionSingleSelect from "@/components/admin/AdminAccordionSingleSelect";
import AdminServicesMultiSelect from "@/components/admin/AdminServicesMultiSelect";
import { fieldLabelClass } from "../lib/agendarStyles";
import type { AgendarCatalog } from "../types/agendar.types";
import type { AgendarFormState } from "../hooks/useAgendarFormState";

type AgendarEventFieldsProps = {
  catalog: AgendarCatalog;
  form: AgendarFormState;
};

export function AgendarEventFields({ catalog, form }: AgendarEventFieldsProps) {
  return (
    <>
      <div className="block">
        <span className={fieldLabelClass}>EVENT TYPE</span>
        <div className="mt-2">
          <AdminAccordionSingleSelect
            options={catalog.eventTypes.map((t) => ({ id: t.id, label: t.name }))}
            value={form.eventTypeId}
            onChange={form.setEventTypeId}
            emptyDisplay="Select an event type"
            ariaLabel="Select event type"
            required
            showNoneOption={false}
          />
        </div>
      </div>

      <div className="block">
        <span className={fieldLabelClass}>OCCASION</span>
        <div className="mt-2">
          <AdminAccordionSingleSelect
            options={catalog.occasions.map((o) => ({ id: o.id, label: o.name }))}
            value={form.occasionTypeId}
            onChange={form.setOccasionTypeId}
            emptyDisplay="Select an occasion"
            ariaLabel="Select occasion"
            required
            showNoneOption={false}
          />
        </div>
      </div>

      <div className="block">
        <span className={fieldLabelClass}>SERVICES</span>
        <p className="mt-1 font-body text-xs text-foreground/55">
          Choose one or more. Order is saved; the first is the primary catalog line.
        </p>
        <div className="mt-2">
          <AdminServicesMultiSelect
            options={catalog.services.map((s) => ({
              id: s.id,
              label: s.serviceTypeName,
            }))}
            value={form.serviceIds}
            onChange={form.setServiceIds}
          />
        </div>
      </div>
    </>
  );
}
