import {
  imageUrl as toDeliveryImageUrl,
  videoUrl as toDeliveryVideoUrl,
} from '../../../common/util/cloudinary-delivery.util';
import type {
  CatalogHeroUrls,
  CatalogSnippet,
  MappedPublicService,
  MappedService,
  MappedServiceType,
  ServiceWithType,
} from '../types/services.types';

export function catalogHeroMediaType(
  imageUrl: string | null | undefined,
): 'IMAGE' | 'VIDEO' | undefined {
  if (!imageUrl) return undefined;
  const lower = imageUrl.trim().toLowerCase();
  if (
    lower.includes('/video/upload/') ||
    /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(lower)
  ) {
    return 'VIDEO';
  }
  return 'IMAGE';
}

export function deliverCatalogHeroUrls(
  imageUrl: string | null,
): CatalogHeroUrls {
  if (!imageUrl) {
    return {
      imageUrl: null,
      heroMediaType: undefined,
      heroPosterUrl: null,
      heroPosterUrlMobile: null,
    };
  }
  const heroMediaType = catalogHeroMediaType(imageUrl);
  if (heroMediaType === 'VIDEO') {
    return {
      imageUrl: toDeliveryVideoUrl(imageUrl, 'stream720') ?? imageUrl,
      heroMediaType: 'VIDEO',
      heroPosterUrl: toDeliveryVideoUrl(imageUrl, 'poster720'),
      heroPosterUrlMobile: toDeliveryVideoUrl(imageUrl, 'poster480'),
    };
  }
  return {
    imageUrl: toDeliveryImageUrl(imageUrl, 'card') ?? imageUrl,
    heroMediaType: 'IMAGE',
    heroPosterUrl: null,
    heroPosterUrlMobile: null,
  };
}

export function mapServiceType(serviceType: {
  id: string;
  name: string;
  contactInquiryCode: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): MappedServiceType {
  return {
    id: serviceType.id,
    name: serviceType.name,
    contactInquiryCode: serviceType.contactInquiryCode,
    isActive: serviceType.isActive,
    createdAt: serviceType.createdAt,
    updatedAt: serviceType.updatedAt,
  };
}

export function mapService(service: ServiceWithType): MappedService {
  return {
    id: service.id,
    serviceTypeId: service.serviceType.id,
    serviceTypeName: service.serviceType.name,
    contactInquiryCode: service.serviceType.contactInquiryCode,
    serviceType: mapServiceType(service.serviceType),
    description: service.description,
    items: service.items,
    price: service.price != null ? Number(service.price) : null,
    imageUrl: service.imageUrl,
    heroMediaType: catalogHeroMediaType(service.imageUrl),
    isActive: service.isActive,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
}

export function mapPublicService(
  service: ServiceWithType,
): MappedPublicService {
  const mapped = mapService(service);
  const hero = deliverCatalogHeroUrls(mapped.imageUrl);
  return {
    ...mapped,
    imageUrl: hero.imageUrl,
    heroMediaType: hero.heroMediaType ?? mapped.heroMediaType,
    heroPosterUrl: hero.heroPosterUrl,
    heroPosterUrlMobile: hero.heroPosterUrlMobile,
  };
}

export function mapCatalogSnippet(service: ServiceWithType): CatalogSnippet {
  const preview = service.description.replace(/\s+/g, ' ').trim().slice(0, 280);
  const hero = deliverCatalogHeroUrls(service.imageUrl);
  return {
    kind: 'service',
    id: service.id,
    title: service.serviceType.name.trim(),
    description: service.description,
    descriptionPreview: preview || undefined,
    items: service.items,
    imageUrl: hero.imageUrl,
    heroMediaType: hero.heroMediaType,
    heroPosterUrl: hero.heroPosterUrl,
    heroPosterUrlMobile: hero.heroPosterUrlMobile,
    contactInquiryCode: service.serviceType.contactInquiryCode ?? null,
  };
}
