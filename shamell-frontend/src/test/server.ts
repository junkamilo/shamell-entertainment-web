import { setupServer } from "msw/node";
import { aboutHandlers } from "@/features/admin/about/test/mocks/handlers";
import { agendaHubHandlers } from "@/features/admin/agenda/test/mocks/handlers";
import { bookClassHandlers } from "@/features/admin/agenda/book-class/test/mocks/handlers";
import { boxOfficeHandlers } from "@/features/admin/agenda/box-office/test/mocks/handlers";
import { disponibilidadHandlers } from "@/features/admin/agenda/disponibilidad/test/mocks/handlers";
import { miAgendaHandlers } from "@/features/admin/agenda/mi-agenda/test/mocks/handlers";
import { paymentHistoryHandlers } from "@/features/admin/agenda/payment-history/test/mocks/handlers";
import { peticionesHandlers } from "@/features/admin/agenda/peticiones/test/mocks/handlers";
import { servicesHandlers } from "@/features/admin/services/test/mocks/handlers";
import { agendaSharedHandlers } from "@/features/admin/agenda/shared/test/mocks/handlers";
import { stripeWebhooksHandlers } from "@/features/admin/agenda/stripe-webhooks/test/mocks/handlers";
import { agregarAdminHandlers } from "@/features/admin/agregar-admin/test/mocks/handlers";
import { authHandlers } from "@/features/admin/auth/test/mocks/handlers";
import { eventTypesHandlers } from "@/features/admin/event-types/test/mocks/handlers";
import { eventsHandlers } from "@/features/admin/events/test/mocks/handlers";
import { galleryHandlers } from "@/features/admin/gallery/test/mocks/handlers";
import { galleryCategoriesHandlers } from "@/features/admin/gallery-categories/test/mocks/handlers";
import { headerMediaHandlers } from "@/features/admin/header-media/test/mocks/handlers";
import { inquiriesHandlers } from "@/features/admin/inquiries/test/mocks/handlers";
import { occasionTypesHandlers } from "@/features/admin/occasion-types/test/mocks/handlers";
import { onComingEventsHandlers } from "@/features/admin/on-coming-events/test/mocks/handlers";
import { serviceTypesHandlers } from "@/features/admin/service-types/test/mocks/handlers";
import { shellHandlers } from "@/features/admin/shell/test/mocks/handlers";
import { venueReservationsHandlers } from "@/features/admin/venue-reservations/test/mocks/handlers";
import { venueTablesHandlers } from "@/features/admin/venue-tables/test/mocks/handlers";
import { contactoHandlers } from "@/features/contacto/test/mocks/handlers";
import { forgotPasswordHandlers } from "@/features/forgot-password/test/mocks/handlers";

export const server = setupServer(
  ...aboutHandlers,
  ...agendaHubHandlers,
  ...bookClassHandlers,
  ...boxOfficeHandlers,
  ...disponibilidadHandlers,
  ...miAgendaHandlers,
  ...paymentHistoryHandlers,
  ...servicesHandlers,
  ...occasionTypesHandlers,
  ...onComingEventsHandlers,
  ...serviceTypesHandlers,
  ...shellHandlers,
  ...venueReservationsHandlers,
  ...venueTablesHandlers,
  ...contactoHandlers,
  ...forgotPasswordHandlers,
  ...eventTypesHandlers,
  ...eventsHandlers,
  ...galleryCategoriesHandlers,
  ...galleryHandlers,
  ...headerMediaHandlers,
  ...inquiriesHandlers,
  ...peticionesHandlers,
  ...agendaSharedHandlers,
  ...stripeWebhooksHandlers,
  ...agregarAdminHandlers,
  ...authHandlers,
);
