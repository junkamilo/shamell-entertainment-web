import { Module } from '@nestjs/common';
import { AboutModule } from '../about/about.module';
import { HeaderMediaModule } from '../header-media/header-media.module';
import { VenueLayoutSettingsModule } from '../venue-layout-settings/venue-layout-settings.module';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';

@Module({
  imports: [AboutModule, HeaderMediaModule, VenueLayoutSettingsModule],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
