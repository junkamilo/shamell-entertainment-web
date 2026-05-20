"use client";

import ContactInquiryForm from "./ContactInquiryForm";
import ConciergeGate from "./ConciergeGate";
import ConciergeInquiryForm from "./ConciergeInquiryForm";
import { useContactInquiryGate } from "../hooks/useContactInquiryGate";

export default function ContactInquiryGate() {
  const gate = useContactInquiryGate();

  if (gate.view === "concierge_form") {
    return <ConciergeInquiryForm />;
  }

  if (gate.view === "concierge_gate") {
    return <ConciergeGate />;
  }

  return <ContactInquiryForm {...gate.formProps} />;
}
