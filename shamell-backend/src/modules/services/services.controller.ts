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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdminJwtGuard } from '../contact/guards/admin-jwt.guard';
import { CreateServiceDto } from './dto/create-service.dto';
import { CreateServiceTypeDto } from './dto/create-service-type.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { UpdateServiceTypeDto } from './dto/update-service-type.dto';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  getPublicServices() {
    return this.servicesService.getPublicServices();
  }

  @Get('types')
  @HttpCode(HttpStatus.OK)
  getPublicServiceTypes() {
    return this.servicesService.getPublicServiceTypes();
  }

  @Get('admin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  getAdminServices() {
    return this.servicesService.getAdminServices();
  }

  @Get('types/admin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  getAdminServiceTypes() {
    return this.servicesService.getAdminServiceTypes();
  }

  @Get('admin/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  getAdminServiceById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.servicesService.getAdminServiceById(id);
  }

  @Post('admin')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AdminJwtGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  createService(
    @Body() dto: CreateServiceDto,
    @UploadedFile() imageFile?: Express.Multer.File,
  ) {
    if (!imageFile) {
      throw new BadRequestException('Image file is required.');
    }

    if (!imageFile.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed.');
    }

    return this.servicesService.createService(dto, imageFile);
  }

  @Post('types/admin')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AdminJwtGuard)
  createServiceType(@Body() dto: CreateServiceTypeDto) {
    return this.servicesService.createServiceType(dto);
  }

  @Patch('admin/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  updateService(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateServiceDto,
    @UploadedFile() imageFile?: Express.Multer.File,
  ) {
    if (imageFile && !imageFile.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed.');
    }

    const hasBodyFields = Object.keys(dto).length > 0;
    if (!hasBodyFields && !imageFile) {
      throw new BadRequestException('Provide at least one field or image to update.');
    }

    return this.servicesService.updateService(id, dto, imageFile);
  }

  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  deleteService(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.servicesService.deleteService(id);
  }

  @Patch('types/admin/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  updateServiceType(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateServiceTypeDto,
  ) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Provide at least one field to update.');
    }
    return this.servicesService.updateServiceType(id, dto);
  }

  @Delete('types/admin/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  deleteServiceType(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.servicesService.deleteServiceType(id);
  }
}
