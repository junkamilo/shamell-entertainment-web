import {
  makeServiceType,
  makeServiceWithType,
} from '../__mocks__/services.fixtures';
import {
  catalogHeroMediaType,
  deliverCatalogHeroUrls,
  mapCatalogSnippet,
  mapPublicService,
  mapService,
  mapServiceType,
} from './services-mapper.util';

describe('services-mapper.util', () => {
  it('detects image vs video hero media type', () => {
    expect(
      catalogHeroMediaType(
        'https://res.cloudinary.com/demo/image/upload/v1/x.jpg',
      ),
    ).toBe('IMAGE');
    expect(
      catalogHeroMediaType(
        'https://res.cloudinary.com/demo/video/upload/v1/x.mp4',
      ),
    ).toBe('VIDEO');
    expect(catalogHeroMediaType(null)).toBeUndefined();
  });

  it('maps service type and service', () => {
    const type = makeServiceType();
    expect(mapServiceType(type)).toEqual({
      id: type.id,
      name: type.name,
      contactInquiryCode: type.contactInquiryCode,
      isActive: type.isActive,
      createdAt: type.createdAt,
      updatedAt: type.updatedAt,
    });

    const mapped = mapService(makeServiceWithType());
    expect(mapped.serviceTypeId).toBe('stype-1');
    expect(mapped.serviceTypeName).toBe('VIP Event');
    expect(mapped.price).toBe(1500);
    expect(mapped.heroMediaType).toBe('IMAGE');
  });

  it('maps public service with delivery hero fields', () => {
    const mapped = mapPublicService(makeServiceWithType());
    expect(mapped.heroMediaType).toBe('IMAGE');
    expect(mapped.heroPosterUrl).toBeNull();
    expect(mapped.imageUrl).toBeTruthy();
  });

  it('maps catalog snippet', () => {
    const snippet = mapCatalogSnippet(makeServiceWithType());
    expect(snippet.kind).toBe('service');
    expect(snippet.title).toBe('VIP Event');
    expect(snippet.contactInquiryCode).toBe('VIP_EVENT');
    expect(snippet.descriptionPreview).toBeDefined();
  });

  it('deliverCatalogHeroUrls returns empty for null', () => {
    expect(deliverCatalogHeroUrls(null)).toEqual({
      imageUrl: null,
      heroMediaType: undefined,
      heroPosterUrl: null,
      heroPosterUrlMobile: null,
    });
  });
});
