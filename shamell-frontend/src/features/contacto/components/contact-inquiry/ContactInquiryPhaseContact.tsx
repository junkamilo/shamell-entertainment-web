import ContactInquiryField from "./ContactInquiryField";
import type { ContactInquiryPhaseProps } from "./contactInquiryPhase.types";

export default function ContactInquiryPhaseContact(props: ContactInquiryPhaseProps) {
  if (props.currentPhase !== "contact") return null;
  const { data, update } = props;
  return (
    <div className="space-y-5">
      <ContactInquiryField
        label="Full name"
        name="fullName"
        value={data.fullName}
        onChange={(v) => update("fullName", v)}
        required
      />
      <ContactInquiryField
        label="Email"
        name="email"
        type="email"
        value={data.email}
        onChange={(v) => update("email", v)}
        required
      />
      <ContactInquiryField
        label="Phone"
        name="phone"
        type="tel"
        value={data.phone}
        onChange={(v) => update("phone", v)}
        hint="Optional — include country code if outside your region."
      />
    </div>
  );
}
