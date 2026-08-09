import type { Prisma, Service, ServiceType } from '@prisma/client';

export type ServiceTypeRow = ServiceType;

export type ServiceWithType = Service & {
  serviceType: ServiceType;
};

export type ServiceWithTypeAndCounts = ServiceWithType & {
  _count: {
    bookings: number;
    galleryPhotos: number;
  };
};

export type ServiceTypeWithCounts = ServiceType & {
  _count: {
    services: number;
    galleryPhotos: number;
  };
};

export type ServiceCreateData = {
  serviceTypeId: string;
  description: string;
  items: string[];
  price?: number | null;
  imageUrl: string;
};

export type ServiceUpdateData = {
  serviceTypeId?: string;
  description?: string;
  items?: string[];
  price?: number | null;
  isActive?: boolean;
  imageUrl?: string | null;
};

export type CatalogHeroUrls = {
  imageUrl: string | null;
  heroMediaType: 'IMAGE' | 'VIDEO' | undefined;
  heroPosterUrl: string | null;
  heroPosterUrlMobile: string | null;
};

export type MappedServiceType = {
  id: string;
  name: string;
  contactInquiryCode: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type MappedService = {
  id: string;
  serviceTypeId: string;
  serviceTypeName: string;
  contactInquiryCode: string | null;
  serviceType: MappedServiceType;
  description: string;
  items: string[];
  price: number | null;
  imageUrl: string | null;
  heroMediaType: 'IMAGE' | 'VIDEO' | undefined;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type MappedPublicService = MappedService & {
  heroPosterUrl: string | null;
  heroPosterUrlMobile: string | null;
};

export type CatalogSnippet = {
  kind: 'service';
  id: string;
  title: string;
  description: string;
  descriptionPreview: string | undefined;
  items: string[];
  imageUrl: string | null;
  heroMediaType: 'IMAGE' | 'VIDEO' | undefined;
  heroPosterUrl: string | null;
  heroPosterUrlMobile: string | null;
  contactInquiryCode: string | null;
};

export type ServiceTypeSelectIdActive = Prisma.ServiceTypeGetPayload<{
  select: { id: true; isActive: true };
}>;

export type ServiceImageSelect = Prisma.ServiceGetPayload<{
  select: { id: true; imageUrl: true };
}>;
