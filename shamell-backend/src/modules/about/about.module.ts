import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminJwtGuard } from '../contact/guards/admin-jwt.guard';
import { AboutController } from './about.controller';
import { AboutService } from './about.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me-in-production',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as never,
      },
    }),
  ],
  controllers: [AboutController],
  providers: [AboutService, AdminJwtGuard],
})
export class AboutModule {}
