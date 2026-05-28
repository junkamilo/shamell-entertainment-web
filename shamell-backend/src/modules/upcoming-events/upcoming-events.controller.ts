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
import { UpsertClassSessionDto } from './dto/upsert-class-session.dto';
import { UpsertVenueConfigDto } from './dto/upsert-venue-config.dto';
import { UpcomingEventsService } from './upcoming-events.service';

@Controller()
export class UpcomingEventsController {
  constructor(private readonly upcomingEventsService: UpcomingEventsService) {}

  @Get('class-enrollments/session-status')
  @HttpCode(HttpStatus.OK)
  getClassSessionStatus(@Query('session_id') sessionId: string) {
    if (!sessionId?.trim()) {
      throw new BadRequestException('session_id is required.');
    }
    return this.upcomingEventsService.getClassSessionStatus(sessionId.trim());
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
    return this.upcomingEventsService.updateAdminSession(eventId, sessionId, dto);
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
}
