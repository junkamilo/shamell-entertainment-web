"use client";

import { MultiSelect, type MultiSelectOption, type MultiSelectProps } from "@/components/admin/inputs";

export type ServicesMultiOption = MultiSelectOption;

export type ServicesMultiSelectProps = Omit<
  MultiSelectProps,
  "emptyDisplay" | "ariaLabel"
> & {
  emptyDisplay?: string;
  ariaLabel?: string;
};

/** Domain wrapper: multi-select with services copy defaults; parent supplies `options`. */
export function ServicesMultiSelect({
  emptyDisplay = "Select services",
  ariaLabel = "Services",
  ...rest
}: ServicesMultiSelectProps) {
  return (
    <MultiSelect emptyDisplay={emptyDisplay} ariaLabel={ariaLabel} {...rest} />
  );
}

export default ServicesMultiSelect;
