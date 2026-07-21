import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { GalleryModule } from '../gallery/gallery.module';
import { HeaderMediaController } from './header-media.controller';
import { HeaderMediaService } from './header-media.service';
import { HeaderTextController } from './header-text/header-text.controller';
import { HeaderTextService } from './header-text/header-text.service';

@Module({
  imports: [PrismaModule, GalleryModule],
  controllers: [HeaderMediaController, HeaderTextController],
  providers: [HeaderMediaService, HeaderTextService],
  exports: [HeaderMediaService, HeaderTextService],
})
export class HeaderMediaModule {}
