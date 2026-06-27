import { Controller, Get, Header } from '@nestjs/common';
import { HomeService } from './home.service';

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('above-fold')
  @Header('Cache-Control', 'public, s-maxage=180, stale-while-revalidate=600')
  async getAboveFold() {
    return this.homeService.getAboveFoldData();
  }
}
