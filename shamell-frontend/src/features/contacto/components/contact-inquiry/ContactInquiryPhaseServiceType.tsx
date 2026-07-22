import { ChevronDown, Eye } from "lucide-react";
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

export default function ContactInquiryPhaseServiceType(props: ContactInquiryPhaseProps) {
  if (props.currentPhase !== "serviceType") return null;
  const {
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
  } = props;
  return (
      <div className="space-y-4">
        <p className="font-body text-base leading-relaxed text-foreground/75 md:text-lg">
          Select all service types that apply to this inquiry (one or more). Tap the eye to read the full
          offering.
        </p>
        <div className="grid gap-3">
          {serviceTypeOptions.length > 0
            ? serviceTypeOptions.map((row) => {
                const checked = data.serviceOptionIds.includes(row.id);
                const chkId = `inquiry-service-opt-${row.id}`;
                const priceLabel = formatCatalogPriceWithSuffix(row.price ?? null);
                return (
                  <div
                    key={row.id}
                    className={`flex overflow-hidden rounded border transition-colors ${
                      checked ? "border-gold bg-gold/10" : "border-gold/25 hover:border-gold/45"
                    }`}
                  >
                    <label htmlFor={chkId} className="flex min-w-0 flex-1 cursor-pointer flex-col gap-1 p-4">
                      <div className="flex items-start gap-3">
                        <input
                          id={chkId}
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setData((prev) => {
                              const has = prev.serviceOptionIds.includes(row.id);
                              const serviceOptionIds = has
                                ? prev.serviceOptionIds.filter((x) => x !== row.id)
                                : [...prev.serviceOptionIds, row.id];
                              const inquiryCode = mergedInquiryCodeFromSelections(
                                serviceOptionIds,
                                serviceTypeOptions,
                              );
                              return { ...prev, serviceOptionIds, inquiryCode };
                            });
                            setStepError(null);
                          }}
                          className="mt-1 border-gold/50 text-gold focus:ring-gold"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="font-brand text-base tracking-[0.14em] text-gold sm:text-lg md:text-xl">
                            {row.title}
                          </span>
                          {priceLabel ? (
                            <p className="mt-1 font-body text-sm text-foreground/65 sm:text-base">
                              Guide from {priceLabel}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </label>
                    <div className="flex shrink-0 flex-col border-l border-gold/25 bg-black/15">
                      <button
                        type="button"
                        className="inline-flex min-h-13 min-w-13 flex-1 items-center justify-center text-gold transition hover:bg-gold/10 sm:min-h-11 sm:min-w-11"
                        aria-label={`View details for ${row.title}`}
                        onClick={() => setDetailModal({ kind: "service", option: row })}
                      >
                        <Eye className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                      </button>
                    </div>
                  </div>
                );
              })
            : SERVICE_TYPE_CODES.map((code) => {
                const id = code;
                const label = readableInquiryCode(code);
                const checked = data.serviceOptionIds.includes(id);
                const chkId = `inquiry-service-fallback-${code}`;
                return (
                  <label
                    key={code}
                    htmlFor={chkId}
                    className={`flex cursor-pointer flex-col gap-1 rounded border p-4 transition-colors ${
                      checked ? "border-gold bg-gold/10" : "border-gold/25 hover:border-gold/45"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        id={chkId}
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setData((prev) => {
                            const has = prev.serviceOptionIds.includes(id);
                            const serviceOptionIds = has
                              ? prev.serviceOptionIds.filter((x) => x !== id)
                              : [...prev.serviceOptionIds, id];
                            const inquiryCode = mergedInquiryCodeFromSelections(
                              serviceOptionIds,
                              serviceTypeOptions,
                            );
                            return { ...prev, serviceOptionIds, inquiryCode };
                          });
                          setStepError(null);
                        }}
                        className="mt-1 border-gold/50 text-gold focus:ring-gold"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-brand text-base tracking-[0.14em] text-gold sm:text-lg md:text-xl">
                          {label}
                        </span>
                        <p className="mt-1 font-body text-xs text-foreground/50">
                          Detailed catalog pricing loads when services are available from the server.
                        </p>
                      </div>
                    </div>
                  </label>
                );
              })}
        </div>
      </div>
  );
}
