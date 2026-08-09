import { Controller, Get, Header } from '@nestjs/common';
import { HOME_ABOVE_FOLD_CACHE_CONTROL } from '../constants/home.constants';
import { HomeService } from '../services/home.service';

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('above-fold')
  @Header('Cache-Control', HOME_ABOVE_FOLD_CACHE_CONTROL)
  async getAboveFold() {
    return this.homeService.getAboveFoldData();
  }
}
