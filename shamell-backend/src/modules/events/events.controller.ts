import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Query,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdminJwtGuard } from '../../common/auth/admin-jwt.guard';
import { GalleryService } from '../gallery/gallery.service';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateEventTypeDto } from './dto/create-event-type.dto';
import { CreateOccasionTypeDto } from './dto/create-occasion-type.dto';
import { ListEventsQueryDto } from './dto/list-events-query.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateEventTypeDto } from './dto/update-event-type.dto';
import { UpdateOccasionTypeDto } from './dto/update-occasion-type.dto';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly galleryService: GalleryService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300')
  getPublicEvents(@Query() query: ListEventsQueryDto) {
    return this.eventsService.getPublicEvents(query);
  }

  @Get('contact-lines')
  @HttpCode(HttpStatus.OK)
  getContactLines() {
    return this.eventsService.getContactLines();
  }

  @Get('types')
  @HttpCode(HttpStatus.OK)
  getPublicEventTypes() {
    return this.eventsService.getPublicEventTypes();
  }

  @Get('catalog/:id')
  @HttpCode(HttpStatus.OK)
  getPublicCatalogById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.eventsService.getPublicCatalogById(id);
  }

  @Get('occasions/admin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  getAdminOccasionTypes() {
    return this.eventsService.getAdminOccasionTypes();
  }

  @Post('occasions/admin')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AdminJwtGuard)
  createOccasionType(@Body() dto: CreateOccasionTypeDto) {
    return this.eventsService.createOccasionType(dto);
  }

  @Patch('occasions/admin/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  updateOccasionType(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOccasionTypeDto,
  ) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Provide at least one field to update.');
    }
    return this.eventsService.updateOccasionType(id, dto);
  }

  @Delete('occasions/admin/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  deleteOccasionType(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.eventsService.deleteOccasionType(id);
  }

  @Get('admin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  getAdminEvents(@Query() query: ListEventsQueryDto) {
    return this.eventsService.getAdminEvents(query);
  }

  @Get('types/admin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  getAdminEventTypes(@Query() query: ListEventsQueryDto) {
    return this.eventsService.getAdminEventTypes(query);
  }

  @Get('admin/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  getAdminEventById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.eventsService.getAdminEventById(id);
  }

  @Post('admin')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AdminJwtGuard)
  createEvent(@Body() dto: CreateEventDto) {
    return this.eventsService.createEvent(dto);
  }

  @Post('admin/:id/images')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AdminJwtGuard)
  @UseInterceptors(
    FilesInterceptor('media', 12, {
      storage: memoryStorage(),
      limits: { fileSize: 200 * 1024 * 1024 },
    }),
  )
  addEventCatalogImages(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFiles() mediaFiles?: Express.Multer.File[],
  ) {
    if (!mediaFiles?.length) {
      throw new BadRequestException('At least one media file is required.');
    }
    return this.galleryService.createPhotosForEvent(id, mediaFiles);
  }

  @Post('types/admin')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AdminJwtGuard)
  createEventType(@Body() dto: CreateEventTypeDto) {
    return this.eventsService.createEventType(dto);
  }

  @Patch('admin/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  updateEvent(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateEventDto,
  ) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Provide at least one field to update.');
    }
    return this.eventsService.updateEvent(id, dto);
  }

  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  deleteEvent(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.eventsService.deleteEvent(id);
  }

  @Patch('types/admin/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  updateEventType(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateEventTypeDto,
  ) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Provide at least one field to update.');
    }
    return this.eventsService.updateEventType(id, dto);
  }

  @Delete('types/admin/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  deleteEventType(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.eventsService.deleteEventType(id);
  }
}
