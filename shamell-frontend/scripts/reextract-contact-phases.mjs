import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const orig = execSync(
  "git show HEAD:shamell-frontend/src/app/contacto/components/ContactInquiryForm.tsx",
  { encoding: "utf8", cwd: path.resolve("..") },
)
  .split(/\r?\n/);

const phases = [
  ["Service", "service", 1276, 1336],
  ["Detail", "detail", 1339, 1434],
  ["ServiceType", "serviceType", 1437, 1550],
  ["Experiences", "experiences", 1553, 1583],
  ["Logistics", "logistics", 1586, 1742],
  ["Expectations", "expectations", 1745, 1762],
  ["Contact", "contact", 1765, 1790],
  ["Review", "review", 1793, 1903],
];

const imports = `import { ChevronDown, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCatalogPriceWithSuffix } from "@/lib/formatCatalogPrice";
import {
  EXPERIENCE_ADDON_OPTIONS,
  SERVICE_TYPE_CODES,
  isValidInquiryCode,
} from "@/lib/contactInquiryConstants";
import {
  formatDateDisplayUs,
  formatTimeDisplayUs,
} from "@/lib/contactLogisticsUtils";
import {
  isBespoke,
  isGalaOrVip,
  mergedInquiryCodeFromSelections,
  readableInquiryCode,
} from "../../lib/inquiry/inquiryCodeUtils";
import { lineDescriptionPreview } from "../../lib/inquiry/inquiryDetailsBuilder";
import ContactInquiryField from "./ContactInquiryField";
import type { ContactInquiryPhaseProps } from "./contactInquiryPhase.types";
`;

const destructure = `  const {
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
  } = props;`;

const dir = "src/app/contacto/components/contact-inquiry";

for (const [comp, phase, start, end] of phases) {
  let body = orig
    .slice(start - 1, end)
    .map((l) => l.replace(/^        /, "    "))
    .join("\n")
    .replace(/\r?\n\s*\) : null\}\s*$/m, "");
  body = body.replace(/\bField\b/g, "ContactInquiryField");
  const file = `${imports}
export default function ContactInquiryPhase${comp}(props: ContactInquiryPhaseProps) {
  if (props.currentPhase !== "${phase}") return null;
${destructure}
  return (
${body}
  );
}
`;
  fs.writeFileSync(path.join(dir, `ContactInquiryPhase${comp}.tsx`), file);
}
console.log("reextracted", phases.length);
