/** Short check-in reference from enrollment id (no DB column). */
export function formatEnrollmentReference(enrollmentId: string): string {
  const compact = enrollmentId.replace(/-/g, '').slice(0, 8);
  return compact.toUpperCase();
}
