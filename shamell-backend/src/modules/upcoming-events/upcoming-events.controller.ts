import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AdminJwtGuard } from '../contact/guards/admin-jwt.guard';
import { CreateClassCheckoutDto } from './dto/create-class-checkout.dto';
import { CreateClassBundleCheckoutDto } from './dto/create-class-bundle-checkout.dto';
import { CreateClassPackageCheckoutDto } from './dto/create-class-package-checkout.dto';
import { CreateFixedEventCheckoutDto } from './dto/create-fixed-event-checkout.dto';
import { UpsertClassSessionDto } from './dto/upsert-class-session.dto';
import { UpsertVenueConfigDto } from './dto/upsert-venue-config.dto';
import { UpcomingEventsService } from './upcoming-events.service';

@Controller()
export class UpcomingEventsController {
  constructor(private readonly upcomingEventsService: UpcomingEventsService) {}

  @Get('class-enrollments/session-status')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  getClassSessionStatus(@Query('session_id') sessionId: string) {
    if (!sessionId?.trim()) {
      throw new BadRequestException('session_id is required.');
    }
    return this.upcomingEventsService.getClassSessionStatus(sessionId.trim());
  }

  @Post('class-enrollments/reconcile')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  reconcileClassEnrollment(@Query('session_id') sessionId: string) {
    if (!sessionId?.trim()) {
      throw new BadRequestException('session_id is required.');
    }
    return this.upcomingEventsService.reconcileClassFromStripeSession(
      sessionId.trim(),
    );
  }

  @Post('fixed-event-enrollments/reconcile')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  reconcileFixedTicket(@Query('session_id') sessionId: string) {
    if (!sessionId?.trim()) {
      throw new BadRequestException('session_id is required.');
    }
    return this.upcomingEventsService.reconcileFixedTicketFromStripeSession(
      sessionId.trim(),
    );
  }

  @Get('fixed-event-enrollments/session-status')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  getFixedEventSessionStatus(@Query('session_id') sessionId: string) {
    if (!sessionId?.trim()) {
      throw new BadRequestException('session_id is required.');
    }
    return this.upcomingEventsService.getFixedEventSessionStatus(
      sessionId.trim(),
    );
  }

  @Get('upcoming-events/admin/events/:eventId/sessions')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  listAdminSessions(@Param('eventId', new ParseUUIDPipe()) eventId: string) {
    return this.upcomingEventsService.listAdminSessions(eventId);
  }

  @Post('upcoming-events/admin/events/:eventId/sessions')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AdminJwtGuard)
  createAdminSession(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Body() dto: UpsertClassSessionDto,
  ) {
    return this.upcomingEventsService.createAdminSession(eventId, dto);
  }

  @Patch('upcoming-events/admin/events/:eventId/sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  updateAdminSession(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @Body() dto: UpsertClassSessionDto,
  ) {
    return this.upcomingEventsService.updateAdminSession(
      eventId,
      sessionId,
      dto,
    );
  }

  @Delete('upcoming-events/admin/events/:eventId/sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  deleteAdminSession(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
  ) {
    return this.upcomingEventsService.deleteAdminSession(eventId, sessionId);
  }

  @Get('upcoming-events/admin/events/:eventId/venue-config')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  getAdminVenueConfig(@Param('eventId', new ParseUUIDPipe()) eventId: string) {
    return this.upcomingEventsService.getAdminVenueConfig(eventId);
  }

  @Patch('upcoming-events/admin/events/:eventId/venue-config')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  upsertAdminVenueConfig(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Body() dto: UpsertVenueConfigDto,
  ) {
    return this.upcomingEventsService.upsertAdminVenueConfig(eventId, dto);
  }

  @Get('upcoming-events/:slug')
  @HttpCode(HttpStatus.OK)
  getPublicBySlug(@Param('slug') slug: string) {
    return this.upcomingEventsService.getPublicBySlug(slug);
  }

  @Get('upcoming-events/:slug/sessions')
  @HttpCode(HttpStatus.OK)
  listPublicSessions(@Param('slug') slug: string) {
    return this.upcomingEventsService.listPublicSessions(slug);
  }

  @Get('upcoming-events/:slug/venue')
  @HttpCode(HttpStatus.OK)
  getPublicVenue(@Param('slug') slug: string) {
    return this.upcomingEventsService.getPublicVenueBundle(slug);
  }

  @Get('upcoming-events/:slug/class-options')
  @HttpCode(HttpStatus.OK)
  getPublicClassOptions(@Param('slug') slug: string) {
    return this.upcomingEventsService.getPublicClassOptions(slug);
  }

  @Post('upcoming-events/:slug/sessions/checkout-session')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  createClassCheckout(
    @Param('slug') slug: string,
    @Body() dto: CreateClassCheckoutDto,
  ) {
    return this.upcomingEventsService.createClassCheckout(slug, dto);
  }

  @Post('upcoming-events/:slug/class-package/checkout-session')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  createClassPackageCheckout(
    @Param('slug') slug: string,
    @Body() dto: CreateClassPackageCheckoutDto,
  ) {
    return this.upcomingEventsService.createClassPackageCheckout(slug, dto);
  }

  @Post('upcoming-events/:slug/sessions/bundle-checkout-session')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  createClassBundleCheckout(
    @Param('slug') slug: string,
    @Body() dto: CreateClassBundleCheckoutDto,
  ) {
    return this.upcomingEventsService.createClassBundleCheckout(slug, dto);
  }

  @Post('upcoming-events/admin/events/:eventId/sessions/regenerate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  regenerateAdminClassSessions(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
  ) {
    return this.upcomingEventsService.regenerateAdminClassSessions(eventId);
  }

  @Post('upcoming-events/:slug/fixed-event/checkout-session')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  createFixedEventCheckout(
    @Param('slug') slug: string,
    @Body() dto: CreateFixedEventCheckoutDto,
  ) {
    return this.upcomingEventsService.createFixedEventCheckout(slug, dto);
  }
}
