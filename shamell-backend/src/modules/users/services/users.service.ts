import { ConflictException, Injectable } from '@nestjs/common';
import { hashPassword } from '../../auth/utils/auth-crypto.util';
import { CreateUserDto } from '../dto/create-user.dto';
import type { RegisterUserResult } from '../types/users.types';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  async register(dto: CreateUserDto): Promise<RegisterUserResult> {
    const email = dto.email.toLowerCase();
    const existingUser = await this.repository.findIdByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const password = await hashPassword(dto.password);
    const user = await this.repository.createRegisteredUser({
      fullName: dto.fullName,
      email,
      phone: dto.phone,
      password,
    });

    return {
      message: 'User registered successfully',
      user,
    };
  }
}
