/**
 * Lightweight PrismaService mock factory for unit tests.
 * Extend per-module with additional model keys as needed.
 */
export type PrismaDelegateMock = {
  findFirst: jest.Mock;
  findUnique: jest.Mock;
  findMany: jest.Mock;
  create: jest.Mock;
  createMany: jest.Mock;
  update: jest.Mock;
  updateMany: jest.Mock;
  upsert: jest.Mock;
  delete: jest.Mock;
  deleteMany: jest.Mock;
  count: jest.Mock;
  aggregate: jest.Mock;
};

export type PrismaAboutContentDelegate = {
  findFirst: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
};

export type PrismaMock = {
  aboutContent: PrismaAboutContentDelegate;
  bookingPayment: PrismaDelegateMock;
  booking: PrismaDelegateMock;
  bookingQuote: PrismaDelegateMock;
  bookingService: PrismaDelegateMock;
  contactRequest: PrismaDelegateMock;
  venueSeatReservation: PrismaDelegateMock;
  upcomingClassEnrollment: PrismaDelegateMock;
  upcomingClassPackageEnrollment: PrismaDelegateMock;
  upcomingClassPackageEnrollmentItem: PrismaDelegateMock;
  upcomingFixedEventEnrollment: PrismaDelegateMock;
  upcomingVenueConfig: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    upsert: jest.Mock;
    delete: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
    count: jest.Mock;
  };
  stripeWebhookEvent: PrismaDelegateMock;
  service: PrismaDelegateMock;
  eventType: PrismaDelegateMock;
  occasionType: PrismaDelegateMock;
  eventTypeOccasion: PrismaDelegateMock;
  galleryPhoto: PrismaDelegateMock;
  galleryCategory: PrismaDelegateMock;
  serviceType: PrismaDelegateMock;
  heroHeaderContent: PrismaDelegateMock;
  reservationEventTemplate: PrismaDelegateMock;
  reservationEventWeekday: PrismaDelegateMock;
  reservationEventClassSection: PrismaDelegateMock;
  upcomingClassSession: PrismaDelegateMock & { groupBy: jest.Mock };
  user: PrismaDelegateMock;
  adminInvite: PrismaDelegateMock;
  weeklyAvailabilitySlot: PrismaDelegateMock;
  availabilityClosure: PrismaDelegateMock;
  event: PrismaDelegateMock;
  venueFloorLayout: PrismaDelegateMock;
  venueLayoutClientSettings: PrismaDelegateMock;
  venueTableConfig: PrismaDelegateMock;
  venueStandaloneChair: PrismaDelegateMock;
  venueStandaloneChairConfig: PrismaDelegateMock;
  $queryRaw: jest.Mock;
  $transaction: jest.Mock;
};

function createDelegate(
  overrides?: Partial<PrismaDelegateMock>,
): PrismaDelegateMock {
  return {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    ...overrides,
  };
}

