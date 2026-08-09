import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { BootstrapAdminUserSelect } from '../types/auth.types';

const bootstrapUserSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findStaffAdminId(): Promise<{ id: string } | null> {
    return this.prisma.user.findFirst({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
      select: { id: true },
    });
  }

  findUserIdByEmail(email: string): Promise<{ id: string } | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
  }

  findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  findUserRoleById(id: string): Promise<{ id: string; role: string } | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });
  }

  createSuperAdmin(data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<BootstrapAdminUserSelect> {
    return this.prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        phone: data.phone,
        role: 'SUPER_ADMIN',
      },
      select: bootstrapUserSelect,
    });
  }

  bindGoogleSub(userId: string, googleSub: string): Promise<unknown> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { googleSub },
    });
  }

  deletePendingInvitesByEmail(email: string): Promise<Prisma.BatchPayload> {
    return this.prisma.adminInvite.deleteMany({
      where: { email, consumedAt: null },
    });
  }

  createAdminInvite(data: {
    email: string;
    codeHash: string;
    fullName: string;
    invitedById: string;
    expiresAt: Date;
  }): Promise<{ id: string }> {
    return this.prisma.adminInvite.create({
      data,
      select: { id: true },
    });
  }

  deleteInviteById(id: string): Promise<unknown> {
    return this.prisma.adminInvite.delete({ where: { id } });
  }

  findValidInviteByEmail(email: string) {
    return this.prisma.adminInvite.findFirst({
      where: {
        email,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  consumeInviteAndCreateAdmin(params: {
    inviteId: string;
    email: string;
    fullName: string;
    passwordHash: string;
  }): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          email: params.email,
          fullName: params.fullName,
          password: params.passwordHash,
          role: 'ADMIN',
        },
      });
      const consumed = await tx.adminInvite.updateMany({
        where: { id: params.inviteId, consumedAt: null },
        data: { consumedAt: new Date() },
      });
      if (consumed.count !== 1) {
        throw new Error('INVITE_ALREADY_USED');
      }
    });
  }

  setPasswordResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<unknown> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetToken: tokenHash,
        passwordResetExpiresAt: expiresAt,
      },
    });
  }

  findUserByValidResetToken(tokenHash: string): Promise<{ id: string } | null> {
    return this.prisma.user.findFirst({
      where: {
        passwordResetToken: tokenHash,
        passwordResetExpiresAt: {
          gt: new Date(),
        },
      },
      select: { id: true },
    });
  }

  updatePasswordAndClearReset(
    userId: string,
    passwordHash: string,
  ): Promise<unknown> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        password: passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });
  }
}
