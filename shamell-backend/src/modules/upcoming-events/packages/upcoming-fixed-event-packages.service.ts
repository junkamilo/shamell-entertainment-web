import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EventPublicSection } from '@prisma/client';
import { GalleryMediaService } from '../../gallery/services/gallery-media.service';
import { UpcomingEventsRepository } from '../services/upcoming-events.repository';
import { UpcomingFixedEventPackagesRepository } from './upcoming-fixed-event-packages.repository';
import { UpsertEventActivitiesDto } from './dto/upsert-event-activities.dto';
import {
  FIXED_EVENT_PACKAGE_ERROR_CODES,
  packageErrorBody,
} from './util/fixed-event-package-errors';
import {
  mapActivityAdmin,
  mapPackageAdmin,
  parseTimeToDate,
  validateArrivalWindow,
} from './util/fixed-event-package.mapper';
import { UPCOMING_ACTIVITY_CLOUDINARY_FOLDER } from './constants/upcoming-activities.constants';
import type {
  CreateFixedEventPackageDto,
  UpdateFixedEventPackageDto,
} from './dto/fixed-event-package.dto';

@Injectable()
export class UpcomingEventActivitiesService {
  constructor(
    private readonly repository: UpcomingFixedEventPackagesRepository,
    private readonly eventsRepository: UpcomingEventsRepository,
    private readonly galleryMedia: GalleryMediaService,
  ) {}

  private async assertUpcomingEvent(eventId: string) {
    const event =
      await this.eventsRepository.findAdminUpcomingEventOrThrow(eventId);
    if (event.publicSection !== EventPublicSection.UPCOMING_EVENTS) {
      throw new NotFoundException('Event not found.');
    }
    return event;
  }

  async listActivities(eventId: string) {
    await this.assertUpcomingEvent(eventId);
    const rows = await this.repository.listActivitiesByEvent(eventId);
    return {
      activities: rows
        .filter((r) => r.isActive !== false)
        .map((r) =>
          mapActivityAdmin({
            ...r,
            displayOrder: r.displayOrder,
          }),
        ),
    };
  }

  async replaceActivities(eventId: string, dto: UpsertEventActivitiesDto) {
    await this.assertUpcomingEvent(eventId);
    const existing = await this.repository.listActivitiesByEvent(eventId);
    const existingById = new Map(existing.map((a) => [a.id, a]));
    const incomingIds = new Set(
      dto.activities.filter((a) => a.id).map((a) => a.id!),
    );

    for (const [index, item] of dto.activities.entries()) {
      const displayOrder = item.displayOrder ?? index;
      const description = item.description.trim();
      if (!description) {
        throw new BadRequestException('Activity description is required.');
      }
      const showText = item.showText !== false;

      if (item.id && existingById.has(item.id)) {
        const prev = existingById.get(item.id)!;
        if (!showText && !prev.mediaUrl?.trim()) {
          throw new BadRequestException(
            'Image or video is required when text is hidden on the card.',
          );
        }
        await this.repository.updateActivity(item.id, {
          title: item.title.trim(),
          description,
          accentColor: item.accentColor?.trim() || null,
          showText,
          displayOrder,
          isActive: item.isActive ?? true,
        });
      } else {
        // New activities may set showText=false; FE must upload media immediately after.
        await this.repository.createActivity({
          eventId,
          title: item.title.trim(),
          description,
          accentColor: item.accentColor?.trim() || null,
          showText,
          displayOrder,
          isActive: item.isActive ?? true,
        });
      }
    }

    for (const prev of existing) {
      if (incomingIds.has(prev.id)) continue;
      // Unlink from packages first, then hard-delete so admin UI removals stick.
      await this.repository.deleteActivityPackageLinks(prev.id);
      await this.repository.deleteActivity(prev.id);
    }

    return this.listActivities(eventId);
  }

  async uploadActivityMedia(
    eventId: string,
    activityId: string,
    mediaFile: Express.Multer.File,
  ) {
    await this.assertUpcomingEvent(eventId);
    const activity = await this.repository.findActivityById(
      activityId,
      eventId,
    );
    if (!activity) {
      throw new NotFoundException('Activity not found.');
    }

    this.galleryMedia.ensureCloudinaryEnv();
    this.galleryMedia.ensureMediaFile(mediaFile);
    const prepared =
      await this.galleryMedia.prepareMulterFileForCloudinary(mediaFile);
    const upload = await this.galleryMedia.uploadMediaToCloudinary(
      prepared,
      UPCOMING_ACTIVITY_CLOUDINARY_FOLDER,
    );

    if (activity.mediaPublicId && activity.mediaType) {
      try {
        await this.galleryMedia.deleteMediaFromCloudinary(
          activity.mediaPublicId,
          activity.mediaType,
        );
      } catch {
        // Best-effort cleanup; new upload still succeeds.
      }
    }

    await this.repository.updateActivity(activityId, {
      mediaUrl: upload.secureUrl,
      mediaPublicId: upload.publicId,
      mediaType: upload.mediaType,
    });

    const refreshed = await this.repository.findActivityById(
      activityId,
      eventId,
    );
    return mapActivityAdmin(refreshed!);
  }

