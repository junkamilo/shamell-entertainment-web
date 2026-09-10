export const CONCIERGE_PLANNING_STAGES = [
  "EARLY_IDEA",
  "COMPARING_OPTIONS",
  "DATE_OR_VENUE_READY",
  "JUST_EXPLORING",
] as const;

export type ConciergePlanningStage = (typeof CONCIERGE_PLANNING_STAGES)[number];

export const CONCIERGE_PLANNING_STAGE_OPTIONS: {
  value: ConciergePlanningStage;
  label: string;
}[] = [
  { value: "EARLY_IDEA", label: "I have an idea, but need direction" },
  { value: "COMPARING_OPTIONS", label: "I am comparing possible experiences" },
  { value: "DATE_OR_VENUE_READY", label: "I have a date or venue in mind" },
  { value: "JUST_EXPLORING", label: "I am exploring what Shamell offers" },
];

export function isConciergePlanningStage(
  value: string,
): value is ConciergePlanningStage {
  return (CONCIERGE_PLANNING_STAGES as readonly string[]).includes(value);
}
