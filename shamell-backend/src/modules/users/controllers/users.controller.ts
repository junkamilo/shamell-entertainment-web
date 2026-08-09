import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  PUBLIC_REGISTRATION_DISABLED_MESSAGE,
  USERS_CONTROLLER_PATH,
} from '../constants/users.constants';
import { CreateUserDto } from '../dto/create-user.dto';

@Controller(USERS_CONTROLLER_PATH)
export class UsersController {
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: CreateUserDto) {
    void dto;
    throw new ForbiddenException(PUBLIC_REGISTRATION_DISABLED_MESSAGE);
  }
}