  async deleteActivityMedia(eventId: string, activityId: string) {
    await this.assertUpcomingEvent(eventId);
    const activity = await this.repository.findActivityById(
      activityId,
      eventId,
    );
    if (!activity) {
      throw new NotFoundException('Activity not found.');
    }

    if (activity.showText === false) {
      throw new BadRequestException(
        'Cannot remove media while text is hidden on the card. Turn on "Show text on card" first.',
      );
    }

    if (activity.mediaPublicId && activity.mediaType) {
      await this.galleryMedia.deleteMediaFromCloudinary(
        activity.mediaPublicId,
        activity.mediaType,
      );
    }

    await this.repository.updateActivity(activityId, {
      mediaUrl: null,
      mediaPublicId: null,
      mediaType: null,
    });

    const refreshed = await this.repository.findActivityById(
      activityId,
      eventId,
    );
    return mapActivityAdmin(refreshed!);
  }
}

@Injectable()
export class UpcomingFixedEventPackagesService {
  constructor(
    private readonly repository: UpcomingFixedEventPackagesRepository,
    private readonly eventsRepository: UpcomingEventsRepository,
    private readonly activitiesService: UpcomingEventActivitiesService,
  ) {}

  private async assertUpcomingEvent(eventId: string) {
    const event =
      await this.eventsRepository.findAdminUpcomingEventOrThrow(eventId);
    if (event.publicSection !== EventPublicSection.UPCOMING_EVENTS) {
      throw new NotFoundException('Event not found.');
    }
    return event;
  }

  private async validateActivityIds(eventId: string, activityIds: string[]) {
    if (activityIds.length === 0) {
      throw new UnprocessableEntityException(
        packageErrorBody(
          FIXED_EVENT_PACKAGE_ERROR_CODES.PACKAGE_INACTIVE,
          'Select at least one activity for this package.',
        ),
      );
    }
    const activities =
      await this.repository.listActiveActivitiesByEvent(eventId);
    const activeIds = new Set(activities.map((a) => a.id));
    for (const id of activityIds) {
      if (!activeIds.has(id)) {
        throw new UnprocessableEntityException(
          packageErrorBody(
            FIXED_EVENT_PACKAGE_ERROR_CODES.PACKAGE_NOT_FOUND,
            'One or more selected activities are invalid.',
          ),
        );
      }
    }
  }

  async listPackages(eventId: string) {
    await this.assertUpcomingEvent(eventId);
    const packages = await this.repository.listPackagesByEvent(eventId);
    const blockingMap =
      await this.repository.countBlockingEnrollmentsByPackages(
        packages.map((p) => p.id),
      );
    return {
      packages: packages.map((p) =>
        mapPackageAdmin(p, blockingMap.get(p.id) ?? 0),
      ),
    };
  }

  private assertArrivalWindow(startStr: string, endStr?: string | null) {
    const message = validateArrivalWindow(startStr, endStr);
    if (message) {
      throw new BadRequestException(
        packageErrorBody(
          FIXED_EVENT_PACKAGE_ERROR_CODES.PACKAGE_ARRIVAL_INVALID,
          message,
        ),
      );
    }
  }

  private isArrivalWindowConstraintError(err: unknown): boolean {
    const message = err instanceof Error ? err.message : String(err);
    return message.includes('chk_arrival_window');
  }

  async createPackage(eventId: string, dto: CreateFixedEventPackageDto) {
    await this.assertUpcomingEvent(eventId);
    await this.validateActivityIds(eventId, dto.activityIds);
    this.assertArrivalWindow(dto.arrivalStartTime, dto.arrivalEndTime);

    const pkg = await this.repository
      .createPackage({
        eventId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        badge: dto.badge?.trim() || null,
        priceCents: dto.priceCents,
        capacity: dto.capacity,
        arrivalStartTime: parseTimeToDate(dto.arrivalStartTime),
        arrivalEndTime: dto.arrivalEndTime
          ? parseTimeToDate(dto.arrivalEndTime)
          : null,
        displayOrder: dto.displayOrder ?? 0,
        isActive: true,
      })
      .catch((err: unknown) => {
        if (this.isArrivalWindowConstraintError(err)) {
          throw new BadRequestException(
            packageErrorBody(
              FIXED_EVENT_PACKAGE_ERROR_CODES.PACKAGE_ARRIVAL_INVALID,
              'Arrival end time must differ from the start time.',
            ),
          );
        }
        throw err;
      });

    await this.repository.replacePackageActivities(
      pkg.id,
      dto.activityIds.map((activityId, index) => ({
        activityId,
        displayOrder: index,
      })),
    );

    const refreshed = await this.repository.findPackageById(pkg.id, eventId);
    await this.syncDerivedEventPrice(eventId);
    return mapPackageAdmin(refreshed!);
  }