export function createPrismaMock(
  overrides?: Partial<{
    aboutContent: Partial<PrismaAboutContentDelegate>;
    bookingPayment: Partial<PrismaDelegateMock>;
    booking: Partial<PrismaDelegateMock>;
    bookingQuote: Partial<PrismaDelegateMock>;
    bookingService: Partial<PrismaDelegateMock>;
    contactRequest: Partial<PrismaDelegateMock>;
    venueSeatReservation: Partial<PrismaDelegateMock>;
    upcomingClassEnrollment: Partial<PrismaDelegateMock>;
    upcomingClassPackageEnrollment: Partial<PrismaDelegateMock>;
    upcomingClassPackageEnrollmentItem: Partial<PrismaDelegateMock>;
    upcomingFixedEventEnrollment: Partial<PrismaDelegateMock>;
    upcomingVenueConfig: Partial<{
      findUnique: jest.Mock;
      findMany: jest.Mock;
      upsert: jest.Mock;
      delete: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      count: jest.Mock;
    }>;
    stripeWebhookEvent: Partial<PrismaDelegateMock>;
    service: Partial<PrismaDelegateMock>;
    eventType: Partial<PrismaDelegateMock>;
    occasionType: Partial<PrismaDelegateMock>;
    eventTypeOccasion: Partial<PrismaDelegateMock>;
    galleryPhoto: Partial<PrismaDelegateMock>;
    galleryCategory: Partial<PrismaDelegateMock>;
    serviceType: Partial<PrismaDelegateMock>;
    heroHeaderContent: Partial<PrismaDelegateMock>;
    reservationEventTemplate: Partial<PrismaDelegateMock>;
    reservationEventWeekday: Partial<PrismaDelegateMock>;
    reservationEventClassSection: Partial<PrismaDelegateMock>;
    upcomingClassSession: Partial<PrismaDelegateMock & { groupBy: jest.Mock }>;
    user: Partial<PrismaDelegateMock>;
    adminInvite: Partial<PrismaDelegateMock>;
    weeklyAvailabilitySlot: Partial<PrismaDelegateMock>;
    availabilityClosure: Partial<PrismaDelegateMock>;
    event: Partial<PrismaDelegateMock>;
    venueFloorLayout: Partial<PrismaDelegateMock>;
    venueLayoutClientSettings: Partial<PrismaDelegateMock>;
    venueTableConfig: Partial<PrismaDelegateMock>;
    venueStandaloneChair: Partial<PrismaDelegateMock>;
    venueStandaloneChairConfig: Partial<PrismaDelegateMock>;
    $queryRaw: jest.Mock;
    $transaction: jest.Mock;
  }>,
): PrismaMock {
  return {
    aboutContent: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      ...overrides?.aboutContent,
    },
    bookingPayment: createDelegate(overrides?.bookingPayment),
    booking: createDelegate(overrides?.booking),
    bookingQuote: createDelegate(overrides?.bookingQuote),
    bookingService: createDelegate(overrides?.bookingService),
    contactRequest: createDelegate(overrides?.contactRequest),
    venueSeatReservation: createDelegate(overrides?.venueSeatReservation),
    upcomingClassEnrollment: createDelegate(overrides?.upcomingClassEnrollment),
    upcomingClassPackageEnrollment: createDelegate(
      overrides?.upcomingClassPackageEnrollment,
    ),
    upcomingClassPackageEnrollmentItem: createDelegate(
      overrides?.upcomingClassPackageEnrollmentItem,
    ),
    upcomingFixedEventEnrollment: createDelegate(
      overrides?.upcomingFixedEventEnrollment,
    ),
    upcomingVenueConfig: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
      ...overrides?.upcomingVenueConfig,
    },
    stripeWebhookEvent: createDelegate(overrides?.stripeWebhookEvent),
    service: createDelegate(overrides?.service),
    eventType: createDelegate(overrides?.eventType),
    occasionType: createDelegate(overrides?.occasionType),
    eventTypeOccasion: createDelegate(overrides?.eventTypeOccasion),
    galleryPhoto: createDelegate(overrides?.galleryPhoto),
    galleryCategory: createDelegate(overrides?.galleryCategory),
    serviceType: createDelegate(overrides?.serviceType),
    heroHeaderContent: createDelegate(overrides?.heroHeaderContent),
    reservationEventTemplate: createDelegate(
      overrides?.reservationEventTemplate,
    ),
    reservationEventWeekday: createDelegate(overrides?.reservationEventWeekday),
    reservationEventClassSection: createDelegate(
      overrides?.reservationEventClassSection,
    ),
    upcomingClassSession: {
      ...createDelegate(overrides?.upcomingClassSession),
      groupBy: overrides?.upcomingClassSession?.groupBy ?? jest.fn(),
    },
    user: createDelegate(overrides?.user),
    adminInvite: createDelegate(overrides?.adminInvite),
    weeklyAvailabilitySlot: createDelegate(overrides?.weeklyAvailabilitySlot),
    availabilityClosure: createDelegate(overrides?.availabilityClosure),
    event: createDelegate(overrides?.event),
    venueFloorLayout: createDelegate(overrides?.venueFloorLayout),
    venueLayoutClientSettings: createDelegate(
      overrides?.venueLayoutClientSettings,
    ),
    venueTableConfig: createDelegate(overrides?.venueTableConfig),
    venueStandaloneChair: createDelegate(overrides?.venueStandaloneChair),
    venueStandaloneChairConfig: createDelegate(
      overrides?.venueStandaloneChairConfig,
    ),
    $queryRaw: overrides?.$queryRaw ?? jest.fn(),
    $transaction:
      overrides?.$transaction ??
      jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({})),
  };
}
