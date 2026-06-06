import {
  BadRequestException,
  Body,
  Controller,
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
import { AdminVenueReservationsQueryDto } from './dto/admin-venue-reservations-query.dto';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { VenueReservationsService } from './venue-reservations.service';

@Controller('venue-reservations')
export class VenueReservationsController {
  constructor(
    private readonly venueReservationsService: VenueReservationsService,
  ) {}

  @Get('availability')
  @HttpCode(HttpStatus.OK)
  getAvailability(
    @Query('upcomingEventId') upcomingEventId?: string,
    @Query('upcomingEventSlug') upcomingEventSlug?: string,
  ) {
    return this.venueReservationsService.getAvailability({
      upcomingEventId: upcomingEventId?.trim() || undefined,
      upcomingEventSlug: upcomingEventSlug?.trim() || undefined,
    });
  }

  @Post('checkout-session')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  createCheckoutSession(@Body() dto: CreateCheckoutSessionDto) {
    return this.venueReservationsService.createCheckoutSession(dto);
  }

  @Get('session-status')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  getSessionStatus(@Query('session_id') sessionId: string) {
    if (!sessionId?.trim()) {
      throw new BadRequestException('session_id is required.');
    }
    return this.venueReservationsService.getSessionStatus(sessionId.trim());
  }

  @Post('reconcile')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  reconcileSession(@Query('session_id') sessionId: string) {
    if (!sessionId?.trim()) {
      throw new BadRequestException('session_id is required.');
    }
    return this.venueReservationsService.getSessionStatus(sessionId.trim());
  }

  @Get('admin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  listAdmin(@Query() query: AdminVenueReservationsQueryDto) {
    return this.venueReservationsService.listAdminReservations(query);
  }

  @Patch('admin/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  cancelAdmin(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.venueReservationsService.cancelAdminReservation(id);
  }
}