  async updatePackage(
    eventId: string,
    packageId: string,
    dto: UpdateFixedEventPackageDto,
  ) {
    await this.assertUpcomingEvent(eventId);
    const existing = await this.repository.findPackageById(packageId, eventId);
    if (!existing) {
      throw new NotFoundException(
        packageErrorBody(
          FIXED_EVENT_PACKAGE_ERROR_CODES.PACKAGE_NOT_FOUND,
          'Package not found.',
        ),
      );
    }

    if (dto.capacity != null && dto.capacity < existing.capacity) {
      const blocking =
        await this.repository.countBlockingEnrollmentsByPackage(packageId);
      if (dto.capacity < blocking) {
        throw new ConflictException(
          packageErrorBody(
            FIXED_EVENT_PACKAGE_ERROR_CODES.PACKAGE_CAPACITY_CONFLICT,
            `This package already sold ${blocking} tickets. Set ${blocking} or more.`,
            { sold: blocking },
          ),
        );
      }
    }

    if (dto.activityIds) {
      await this.validateActivityIds(eventId, dto.activityIds);
    }

    if (
      dto.arrivalStartTime !== undefined ||
      dto.arrivalEndTime !== undefined
    ) {
      const formatExisting = (d: Date) =>
        `${String(d.getUTCHours()).padStart(2, '0')}:${String(
          d.getUTCMinutes(),
        ).padStart(2, '0')}`;
      const start =
        dto.arrivalStartTime ?? formatExisting(existing.arrivalStartTime);
      const end =
        dto.arrivalEndTime !== undefined
          ? dto.arrivalEndTime
          : existing.arrivalEndTime
            ? formatExisting(existing.arrivalEndTime)
            : null;
      this.assertArrivalWindow(start, end);
    }

    await this.repository.updatePackage(packageId, {
      ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description?.trim() || null }
        : {}),
      ...(dto.badge !== undefined ? { badge: dto.badge?.trim() || null } : {}),
      ...(dto.priceCents !== undefined ? { priceCents: dto.priceCents } : {}),
      ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
      ...(dto.arrivalStartTime !== undefined
        ? { arrivalStartTime: parseTimeToDate(dto.arrivalStartTime) }
        : {}),
      ...(dto.arrivalEndTime !== undefined
        ? {
            arrivalEndTime: dto.arrivalEndTime
              ? parseTimeToDate(dto.arrivalEndTime)
              : null,
          }
        : {}),
      ...(dto.displayOrder !== undefined
        ? { displayOrder: dto.displayOrder }
        : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    });

    if (dto.activityIds) {
      await this.repository.replacePackageActivities(
        packageId,
        dto.activityIds.map((activityId, index) => ({
          activityId,
          displayOrder: index,
        })),
      );
    }

    const refreshed = await this.repository.findPackageById(packageId, eventId);
    const blocking =
      await this.repository.countBlockingEnrollmentsByPackage(packageId);
    await this.syncDerivedEventPrice(eventId);
    return mapPackageAdmin(refreshed!, blocking);
  }

  async deletePackage(eventId: string, packageId: string) {
    await this.assertUpcomingEvent(eventId);
    const existing = await this.repository.findPackageById(packageId, eventId);
    if (!existing) {
      throw new NotFoundException(
        packageErrorBody(
          FIXED_EVENT_PACKAGE_ERROR_CODES.PACKAGE_NOT_FOUND,
          'Package not found.',
        ),
      );
    }

    const sales =
      await this.repository.countNonCancelledEnrollmentsByPackage(packageId);
    if (sales > 0) {
      throw new ConflictException(
        packageErrorBody(
          FIXED_EVENT_PACKAGE_ERROR_CODES.PACKAGE_HAS_SALES,
          'Cannot delete a package with ticket sales. Deactivate it instead.',
        ),
      );
    }

    await this.repository.deletePackage(packageId);
    return { ok: true };
  }

  async reorderPackages(eventId: string, orderedIds: string[]) {
    await this.assertUpcomingEvent(eventId);
    await this.repository.reorderPackages(eventId, orderedIds);
    return this.listPackages(eventId);
  }

  async countActivePackages(eventId: string) {
    return this.repository.countActivePackagesByEvent(eventId);
  }

  async syncDerivedEventPrice(eventId: string) {
    const minCents = await this.repository.minActivePackagePriceCents(eventId);
    if (minCents == null) return null;
    const price = minCents / 100;
    await this.eventsRepository.updateUpcomingEventPrice(eventId, price);
    return price;
  }
}
