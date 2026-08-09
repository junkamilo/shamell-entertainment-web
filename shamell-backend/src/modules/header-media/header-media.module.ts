import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { GalleryModule } from '../gallery/gallery.module';
import { HeaderMediaController } from './controllers/header-media.controller';
import { HeaderTextController } from './controllers/header-text.controller';
import { HeaderMediaRepository } from './services/header-media.repository';
import { HeaderMediaService } from './services/header-media.service';
import { HeaderTextRepository } from './services/header-text.repository';
import { HeaderTextService } from './services/header-text.service';

@Module({
  imports: [PrismaModule, GalleryModule],
  controllers: [HeaderMediaController, HeaderTextController],
  providers: [
    HeaderMediaRepository,
    HeaderTextRepository,
    HeaderMediaService,
    HeaderTextService,
  ],
  exports: [HeaderMediaService, HeaderTextService],
})
export class HeaderMediaModule {}
