import { EventTypeOccasionUsage, GalleryMediaType } from '@prisma/client';
import {
  type ImagePreset,
  type VideoVariant,
  mediaDeliveryUrl,
  videoUrl as toDeliveryVideoUrl,
} from '../../../common/util/cloudinary-delivery.util';
import type {
  CatalogHeroFields,
  ContactLineFromEventTypeInput,
  ContactLineMapInput,
  EventMapInput,
  EventTypeAdminMapInput,
  EventTypeMapInput,
  MappedContactLine,
  MappedEvent,
  MappedEventType,
  MappedEventTypeAdmin,
  OccasionGroups,
  OccasionLinkRow,
} from '../types/events.types';

/** Cloudinary videos and common extensions → VIDEO even if DB `mediaType` is stale. */
export function effectiveGalleryMediaType(
  imageUrl: string | null | undefined,
  mediaType?: GalleryMediaType | null,
): GalleryMediaType {
  const u = typeof imageUrl === 'string' ? imageUrl.trim() : '';
  if (u) {
    const lower = u.toLowerCase();
    if (
      lower.includes('/video/upload/') ||
      /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(lower)
    ) {
      return GalleryMediaType.VIDEO;
    }
  }
  return mediaType ?? GalleryMediaType.IMAGE;
}

/** Optimized delivery URL for a gallery row, branching image vs video. */
export function deliverGalleryUrl(
  url: string | null | undefined,
  mediaType: GalleryMediaType | null | undefined,
  imagePreset: ImagePreset,
  videoVariant: VideoVariant = 'stream720',
): string | null {
  if (!url?.trim()) return null;
  const isVideo =
    effectiveGalleryMediaType(url, mediaType) === GalleryMediaType.VIDEO;
  return mediaDeliveryUrl(url, isVideo, imagePreset, videoVariant) ?? url;
}

/** Catalog hero: stream/image URL + poster pair for video cards. */
export function mapCatalogHeroFields(
  rawUrl: string | null | undefined,
  mediaType: GalleryMediaType | null | undefined,
): CatalogHeroFields {
  if (!rawUrl?.trim()) {
    return {
      heroImageUrl: null,
      heroMediaType: null,
      heroPosterUrl: null,
      heroPosterUrlMobile: null,
    };
  }
  const heroMediaType = effectiveGalleryMediaType(rawUrl, mediaType);
  const isVideo = heroMediaType === GalleryMediaType.VIDEO;
  return {
    heroImageUrl: deliverGalleryUrl(rawUrl, mediaType, 'card'),
    heroMediaType,
    heroPosterUrl: isVideo ? toDeliveryVideoUrl(rawUrl, 'poster720') : null,
    heroPosterUrlMobile: isVideo
      ? toDeliveryVideoUrl(rawUrl, 'poster480')
      : null,
  };
}

export function mapOccasionGroups(links: OccasionLinkRow[]): OccasionGroups {
  const occasionSingle: OccasionGroups['occasionSingle'] = [];
  const occasionBespokeProject: OccasionGroups['occasionBespokeProject'] = [];
  const occasionBespokeRole: OccasionGroups['occasionBespokeRole'] = [];
  const sorted = [...links].sort((a, b) => {
    if (a.usage !== b.usage) return a.usage.localeCompare(b.usage);
    return a.sortOrder - b.sortOrder;
  });
  for (const L of sorted) {
    const row = { id: L.occasionType.id, name: L.occasionType.name };
    if (L.usage === EventTypeOccasionUsage.OCCASION_SINGLE)
      occasionSingle.push(row);
    else if (L.usage === EventTypeOccasionUsage.BESPOKE_PROJECT)
      occasionBespokeProject.push(row);
    else if (L.usage === EventTypeOccasionUsage.BESPOKE_ROLE)
      occasionBespokeRole.push(row);
  }
  return { occasionSingle, occasionBespokeProject, occasionBespokeRole };
}

