import { setupServer } from "msw/node";
import { aboutHandlers } from "@test/features/admin/about/support/mocks/handlers";
import { agendaHubHandlers } from "@test/features/admin/agenda/support/mocks/handlers";
import { bookClassHandlers } from "@test/features/admin/agenda/book-class/support/mocks/handlers";
import { boxOfficeHandlers } from "@test/features/admin/agenda/box-office/support/mocks/handlers";
import { disponibilidadHandlers } from "@test/features/admin/agenda/disponibilidad/support/mocks/handlers";
import { miAgendaHandlers } from "@test/features/admin/agenda/mi-agenda/support/mocks/handlers";
import { paymentHistoryHandlers } from "@test/features/admin/agenda/payment-history/support/mocks/handlers";
import { peticionesHandlers } from "@test/features/admin/agenda/peticiones/support/mocks/handlers";
import { servicesHandlers } from "@test/features/admin/services/support/mocks/handlers";
import { agendaSharedHandlers } from "@test/features/admin/agenda/shared/support/mocks/handlers";
import { stripeWebhooksHandlers } from "@test/features/admin/agenda/stripe-webhooks/support/mocks/handlers";
import { agregarAdminHandlers } from "@test/features/admin/agregar-admin/support/mocks/handlers";
import { authHandlers } from "@test/features/admin/auth/support/mocks/handlers";
import { eventTypesHandlers } from "@test/features/admin/event-types/support/mocks/handlers";
import { eventsHandlers } from "@test/features/admin/events/support/mocks/handlers";
import { galleryHandlers } from "@test/features/admin/gallery/support/mocks/handlers";
import { galleryCategoriesHandlers } from "@test/features/admin/gallery-categories/support/mocks/handlers";
import { headerMediaHandlers } from "@test/features/admin/header-media/support/mocks/handlers";
import { inquiriesHandlers } from "@test/features/admin/inquiries/support/mocks/handlers";
import { occasionTypesHandlers } from "@test/features/admin/occasion-types/support/mocks/handlers";
import { onComingEventsHandlers } from "@test/features/admin/on-coming-events/support/mocks/handlers";
import { serviceTypesHandlers } from "@test/features/admin/service-types/support/mocks/handlers";
import { shellHandlers } from "@test/features/admin/shell/support/mocks/handlers";
import { venueReservationsHandlers } from "@test/features/admin/venue-reservations/support/mocks/handlers";
import { venueTablesHandlers } from "@test/features/admin/venue-tables/support/mocks/handlers";
import { contactoHandlers } from "@test/features/contacto/support/mocks/handlers";
import { forgotPasswordHandlers } from "@test/features/forgot-password/support/mocks/handlers";
import { publicGalleryHandlers } from "@test/features/gallery/support/mocks/handlers";
import { publicOnComingEventsHandlers } from "@test/features/on-coming-events/support/mocks/handlers";
import { hooksHandlers } from "@test/hooks/support/mocks/handlers";
import { adminLibHandlers } from "@/lib/admin/test/mocks/handlers";
import { stripeLibHandlers } from "@/lib/stripe/test/mocks/handlers";
import { aboutLibHandlers } from "@/lib/about/test/mocks/handlers";
import { agendaLibHandlers } from "@/lib/agenda/test/mocks/handlers";
import { contactoLibHandlers } from "@/lib/contacto/test/mocks/handlers";
import { galleryLibHandlers } from "@/lib/gallery/test/mocks/handlers";
import { headerMediaLibHandlers } from "@/lib/header-media/test/mocks/handlers";
import { heroLibHandlers } from "@/lib/hero/test/mocks/handlers";
import { homeLibHandlers } from "@/lib/home/test/mocks/handlers";
import { onComingEventsLibHandlers } from "@/lib/on-coming-events/test/mocks/handlers";
import { servicesLibHandlers } from "@/lib/services/test/mocks/handlers";
import { themeLibHandlers } from "@/lib/theme/test/mocks/handlers";
import { sharedLibHandlers } from "@/lib/test/mocks/handlers";
import { adminSharedLibHandlers } from "@/app/admin/shared/lib/test/mocks/handlers";

export const server = setupServer(
  ...homeLibHandlers,
  ...heroLibHandlers,
  ...headerMediaLibHandlers,
  ...galleryLibHandlers,
  ...contactoLibHandlers,
  ...agendaLibHandlers,
  ...aboutLibHandlers,
  ...onComingEventsLibHandlers,
  ...servicesLibHandlers,
  ...themeLibHandlers,
  ...sharedLibHandlers,
  ...adminSharedLibHandlers,
  ...stripeLibHandlers,
  ...adminLibHandlers,
  ...hooksHandlers,
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
  ...publicGalleryHandlers,
  ...publicOnComingEventsHandlers,
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
