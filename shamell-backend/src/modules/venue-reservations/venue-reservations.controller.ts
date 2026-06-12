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
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
  CurrentAdmin,
  type AdminJwtPayload,
} from '../auth/decorators/current-admin.decorator';
import { AdminJwtGuard } from '../contact/guards/admin-jwt.guard';
import { AdminVenueReservationsQueryDto } from './dto/admin-venue-reservations-query.dto';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { ResendVenueConfirmationDto } from './dto/resend-confirmation.dto';
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

  @Get('admin/availability')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  getAdminAvailability(
    @Query('upcomingEventId') upcomingEventId?: string,
    @Query('upcomingEventSlug') upcomingEventSlug?: string,
  ) {
    return this.venueReservationsService.getAdminAvailability({
      upcomingEventId: upcomingEventId?.trim() || undefined,
      upcomingEventSlug: upcomingEventSlug?.trim() || undefined,
    });
  }

  @Post('admin/checkout-session')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AdminJwtGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  createAdminCheckoutSession(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.venueReservationsService.createAdminCheckoutSession(
      admin.id,
      dto,
    );
  }

  @Post('admin/cash')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AdminJwtGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  createAdminCashReservation(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.venueReservationsService.createAdminCashReservation(
      admin.id,
      dto,
    );
  }

  @Get('public/pay/checkout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  resolvePayCheckout(@Query('token') token: string) {
    if (!token?.trim()) {
      throw new BadRequestException('token is required.');
    }
    return this.venueReservationsService
      .resolvePayCheckoutClientSecret(token.trim())
      .then((clientSecret) => ({ clientSecret }));
  }

  @Get('public/confirmation.pdf')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async downloadConfirmationPdf(
    @Query('token') token: string,
  ): Promise<StreamableFile> {
    if (!token?.trim()) {
      throw new BadRequestException('token is required.');
    }
    const { buffer, filename } =
      await this.venueReservationsService.getConfirmationPdfDownload(
        token.trim(),
      );
    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${filename}"`,
    });
  }

  @Post('public/pay/reconcile')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  reconcilePaySession(@Query('session_id') sessionId: string) {
    if (!sessionId?.trim()) {
      throw new BadRequestException('session_id is required.');
    }
    return this.venueReservationsService.getSessionStatus(sessionId.trim());
  }

  @Patch('admin/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  cancelAdmin(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.venueReservationsService.cancelAdminReservation(id);
  }

  @Post('admin/resend-confirmation')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  resendConfirmation(@Body() dto: ResendVenueConfirmationDto) {
    if (dto.customerNames?.length) {
      return this.venueReservationsService.resendAdminPaidConfirmationForCustomers(
        dto.customerNames,
      );
    }
    if (dto.reservationIds?.length === 1) {
      return this.venueReservationsService.resendAdminPaidConfirmationEmail(
        dto.reservationIds[0],
      );
    }
    throw new BadRequestException(
      'Provide customerNames or a single reservationId.',
    );
  }
}