export function mapEventType(item: EventTypeMapInput): MappedEventType {
  return {
    id: item.id,
    name: item.name,
    ...(item.catalogChannel != null
      ? { catalogChannel: item.catalogChannel }
      : {}),
    contactInquiryCode: item.contactInquiryCode,
    isActive: item.isActive,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export function mapEventTypeAdmin(
  item: EventTypeAdminMapInput,
): MappedEventTypeAdmin {
  const base = mapEventType(item);
  const groups = mapOccasionGroups(item.occasionLinks);
  return {
    ...base,
    occasionAssignments: item.occasionLinks.map((L) => ({
      occasionTypeId: L.occasionType.id,
      occasionName: L.occasionType.name,
      occasionActive: L.occasionType.isActive,
      usage: L.usage,
      sortOrder: L.sortOrder,
    })),
    ...groups,
  };
}

export function mapContactLine(item: ContactLineMapInput): MappedContactLine {
  const groups = mapOccasionGroups(item.eventType.occasionLinks);
  const photos = item.galleryPhotos ?? [];
  const first = photos[0];
  const hero = mapCatalogHeroFields(first?.imageUrl, first?.mediaType);
  return {
    id: item.id,
    eventTypeId: item.eventType.id,
    eventTypeName: item.eventType.name,
    contactInquiryCode: item.eventType.contactInquiryCode,
    description: item.description,
    items: item.items,
    images: photos
      .filter((p) => p.mediaType === GalleryMediaType.IMAGE)
      .map((p) => deliverGalleryUrl(p.imageUrl, p.mediaType, 'card')),
    ...hero,
    showOnHome: item.showOnHome,
    publicSection: item.publicSection,
    lineKind: 'event',
    price: item.price != null ? Number(item.price) : null,
    ...groups,
  };
}

/** Catalog line when only EventType exists (no Event row yet). */
export function mapContactLineFromEventType(
  item: ContactLineFromEventTypeInput,
): MappedContactLine {
  const groups = mapOccasionGroups(item.occasionLinks);
  return {
    id: item.id,
    eventTypeId: item.id,
    eventTypeName: item.name,
    contactInquiryCode: item.contactInquiryCode,
    description: '',
    items: [],
    images: [],
    heroImageUrl: null,
    heroMediaType: null,
    lineKind: 'event_type',
    price: null,
    ...groups,
  };
}

export function mapEvent(item: EventMapInput): MappedEvent {
  const rows = item.galleryPhotos ?? [];
  const imageRows = rows.filter(
    (p) => !('mediaType' in p) || p.mediaType === GalleryMediaType.IMAGE,
  );
  const catalogImages = rows.filter(
    (p): p is { id: string; imageUrl: string; mediaType: GalleryMediaType } =>
      'id' in p &&
      typeof (p as { id: unknown }).id === 'string' &&
      'mediaType' in p,
  );
  const first = rows[0];
  const firstMediaType =
    first && 'mediaType' in first && first.mediaType ? first.mediaType : null;
  const hero = mapCatalogHeroFields(first?.imageUrl, firstMediaType);

  return {
    id: item.id,
    eventTypeId: item.eventType.id,
    eventTypeName: item.eventType.name,
    contactInquiryCode: item.eventType.contactInquiryCode,
    eventType: mapEventType(item.eventType),
    description: item.description,
    items: item.items,
    price: item.price != null ? Number(item.price) : null,
    images: imageRows.map(
      (p) =>
        deliverGalleryUrl(
          p.imageUrl,
          'mediaType' in p ? p.mediaType : null,
          'card',
        ) ?? p.imageUrl,
    ),
    ...hero,
    catalogImages: catalogImages.map((p) => ({
      id: p.id,
      imageUrl:
        deliverGalleryUrl(p.imageUrl, p.mediaType, 'galleryThumb') ??
        p.imageUrl,
      mediaType: p.mediaType,
    })),
    isActive: item.isActive,
    showOnHome: item.showOnHome,
    publicSection: item.publicSection,
    slug: item.slug ?? null,
    experienceType: item.experienceType ?? null,
    classVariant: item.classVariant ?? null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}
