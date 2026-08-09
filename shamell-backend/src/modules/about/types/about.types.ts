export type AboutHeroMediaType = 'IMAGE' | 'VIDEO';

/** Prisma-shaped about_content row used by mappers/repository. */
export type AboutContentRow = {
  id: string;
  title: string;
  paragraph1: string;
  coreValues: string[];
  imageUrl: string | null;
  imagePublicId?: string | null;
  videoDeliveryUrl?: string | null;
  videoPosterUrl?: string | null;
  heroMediaType?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type AboutHeroUploadResult = {
  secureUrl: string;
  publicId: string;
  mediaType: AboutHeroMediaType;
  videoDeliveryUrl: string | null;
  videoPosterUrl: string | null;
};
