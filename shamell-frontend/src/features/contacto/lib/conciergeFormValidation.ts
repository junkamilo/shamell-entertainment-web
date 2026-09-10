import type { ConciergeFormData } from "../types/contacto.types";
import { isConciergePlanningStage } from "./conciergePlanningStages";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PHONE_LEN = 40;
const MAX_LOCATION_LEN = 300;
const MAX_GUEST_COUNT = 100_000;

export function validateConciergeForm(data: ConciergeFormData): string | null {
  if (data.fullName.trim().length < 2) return "Please enter your full name.";
  if (!emailRegex.test(data.email.trim())) return "Please enter a valid email.";

  const phone = data.phone.trim();
  if (!phone) return "Please enter a phone number.";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7 || phone.length > MAX_PHONE_LEN) {
    return "Enter a valid phone number (7+ digits).";
  }

  const location = data.location.trim();
  if (location.length < 2) return "Please enter a city or event location.";
  if (location.length > MAX_LOCATION_LEN) {
    return "City or event location must be at most 300 characters.";
  }

  if (!data.eventDate.trim()) return "Please select a tentative date.";

  if (!data.guestCount.trim()) return "Please enter an approximate guest count.";
  const guests = Number(data.guestCount);
  if (!Number.isInteger(guests) || guests < 1 || guests > MAX_GUEST_COUNT) {
    return "Guest count must be a whole number.";
  }

  if (!isConciergePlanningStage(data.planningStage)) {
    return "Please select where you are in planning.";
  }

  if (data.message.trim().length < 10) {
    return "Tell us a little more about the experience you have in mind.";
  }
  return null;
}
