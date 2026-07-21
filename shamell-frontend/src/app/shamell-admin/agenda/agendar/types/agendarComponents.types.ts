import type { AgendarAvailability } from "./agendarAvailability.types";
import type { AgendarBookMode } from "./agendarBookMode.types";
import type { AgendarFormState } from "./agendarFormState.types";
import type { AgendarCatalog, OccupiedRange } from "./agendar.types";

export type AgendarBookModeTabsProps = {
  activeMode: AgendarBookMode;
  onModeChange: (mode: AgendarBookMode) => void;
  showClassTab: boolean;
};

export type AgendarSubmitBarProps = {
  isEditMode: boolean;
  submitting: boolean;
  variant: "desktop" | "mobile-fixed";
};

export type AgendarPickersProps = {
  form: AgendarFormState;
  availability: AgendarAvailability;
  occupiedRanges: OccupiedRange[];
  isMobileLayout: boolean;
};

export type AgendarClientFieldsProps = {
  form: AgendarFormState;
};

export type AgendarLocationFieldProps = AgendarClientFieldsProps;

export type AgendarEventFieldsProps = {
  catalog: AgendarCatalog;
  form: AgendarFormState;
};

export type AgendarLogisticsFieldsProps = {
  form: AgendarFormState;
  variant: "desktop" | "mobile";
};

export type AgendarMobileSectionListProps = {
  form: AgendarFormState;
};

export type AgendarMobileSectionModalsProps = {
  form: AgendarFormState;
  catalog: AgendarCatalog;
};
