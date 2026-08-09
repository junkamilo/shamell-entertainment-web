import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { makeCreateUserDto } from '../__mocks__/users.fixtures';
import {
  PUBLIC_REGISTRATION_DISABLED_MESSAGE,
  USERS_CONTROLLER_PATH,
} from '../constants/users.constants';
import { UsersController } from './users.controller';

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
    }).compile();
    controller = moduleRef.get(UsersController);
  });

  it('uses the users controller path constant', () => {
    expect(Reflect.getMetadata('path', UsersController)).toBe(
      USERS_CONTROLLER_PATH,
    );
  });

  it('register throws ForbiddenException', () => {
    expect(() => controller.register(makeCreateUserDto())).toThrow(
      ForbiddenException,
    );
    expect(() => controller.register(makeCreateUserDto())).toThrow(
      PUBLIC_REGISTRATION_DISABLED_MESSAGE,
    );
  });
});
