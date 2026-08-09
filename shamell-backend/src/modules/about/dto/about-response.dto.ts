import type { AboutHeroMediaType } from '../types/about.types';

/** Admin / internal mapped about payload (raw imageUrl). */
export type AboutContentResponseDto = {
  id: string;
  title: string;
  paragraph1: string;
  coreValues: string[];
  imageUrl: string | null;
  heroMediaType: AboutHeroMediaType;
  videoDeliveryUrl: string | null | undefined;
  videoPosterUrl: string | null | undefined;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/** Public mapped about payload (delivery-optimized media URLs). */
export type PublicAboutContentResponseDto = AboutContentResponseDto;
