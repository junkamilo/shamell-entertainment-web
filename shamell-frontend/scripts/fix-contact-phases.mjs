import fs from "fs";
import path from "path";

const dir = "src/app/contacto/components/contact-inquiry";
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

const commonDestructure = `  const {
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

for (const file of fs.readdirSync(dir)) {
  if (!file.startsWith("ContactInquiryPhase") || !file.endsWith(".tsx")) continue;
  const full = path.join(dir, file);
  const old = fs.readFileSync(full, "utf8");
  const phaseMatch = old.match(/props\.currentPhase !== "(\w+)"/);
  const phase = phaseMatch?.[1];
  if (!phase) continue;
  const bodyMatch = old.match(/return \(\n([\s\S]*)\n  \);\n\}/);
  const body = bodyMatch?.[1] ?? "";
  const name = file.replace(".tsx", "");
  const next = `${imports}
export default function ${name}(props: ContactInquiryPhaseProps) {
  if (props.currentPhase !== "${phase}") return null;
${commonDestructure}
  return (
${body}
  );
}
`;
  fs.writeFileSync(full, next);
}
console.log("fixed phases");
