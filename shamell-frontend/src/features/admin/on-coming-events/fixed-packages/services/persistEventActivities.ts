import type { AdminEventActivity, EventActivityForm } from "../types/fixedEventPackage.types";
import { postEventActivityMedia, replaceEventActivities } from "./fixedEventPackagesApi";

export function adminActivityToForm(
  activity: AdminEventActivity,
  pendingMediaFile: File | null = null,
): EventActivityForm {
  return {
    id: activity.id,
    title: activity.title,
    description: activity.description ?? "",
    accentColor: activity.accentColor ?? "",
    showText: activity.showText !== false,
    displayOrder: activity.displayOrder,
    isActive: activity.isActive !== false,
    mediaUrl: activity.mediaUrl ?? null,
    mediaType: activity.mediaType ?? null,
    pendingMediaFile,
  };
}

/**
 * Hide-text requires media on the server. When the user adds media in the same save,
 * upsert with showText=true first, upload, then set showText=false.
 */
function needsDeferredHideText(activity: EventActivityForm): boolean {
  const wantsHide = activity.showText === false;
  const hasPersistedMedia = Boolean(activity.mediaUrl?.trim());
  const willUpload = Boolean(activity.pendingMediaFile);
  return wantsHide && !hasPersistedMedia && willUpload;
}

export async function persistEventActivities(
  token: string,
  eventId: string,
  next: EventActivityForm[],
): Promise<{ ok: boolean; message?: string; activities: EventActivityForm[] }> {
  const pendingByIndex = next.map((a) => a.pendingMediaFile ?? null);
  const desiredShowText = next.map((a) => a.showText !== false);

  const upsertPayload = next.map((activity) =>
    needsDeferredHideText(activity) ? { ...activity, showText: true } : activity,
  );

  const result = await replaceEventActivities(token, eventId, upsertPayload);
  if (!result.ok) {
    return { ok: false, message: result.message, activities: [] };
  }

  let saved = result.activities.map((activity, index) => ({
    ...adminActivityToForm(activity, pendingByIndex[index] ?? null),
    clientKey: next[index]?.clientKey,
  }));

  for (let index = 0; index < pendingByIndex.length; index += 1) {
    const file = pendingByIndex[index];
    const activity = saved[index];
    if (!file || !activity?.id) continue;

    const upload = await postEventActivityMedia(token, eventId, activity.id, file);
    if (!upload.ok || !upload.activity) {
      return {
        ok: false,
        message: upload.message ?? "Activity saved but media upload failed.",
        activities: saved.map((row) => ({ ...row, pendingMediaFile: null })),
      };
    }

    saved = saved.map((row, i) =>
      i === index
        ? {
            ...adminActivityToForm(upload.activity!, null),
            clientKey: row.clientKey ?? next[index]?.clientKey,
          }
        : row,
    );
  }

  const needsHidePass = desiredShowText.some((showText, index) => {
    if (showText) return false;
    const row = saved[index];
    return Boolean(row) && row.showText !== false;
  });

  if (needsHidePass) {
    for (let index = 0; index < saved.length; index += 1) {
      if (desiredShowText[index]) continue;
      if (!saved[index]?.mediaUrl?.trim()) {
        return {
          ok: false,
          message: "Image or video is required when text is hidden.",
          activities: saved.map((row) => ({ ...row, pendingMediaFile: null })),
        };
      }
    }

    const hidePayload = saved.map((row, index) => ({
      ...row,
      showText: desiredShowText[index] ?? true,
      pendingMediaFile: null,
    }));

    const hideResult = await replaceEventActivities(token, eventId, hidePayload);
    if (!hideResult.ok) {
      return {
        ok: false,
        message: hideResult.message ?? "Media saved but could not hide card text.",
        activities: saved.map((row) => ({ ...row, pendingMediaFile: null })),
      };
    }

    saved = hideResult.activities.map((activity, index) => ({
      ...adminActivityToForm(activity, null),
      clientKey: next[index]?.clientKey ?? saved[index]?.clientKey,
    }));
  } else {
    saved = saved.map((row, index) => ({
      ...row,
      showText: desiredShowText[index] ?? row.showText,
      pendingMediaFile: null,
      clientKey: row.clientKey ?? next[index]?.clientKey,
    }));
  }

  return { ok: true, activities: saved.filter((row) => row.isActive !== false) };
}
