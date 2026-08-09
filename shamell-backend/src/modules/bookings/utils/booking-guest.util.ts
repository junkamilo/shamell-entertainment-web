import { BadRequestException } from '@nestjs/common';

export function validateGuestVsUser(dto: {
  userId?: string;
  guestFullName?: string;
  guestEmail?: string;
  guestPhone?: string;
}): void {
  if (dto.userId) {
    if (dto.guestFullName || dto.guestEmail || dto.guestPhone) {
      throw new BadRequestException(
        'Do not send guest fields when userId is set.',
      );
    }
    return;
  }
  if (
    !dto.guestFullName?.trim() ||
    !dto.guestEmail?.trim() ||
    !dto.guestPhone?.trim()
  ) {
    throw new BadRequestException(
      'guestFullName, guestEmail and guestPhone are required without userId.',
    );
  }
}
