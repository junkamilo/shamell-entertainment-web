import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminJwtGuard } from '../contact/guards/admin-jwt.guard';
import { GalleryModule } from '../gallery/gallery.module';
import { HeaderMediaController } from './header-media.controller';
import { HeaderMediaService } from './header-media.service';
import { HeaderTextController } from './header-text/header-text.controller';
import { HeaderTextService } from './header-text/header-text.service';

@Module({
  imports: [
    PrismaModule,
    GalleryModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me-in-production',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as never,
      },
    }),
  ],
  controllers: [HeaderMediaController, HeaderTextController],
  providers: [HeaderMediaService, HeaderTextService, AdminJwtGuard],
  exports: [HeaderMediaService, HeaderTextService],
})
export class HeaderMediaModule {}
