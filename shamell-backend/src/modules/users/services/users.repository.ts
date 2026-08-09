import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { RegisteredUserView } from '../types/users.types';

const registeredUserSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findIdByEmail(email: string): Promise<{ id: string } | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
  }

  createRegisteredUser(data: {
    fullName: string;
    email: string;
    phone?: string | null;
    password: string;
  }): Promise<RegisteredUserView> {
    return this.prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password,
      },
      select: registeredUserSelect,
    });
  }
}
