// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { ServicesModule } from './modules/services/services.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { ContactModule } from './modules/contact/contact.module';
import { PerformersModule } from './modules/performers/performers.module';
import { AuthModule } from './modules/auth/auth.module';
import { EventsModule } from './modules/events/events.module';
import { GalleryModule } from './modules/gallery/gallery.module';
import { AboutModule } from './modules/about/about.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { HeaderMediaModule } from './modules/header-media/header-media.module';
import { FloorLayoutModule } from './modules/floor-layout/floor-layout.module';
import { StandaloneChairsModule } from './modules/standalone-chairs/standalone-chairs.module';
import { VenueTablesModule } from './modules/venue-tables/venue-tables.module';
import { VenueLayoutSettingsModule } from './modules/venue-layout-settings/venue-layout-settings.module';
import { VenueReservationsModule } from './modules/venue-reservations/venue-reservations.module';
import { UpcomingEventsModule } from './modules/upcoming-events/upcoming-events.module';
import { ReservationEventTemplatesModule } from './modules/reservation-event-templates/reservation-event-templates.module';
import { AdminPaymentsModule } from './modules/admin-payments/admin-payments.module';
import { AdminStripeWebhooksModule } from './modules/admin-stripe-webhooks/admin-stripe-webhooks.module';
import { HealthModule } from './modules/health/health.module';
import { HomeModule } from './modules/home/home.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    UsersModule,
    ServicesModule,
    BookingsModule,
    ContactModule,
    PerformersModule,
    AuthModule,
    EventsModule,
    GalleryModule,
    AboutModule,
    AvailabilityModule,
    HeaderMediaModule,
    FloorLayoutModule,
    VenueTablesModule,
    StandaloneChairsModule,
    VenueLayoutSettingsModule,
    VenueReservationsModule,
    UpcomingEventsModule,
    ReservationEventTemplatesModule,
    AdminPaymentsModule,
    AdminStripeWebhooksModule,
    HealthModule,
    HomeModule,
  ],
})
export class AppModule {}
