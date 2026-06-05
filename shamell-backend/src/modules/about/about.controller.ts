import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { tmpdir } from 'os';
import { AdminJwtGuard } from '../contact/guards/admin-jwt.guard';
import { UpsertAboutContentDto } from './dto/upsert-about-content.dto';
import { AboutService } from './about.service';

@Controller('about')
export class AboutController {
  constructor(private readonly aboutService: AboutService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
  getPublicAboutContent() {
    return this.aboutService.getPublicAboutContent();
  }

  @Get('admin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  getAdminAboutContent() {
    return this.aboutService.getAdminAboutContent();
  }

  @Patch('admin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  @UseInterceptors(
    FileInterceptor('media', {
      storage: diskStorage({
        destination: tmpdir(),
        filename: (_req, file, cb) => {
          const ext =
            extname(file.originalname) ||
            (file.mimetype.startsWith('video/') ? '.mp4' : '.jpg');
          cb(null, `shamell-about-${randomUUID()}${ext}`);
        },
      }),
    }),
  )
  upsertAdminAboutContent(
    @Body() dto: UpsertAboutContentDto,
    @UploadedFile() mediaFile?: Express.Multer.File,
  ) {
    const hasBodyFields = Object.keys(dto).length > 0;
    if (!hasBodyFields && !mediaFile) {
      throw new BadRequestException(
        'Provide at least one field or media file (image/video) to update.',
      );
    }
    return this.aboutService.upsertAdminAboutContent(dto, mediaFile);
  }

  @Delete('admin/media')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  deleteAdminAboutHeroMedia() {
    return this.aboutService.deleteAdminAboutHeroMedia();
  }
}
