import { BadRequestException } from '@nestjs/common';
import { imageSize } from 'image-size';
import {
  HEADER_HERO_MIN_IMAGE_HEIGHT,
  HEADER_HERO_MIN_IMAGE_WIDTH,
} from '../constants/header-media.constants';

export function validateHeroImageDimensions(file: Express.Multer.File) {
  const dimensions = imageSize(file.buffer);
  const width = dimensions.width ?? 0;
  const height = dimensions.height ?? 0;
  if (
    width < HEADER_HERO_MIN_IMAGE_WIDTH ||
    height < HEADER_HERO_MIN_IMAGE_HEIGHT
  ) {
    throw new BadRequestException(
      `Image "${file.originalname}" is too small (${width}x${height}). Minimum recommended size is ${HEADER_HERO_MIN_IMAGE_WIDTH}x${HEADER_HERO_MIN_IMAGE_HEIGHT}.`,
    );
  }
}
