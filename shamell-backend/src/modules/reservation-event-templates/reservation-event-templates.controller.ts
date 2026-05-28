import {
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
import { ReservationEventScheduleMode } from '@prisma/client';
import { AdminJwtGuard } from '../contact/guards/admin-jwt.guard';
import { CreateReservationEventTemplateDto } from './dto/create-reservation-event-template.dto';
import { UpdateReservationEventTemplateDto } from './dto/update-reservation-event-template.dto';
import { ReservationEventTemplatesService } from './reservation-event-templates.service';

@Controller('reservation-event-templates')
export class ReservationEventTemplatesController {
  constructor(
    private readonly templatesService: ReservationEventTemplatesService,
  ) {}

  @Get('admin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  listAdmin(@Query('scheduleMode') scheduleMode?: ReservationEventScheduleMode) {
    const mode =
      scheduleMode === ReservationEventScheduleMode.FIXED_EVENT ||
      scheduleMode === ReservationEventScheduleMode.RECURRING_WEEKLY
        ? scheduleMode
        : undefined;
    return this.templatesService.listAdmin(mode);
  }

  @Get('admin/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  getAdmin(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.templatesService.getAdminById(id);
  }

  @Post('admin')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AdminJwtGuard)
  createAdmin(@Body() dto: CreateReservationEventTemplateDto) {
    return this.templatesService.createAdmin(dto);
  }

  @Patch('admin/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  updateAdmin(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateReservationEventTemplateDto,
  ) {
    return this.templatesService.updateAdmin(id, dto);
  }

  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  deleteAdmin(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.templatesService.deleteAdmin(id);
  }
}
