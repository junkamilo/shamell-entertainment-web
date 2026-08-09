import { Controller } from '@nestjs/common';
import { PERFORMERS_CONTROLLER_PATH } from '../constants/performers.constants';

@Controller(PERFORMERS_CONTROLLER_PATH)
export class PerformersController {}
