import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminJwtGuard } from '../../common/auth/admin-jwt.guard';
import { AgendaService } from './agenda.service';
import { AgendaHubBadgesQueryDto } from './dto/agenda-hub-badges-query.dto';

@ApiTags('Agenda')
@Controller('agenda')
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Get('hub-badges')
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Aggregated inbox + payment history badge counts for agenda hub',
  })
  getHubBadges(@Query() query: AgendaHubBadgesQueryDto) {
    return this.agendaService.getHubBadges(query);
  }

  @Get('agendar/catalog')
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Aggregated services, event types, and occasions for Agendar',
  })
  getAgendarCatalog() {
    return this.agendaService.getAgendarCatalog();
  }
}
