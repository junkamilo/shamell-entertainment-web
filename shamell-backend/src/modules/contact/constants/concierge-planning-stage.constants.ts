export const CONCIERGE_PLANNING_STAGES = [
  'EARLY_IDEA',
  'COMPARING_OPTIONS',
  'DATE_OR_VENUE_READY',
  'JUST_EXPLORING',
] as const;

export type ConciergePlanningStage = (typeof CONCIERGE_PLANNING_STAGES)[number];

export function isConciergePlanningStage(
  value: unknown,
): value is ConciergePlanningStage {
  return (
    typeof value === 'string' &&
    (CONCIERGE_PLANNING_STAGES as readonly string[]).includes(value)
  );
}
