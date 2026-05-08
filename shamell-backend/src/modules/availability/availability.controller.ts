import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import { CreateClosureDto } from './dto/create-closure.dto';
import { UpsertWeeklySlotsDto } from './dto/upsert-weekly-slots.dto';
import { AdminJwtGuard } from '../contact/guards/admin-jwt.guard';

@ApiTags('Availability')
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get('public')
  @ApiOperation({ summary: 'Weekly hours + closures for booking UI (no auth)' })
  getPublic() {
    return this.availabilityService.getPublicRules();
  }

  @Get('admin')
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Weekly slots + closures with ids (admin)' })
  getAdmin() {
    return this.availabilityService.getAdminSnapshot();
  }

  @Put('admin/weekly')
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Replace weekly availability (7 rows)' })
  putWeekly(@Body() dto: UpsertWeeklySlotsDto) {
    return this.availabilityService.putWeeklySlots(dto);
  }

  @Post('admin/closures')
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add a closure (specific date or recurring weekday)',
  })
  createClosure(@Body() dto: CreateClosureDto) {
    return this.availabilityService.createClosure(dto);
  }

  @Delete('admin/closures/:id')
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a closure' })
  removeClosure(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.availabilityService.removeClosure(id);
  }
}
