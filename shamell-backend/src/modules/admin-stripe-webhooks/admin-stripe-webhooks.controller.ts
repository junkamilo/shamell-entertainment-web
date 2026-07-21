import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminJwtGuard } from '../../common/auth/admin-jwt.guard';
import { AdminStripeWebhooksService } from './admin-stripe-webhooks.service';
import { AdminStripeWebhookEventsQueryDto } from './dto/admin-stripe-webhook-events-query.dto';

@ApiTags('Admin Stripe Webhooks')
@Controller('admin/stripe-webhook-events')
export class AdminStripeWebhooksController {
  constructor(
    private readonly adminStripeWebhooksService: AdminStripeWebhooksService,
  ) {}

  @Get()
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List Stripe webhook audit events (admin)' })
  listEvents(@Query() query: AdminStripeWebhookEventsQueryDto) {
    return this.adminStripeWebhooksService.listEvents(query);
  }

  @Get(':eventId')
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Stripe webhook event detail with related payment rows',
  })
  getEvent(@Param('eventId') eventId: string) {
    return this.adminStripeWebhooksService.getEventByStripeId(eventId);
  }
}
