import { Injectable } from '@nestjs/common';
import { Prisma, UpcomingClassEnrollmentStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export const PACKAGE_WITH_ACTIVITIES_INCLUDE = {
  activityLinks: {
    orderBy: { displayOrder: 'asc' as const },
    include: { activity: true },
  },
} as const satisfies Prisma.UpcomingFixedEventPackageInclude;

export const ACTIVITY_LIST_INCLUDE = {
  packageLinks: { select: { packageId: true } },
} as const satisfies Prisma.UpcomingEventActivityInclude;

@Injectable()
export class UpcomingFixedEventPackagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  asPrisma() {
    return this.prisma;
  }

  listActivitiesByEvent(eventId: string) {
    return this.prisma.upcomingEventActivity.findMany({
      where: { eventId },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      include: ACTIVITY_LIST_INCLUDE,
    });
  }

  listActiveActivitiesByEvent(eventId: string) {
    return this.prisma.upcomingEventActivity.findMany({
      where: { eventId, isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  findActivityById(activityId: string, eventId: string) {
    return this.prisma.upcomingEventActivity.findFirst({
      where: { id: activityId, eventId },
    });
  }

  createActivity(data: Prisma.UpcomingEventActivityUncheckedCreateInput) {
    return this.prisma.upcomingEventActivity.create({ data });
  }

  updateActivity(
    activityId: string,
    data: Prisma.UpcomingEventActivityUpdateInput,
  ) {
    return this.prisma.upcomingEventActivity.update({
      where: { id: activityId },
      data,
    });
  }

  deactivateActivity(activityId: string) {
    return this.prisma.upcomingEventActivity.update({
      where: { id: activityId },
      data: { isActive: false },
    });
  }

  deleteActivityPackageLinks(activityId: string) {
    return this.prisma.upcomingEventPackageActivity.deleteMany({
      where: { activityId },
    });
  }

  deleteActivity(activityId: string) {
    return this.prisma.upcomingEventActivity.delete({
      where: { id: activityId },
    });
  }

  countActivityPackageLinks(activityId: string) {
    return this.prisma.upcomingEventPackageActivity.count({
      where: { activityId },
    });
  }

  listPackagesByEvent(eventId: string, activeOnly = false) {
    return this.prisma.upcomingFixedEventPackage.findMany({
      where: {
        eventId,
        ...(activeOnly ? { isActive: true } : {}),
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      include: PACKAGE_WITH_ACTIVITIES_INCLUDE,
    });
  }

  findPackageById(packageId: string, eventId?: string) {
    return this.prisma.upcomingFixedEventPackage.findFirst({
      where: {
        id: packageId,
        ...(eventId ? { eventId } : {}),
      },
      include: PACKAGE_WITH_ACTIVITIES_INCLUDE,
    });
  }

  createPackage(data: Prisma.UpcomingFixedEventPackageUncheckedCreateInput) {
    return this.prisma.upcomingFixedEventPackage.create({
      data,
      include: PACKAGE_WITH_ACTIVITIES_INCLUDE,
    });
  }

  updatePackage(
    packageId: string,
    data: Prisma.UpcomingFixedEventPackageUpdateInput,
  ) {
    return this.prisma.upcomingFixedEventPackage.update({
      where: { id: packageId },
      data,
      include: PACKAGE_WITH_ACTIVITIES_INCLUDE,
    });
  }

  deactivatePackage(packageId: string) {
    return this.prisma.upcomingFixedEventPackage.update({
      where: { id: packageId },
      data: { isActive: false },
      include: PACKAGE_WITH_ACTIVITIES_INCLUDE,
    });
  }

  deletePackage(packageId: string) {
    return this.prisma.upcomingFixedEventPackage.delete({
      where: { id: packageId },
    });
  }

  replacePackageActivities(
    packageId: string,
    links: { activityId: string; displayOrder: number }[],
  ) {
    return this.prisma.$transaction([
      this.prisma.upcomingEventPackageActivity.deleteMany({
        where: { packageId },
      }),
      ...links.map((link) =>
        this.prisma.upcomingEventPackageActivity.create({
          data: {
            packageId,
            activityId: link.activityId,
            displayOrder: link.displayOrder,
          },
        }),
      ),
    ]);
  }

  reorderPackages(eventId: string, orderedIds: string[]) {
    return this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.upcomingFixedEventPackage.updateMany({
          where: { id, eventId },
          data: { displayOrder: index },
        }),
      ),
    );
  }

  countActivePackagesByEvent(eventId: string) {
    return this.prisma.upcomingFixedEventPackage.count({
      where: { eventId, isActive: true },
    });
  }

  countNonCancelledEnrollmentsByPackage(packageId: string) {
    return this.prisma.upcomingFixedEventEnrollment.count({
      where: {
        packageId,
        status: {
          not: UpcomingClassEnrollmentStatus.CANCELLED,
        },
      },
    });
  }

  countBlockingEnrollmentsByPackage(packageId: string): Promise<number> {
    const now = new Date();
    return this.prisma.upcomingFixedEventEnrollment.count({
      where: {
        packageId,
        OR: [
          { status: UpcomingClassEnrollmentStatus.PAID },
          {
            status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        ],
      },
    });
  }

  async countBlockingEnrollmentsByPackages(
    packageIds: string[],
  ): Promise<Map<string, number>> {
    if (packageIds.length === 0) return new Map();
    const now = new Date();
    const rows = await this.prisma.upcomingFixedEventEnrollment.groupBy({
      by: ['packageId'],
      where: {
        packageId: { in: packageIds },
        OR: [
          { status: UpcomingClassEnrollmentStatus.PAID },
          {
            status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        ],
      },
      _count: { _all: true },
    });
    const map = new Map<string, number>();
    for (const row of rows) {
      if (row.packageId) {
        map.set(row.packageId, row._count._all);
      }
    }
    return map;
  }

  findPackageForUpdate(
    tx: Prisma.TransactionClient,
    packageId: string,
    eventId: string,
  ) {
    return tx.$queryRaw<
      {
        id: string;
        capacity: number;
        priceCents: number;
        title: string;
        isActive: boolean;
        arrivalStartTime: Date;
        arrivalEndTime: Date | null;
      }[]
    >(Prisma.sql`
      SELECT id, capacity, "priceCents", title, "isActive",
             "arrivalStartTime", "arrivalEndTime"
      FROM upcoming_fixed_event_packages
      WHERE id = ${packageId} AND "eventId" = ${eventId}
      FOR UPDATE
    `);
  }

  minActivePackagePriceCents(eventId: string): Promise<number | null> {
    return this.prisma.upcomingFixedEventPackage
      .aggregate({
        where: { eventId, isActive: true },
        _min: { priceCents: true },
      })
      .then((r) => r._min.priceCents);
  }
}
