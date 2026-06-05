import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminJwtGuard } from '../contact/guards/admin-jwt.guard';
import { UpcomingEventsService } from '../upcoming-events/upcoming-events.service';
import { AdminPaymentsService } from './admin-payments.service';
import {
  AdminPaymentsBadgeQueryDto,
  AdminPaymentsQueryDto,
} from './dto/admin-payments-query.dto';

@ApiTags('Admin Payments')
@Controller('admin/payments')
export class AdminPaymentsController {
  constructor(
    private readonly adminPaymentsService: AdminPaymentsService,
    private readonly upcomingEventsService: UpcomingEventsService,
  ) {}

  @Get()
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unified Stripe payment history (admin)' })
  listPayments(@Query() query: AdminPaymentsQueryDto) {
    return this.adminPaymentsService.listPayments(query);
  }

  @Get('badge')
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Count payment status updates since timestamp (admin badge)',
  })
  countBadge(@Query() query: AdminPaymentsBadgeQueryDto) {
    return this.adminPaymentsService.countBadgeSince(query.since);
  }

  @Post('reconcile-fixed-ticket')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reconcile a paid Stripe checkout session into a fixed ticket enrollment',
  })
  reconcileFixedTicket(@Query('session_id') sessionId: string) {
    if (!sessionId?.trim()) {
      throw new BadRequestException('session_id is required.');
    }
    return this.upcomingEventsService.reconcileFixedTicketFromStripeSession(
      sessionId.trim(),
    );
  }
}
