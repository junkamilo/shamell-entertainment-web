import { BadRequestException } from '@nestjs/common';
import { makeMulterFile } from '../__mocks__/header-media.fixtures';
import { validateHeroImageDimensions } from './header-hero-image.util';

jest.mock('image-size', () => ({
  imageSize: jest.fn(),
}));

import { imageSize } from 'image-size';

describe('header-hero-image.util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('accepts images at or above 1200x1200', () => {
    (imageSize as jest.Mock).mockReturnValue({ width: 1200, height: 1200 });
    expect(() => validateHeroImageDimensions(makeMulterFile())).not.toThrow();
  });

  it('rejects undersized images', () => {
    (imageSize as jest.Mock).mockReturnValue({ width: 800, height: 600 });
    expect(() =>
      validateHeroImageDimensions(
        makeMulterFile({ originalname: 'small.jpg' }),
      ),
    ).toThrow(BadRequestException);
  });
});
