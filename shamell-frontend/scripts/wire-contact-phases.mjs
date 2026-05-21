import fs from "fs";

const p = "src/app/contacto/components/ContactInquiryForm.tsx";
let s = fs.readFileSync(p, "utf8");

const imports = `import ContactInquiryPhaseContact from "./contact-inquiry/ContactInquiryPhaseContact";
import ContactInquiryPhaseDetail from "./contact-inquiry/ContactInquiryPhaseDetail";
import ContactInquiryPhaseExpectations from "./contact-inquiry/ContactInquiryPhaseExpectations";
import ContactInquiryPhaseExperiences from "./contact-inquiry/ContactInquiryPhaseExperiences";
import ContactInquiryPhaseLogistics from "./contact-inquiry/ContactInquiryPhaseLogistics";
import ContactInquiryPhaseReview from "./contact-inquiry/ContactInquiryPhaseReview";
import ContactInquiryPhaseService from "./contact-inquiry/ContactInquiryPhaseService";
import ContactInquiryPhaseServiceType from "./contact-inquiry/ContactInquiryPhaseServiceType";
import type { ContactInquiryPhaseProps } from "./contact-inquiry/contactInquiryPhase.types";
`;

if (!s.includes("ContactInquiryPhaseService")) {
  s = s.replace(
    'import ContactInquiryField from "./contact-inquiry/ContactInquiryField";',
    `import ContactInquiryField from "./contact-inquiry/ContactInquiryField";\n${imports}`,
  );
}

const lines = s.split(/\r?\n/);
const start = lines.findIndex((l) => l.includes('currentPhase === "service"'));
const end = lines.findIndex((l, i) => i > start && l.includes('currentPhase === "contact" ? "Continue to review"'));
// end should be before nav buttons - find closing of review phase
let end2 = -1;
for (let i = start; i < lines.length; i++) {
  if (lines[i].trim() === ") : null}" && i > 700) {
    end2 = i + 1;
    break;
  }
}
// find last phase block end - line 858 was review end
let reviewEnd = -1;
let count = 0;
for (let i = start; i < lines.length; i++) {
  if (lines[i].includes("currentPhase ===")) count++;
  if (count === 8 && lines[i].trim() === ") : null}") {
    reviewEnd = i + 1;
    break;
  }
}

const phaseStart = start;
const phaseEnd = reviewEnd > 0 ? reviewEnd : end2;
console.log("phase block", phaseStart, phaseEnd);

const replacement = `        {(() => {
          const phaseProps: ContactInquiryPhaseProps = {
            currentPhase,
            data,
            setData,
            setStepError,
            contactLines,
            selectedLine,
            serviceTypeOptions,
            selectContactLine,
            setDetailModal,
            toggleUuidList,
            toggleAddon,
            update,
            occasionSingleLabel,
            logisticsPickerTriggerClass,
            logisticsUsesBespokeDeadlineRule,
            setOccasionPickerOpen,
            setDatePickerOpen,
            setTimePickerWhich,
            catalogSnapshot,
            catalogDismissed,
            serviceSummary,
            serviceSummaryLoading,
            pricingPreviewEventLine,
            pricingPreviewServiceLines,
            pricingPreviewOccasionLines,
            pricingGuidePreview,
            reviewProjectLabels,
            reviewRoleLabels,
          };
          return (
            <>
              <ContactInquiryPhaseService {...phaseProps} />
              <ContactInquiryPhaseDetail {...phaseProps} />
              <ContactInquiryPhaseServiceType {...phaseProps} />
              <ContactInquiryPhaseExperiences {...phaseProps} />
              <ContactInquiryPhaseLogistics {...phaseProps} />
              <ContactInquiryPhaseExpectations {...phaseProps} />
              <ContactInquiryPhaseContact {...phaseProps} />
              <ContactInquiryPhaseReview {...phaseProps} />
            </>
          );
        })()}`;

const out = [...lines.slice(0, phaseStart), replacement, ...lines.slice(phaseEnd)];
fs.writeFileSync(p, out.join("\n"));
console.log("wired");
