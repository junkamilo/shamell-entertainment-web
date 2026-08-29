"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableRowActions,
  TableTruncatedText,
  tableIconBtnClass,
  tableIconBtnDangerClass,
  type TableColumn,
} from "@/components/admin/data-display";
import { MediaPickControl } from "@/components/admin/media";
import { isVideoCatalogItem, isVideoFile } from "@/features/admin/events/lib/eventsMedia";
import type { EventActivityForm } from "@/features/admin/on-coming-events/fixed-packages/types/fixedEventPackage.types";
import { deleteEventActivityMedia } from "@/features/admin/on-coming-events/fixed-packages/services/fixedEventPackagesApi";
import { persistEventActivities } from "@/features/admin/on-coming-events/fixed-packages/services/persistEventActivities";

type Props = {
  /** When omitted, activities are kept in local draft state until the event is created. */
  eventId?: string | null;
  token?: string | null;
  activities: EventActivityForm[];
  onActivitiesChange: (activities: EventActivityForm[]) => void;
  disabled?: boolean;
};

type DraftState = {
  title: string;
  description: string;
  accentColor: string;
  showText: boolean;
  pendingMediaFile: File | null;
  mediaUrl: string | null;
  mediaType: "IMAGE" | "VIDEO" | null;
};

const emptyDraft = (): DraftState => ({
  title: "",
  description: "",
  accentColor: "",
  showText: true,
  pendingMediaFile: null,
  mediaUrl: null,
  mediaType: null,
});

/** Public flyer column tints — hex paints the activity banner. */
const ACCENT_PRESETS = [
  { label: "Emerald", value: "#0d3d32" },
  { label: "Royal", value: "#1a2a6c" },
  { label: "Purple", value: "#3b1a5c" },
] as const;

function activityRowKey(activity: EventActivityForm, index: number): string {
  return activity.id ?? activity.clientKey ?? `row-${index}`;
}

function activityPreviewIsVideo(
  activity: EventActivityForm,
  previewUrl: string | null,
): boolean {
  if (activity.pendingMediaFile) return isVideoFile(activity.pendingMediaFile);
  if (activity.mediaType) return isVideoCatalogItem({ mediaType: activity.mediaType });
  return previewUrl ? /\.(mp4|webm|mov|mkv|m4v)(\?|$)/i.test(previewUrl) : false;
}

function mediaLabel(activity: EventActivityForm): string {
  if (activity.pendingMediaFile) return activity.pendingMediaFile.name;
  if (activity.mediaUrl) {
    return activity.mediaType === "VIDEO" ? "Video" : "Image";
  }
  return "—";
}

export function EventActivitiesEditor({
  eventId = null,
  token = null,
  activities,
  onActivitiesChange,
  disabled = false,
}: Props) {
  const isDraftMode = !eventId || !token;
  const draftFileInputRef = useRef<HTMLInputElement | null>(null);
  const [draft, setDraft] = useState<DraftState>(emptyDraft);
  const [draftPreviewUrl, setDraftPreviewUrl] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [busyRowKey, setBusyRowKey] = useState<string | null>(null);
  const [rowPreviewUrls, setRowPreviewUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (draft.pendingMediaFile) {
      const url = URL.createObjectURL(draft.pendingMediaFile);
      setDraftPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setDraftPreviewUrl(draft.mediaUrl);
    return undefined;
  }, [draft.pendingMediaFile, draft.mediaUrl]);

  useEffect(() => {
    const urls: Record<string, string> = {};
    const toRevoke: string[] = [];
    activities.forEach((activity, index) => {
      const key = activityRowKey(activity, index);
      if (activity.pendingMediaFile) {
        urls[key] = URL.createObjectURL(activity.pendingMediaFile);
        toRevoke.push(urls[key]);
      } else if (activity.mediaUrl) {
        urls[key] = activity.mediaUrl;
      }
    });
    setRowPreviewUrls(urls);
    return () => {
      toRevoke.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [activities]);

  const resetDraft = () => {
    setDraft(emptyDraft());
    setEditingKey(null);
    setFormError(null);
    if (draftFileInputRef.current) draftFileInputRef.current.value = "";
  };

  const handleDraftMediaPick = (file: File | null) => {
    if (!file) return;
    setDraft((prev) => ({
      ...prev,
      pendingMediaFile: file,
      mediaUrl: null,
      mediaType: null,
    }));
  };

  const handleRemoveDraftMedia = () => {
    setDraft((prev) => ({
      ...prev,
      pendingMediaFile: null,
      mediaUrl: null,
      mediaType: null,
    }));
    if (draftFileInputRef.current) draftFileInputRef.current.value = "";
  };

  const handleAddOrUpdate = async () => {
    setFormError(null);
    if (!draft.title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (!draft.description.trim()) {
      setFormError("Description is required.");
      return;
    }
    const hasMedia =
      Boolean(draft.mediaUrl?.trim()) || Boolean(draft.pendingMediaFile);
    if (!draft.showText && !hasMedia) {
      setFormError("Image or video is required when text is hidden.");
      return;
    }

    let next: EventActivityForm[];

    if (editingKey) {
      const editIndex = activities.findIndex(
        (activity, index) => activityRowKey(activity, index) === editingKey,
      );
      if (editIndex === -1) {
        resetDraft();
        return;
      }
      const existing = activities[editIndex];
      next = [...activities];
      next[editIndex] = {
        ...existing,
        title: draft.title.trim(),
        description: draft.description.trim(),
        accentColor: draft.accentColor.trim(),
        showText: draft.showText,
        mediaUrl: draft.mediaUrl,
        mediaType: draft.mediaType,
        pendingMediaFile: draft.pendingMediaFile,
      };
    } else {
      next = [
        ...activities.filter((a) => a.title.trim()),
        {
          clientKey:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `draft-${Date.now()}`,
          title: draft.title.trim(),
          description: draft.description.trim(),
          accentColor: draft.accentColor.trim(),
          showText: draft.showText,
          displayOrder: activities.length,
          mediaUrl: draft.mediaUrl,
          mediaType: draft.mediaType,
          pendingMediaFile: draft.pendingMediaFile,
        },
      ];
    }

    if (isDraftMode) {
      onActivitiesChange(next);
      resetDraft();
      return;
    }

    setIsSaving(true);
    const result = await persistEventActivities(token, eventId, next);
    setIsSaving(false);

    if (!result.ok) {
      setFormError(result.message ?? "Could not save activity.");
      return;
    }

    onActivitiesChange(result.activities);
    resetDraft();
  };

  const handleEdit = (activity: EventActivityForm, index: number) => {
    const key = activityRowKey(activity, index);
    setEditingKey(key);
    setFormError(null);
    setDraft({
      title: activity.title,
      description: activity.description,
      accentColor: activity.accentColor ?? "",
      showText: activity.showText !== false,
      pendingMediaFile: activity.pendingMediaFile ?? null,
      mediaUrl: activity.mediaUrl ?? null,
      mediaType: activity.mediaType ?? null,
    });
    if (draftFileInputRef.current) draftFileInputRef.current.value = "";
  };

  const handleDelete = async (activity: EventActivityForm, index: number) => {
    const key = activityRowKey(activity, index);
    if (editingKey === key) resetDraft();

    const next = activities.filter((_, i) => i !== index);

    if (isDraftMode) {
      onActivitiesChange(next);
      return;
    }

    if (activity.id && activity.mediaUrl && token && eventId) {
      setBusyRowKey(key);
      await deleteEventActivityMedia(token, eventId, activity.id);
      setBusyRowKey(null);
    }

    setIsSaving(true);
    const result = await persistEventActivities(token!, eventId!, next);
    setIsSaving(false);

    if (!result.ok) {
      window.alert(result.message ?? "Could not delete activity.");
      return;
    }

    onActivitiesChange(result.activities);
  };

  const columns: TableColumn<EventActivityForm & { _index: number }>[] = [
    {
      id: "title",
      header: "TITLE",
      cell: (row) => (
        <TableTruncatedText primary={row.title} className="max-w-[10rem] md:max-w-[14rem]" />
      ),
    },
    {
      id: "description",
      header: "DESCRIPTION",
      cell: (row) => (
        <TableTruncatedText
          primary={row.description.trim() || "—"}
          className="max-w-[12rem] md:max-w-[18rem]"
        />
      ),
    },
    {
      id: "text",
      header: "TEXT",
      cell: (row) => (
        <span className="font-body text-xs text-foreground/70">
          {row.showText !== false ? "Shown" : "Hidden"}
        </span>
      ),
    },
    {
      id: "media",
      header: "MEDIA",
      cell: (row) => {
        const key = activityRowKey(row, row._index);
        const previewUrl = rowPreviewUrls[key] ?? null;
        const isVideo = activityPreviewIsVideo(row, previewUrl);
        return (
          <div className="flex items-center gap-2">
            {previewUrl ? (
              <div className="h-10 w-14 overflow-hidden rounded border border-gold/15 bg-black/40">
                {isVideo ? (
                  <video src={previewUrl} className="h-full w-full object-cover" muted />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                )}
              </div>
            ) : null}
            <span className="font-body text-xs text-foreground/60">{mediaLabel(row)}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "ACTIONS",
      headerClassName: "text-right",
      cellClassName: "text-right",
      cell: (row) => {
        const key = activityRowKey(row, row._index);
        const isBusy = busyRowKey === key;
        return (
          <TableRowActions>
            <button
              type="button"
              disabled={disabled || isBusy}
              aria-label={`Edit ${row.title}`}
              className={tableIconBtnClass}
              onClick={() => handleEdit(row, row._index)}
            >
              <Pencil className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              disabled={disabled || isBusy}
              aria-label={`Delete ${row.title}`}
              className={tableIconBtnDangerClass}
              onClick={() => void handleDelete(row, row._index)}
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </TableRowActions>
        );
      },
    },
  ];

  const tableRows = activities.map((activity, index) => ({
    ...activity,
    _index: index,
  }));

  const draftPreviewIsVideo = draft.pendingMediaFile
    ? isVideoFile(draft.pendingMediaFile)
    : draft.mediaType
      ? isVideoCatalogItem({ mediaType: draft.mediaType })
      : draftPreviewUrl
        ? /\.(mp4|webm|mov|mkv|m4v)(\?|$)/i.test(draftPreviewUrl)
        : false;

  return (
    <div className="space-y-4">
      <h3 className="font-brand text-[10px] tracking-[0.12em] text-gold">ACTIVITIES</h3>
      {isDraftMode ? (
        <p className="font-body text-xs text-foreground/55">
          Add activities here. They are saved with the event when you click Create event.
          Packages become available after the event is created.
        </p>
      ) : null}

      <div className="space-y-3 rounded-lg border border-gold/15 bg-black/25 p-4">
        <label className="block">
          <span className="font-brand text-[10px] tracking-[0.12em] text-gold/85">TITLE</span>
          <input
            placeholder="e.g. Workshop"
            value={draft.title}
            disabled={disabled || isSaving || busyRowKey !== null}
            onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-gold/20 bg-black/30 px-3 py-2 text-sm outline-none focus:border-gold/45"
          />
        </label>

        <label className="block">
          <span className="font-brand text-[10px] tracking-[0.12em] text-gold/85">
            DESCRIPTION
          </span>
          <textarea
            placeholder="Describe this part of the night..."
            value={draft.description}
            rows={3}
            disabled={disabled || isSaving || busyRowKey !== null}
            onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-gold/20 bg-black/30 px-3 py-2 text-sm outline-none focus:border-gold/45"
          />
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gold/15 bg-black/20 px-3 py-3">
          <input
            type="checkbox"
            checked={draft.showText}
            disabled={disabled || isSaving || busyRowKey !== null}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, showText: e.target.checked }))
            }
            className="mt-0.5 h-4 w-4 accent-[#c5a55a]"
          />
          <span>
            <span className="font-brand text-[10px] tracking-[0.12em] text-gold/85">
              SHOW TEXT ON CARD
            </span>
            <span className="mt-1 block font-body text-xs text-foreground/55">
              When off, an image or video is required and only media is shown publicly.
              Title and description are still saved for package includes. Click{" "}
              <span className="text-foreground/75">Add activity</span> or{" "}
              <span className="text-foreground/75">Update activity</span> to save —
              this does not use Save changes at the bottom.
            </span>
          </span>
        </label>

        <div className="block">
          <span className="font-brand text-[10px] tracking-[0.12em] text-gold/85">
            ACCENT COLOR
          </span>
          <p className="mt-1 font-body text-xs text-foreground/55">
            Tints this activity column on the public event page. Leave empty for auto green / blue /
            purple.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {ACCENT_PRESETS.map((preset) => {
              const selected =
                draft.accentColor.toLowerCase() === preset.value.toLowerCase();
              return (
                <button
                  key={preset.value}
                  type="button"
                  disabled={disabled || isSaving || busyRowKey !== null}
                  aria-label={`${preset.label} accent`}
                  aria-pressed={selected}
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      accentColor: selected ? "" : preset.value,
                    }))
                  }
                  className={`h-8 w-8 rounded-full border-2 transition ${
                    selected ? "border-gold scale-110" : "border-gold/25 hover:border-gold/50"
                  }`}
                  style={{ backgroundColor: preset.value }}
                />
              );
            })}
            <input
              type="text"
              placeholder="#0d3d32"
              value={draft.accentColor}
              disabled={disabled || isSaving || busyRowKey !== null}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, accentColor: e.target.value }))
              }
              className="w-28 rounded-lg border border-gold/20 bg-black/30 px-2 py-1.5 font-mono text-xs outline-none focus:border-gold/45"
            />
          </div>
        </div>

        <div className="block">
          <span className="font-brand text-[10px] tracking-[0.12em] text-gold/85">
            {draft.showText ? "IMAGE OR VIDEO (OPTIONAL)" : "IMAGE OR VIDEO (REQUIRED)"}
          </span>
          <MediaPickControl
            ref={draftFileInputRef}
            className="mt-1"
            onFileChange={handleDraftMediaPick}
            selectedFileName={
              draft.pendingMediaFile?.name ??
              (draft.mediaUrl ? "Media saved on server" : null)
            }
            disabled={disabled || isSaving || busyRowKey !== null}
            aria-label="Select image or video for activity"
          />
        </div>

        {draftPreviewUrl ? (
          <div className="overflow-hidden rounded-xl border border-gold/15 bg-black/40">
            {draftPreviewIsVideo ? (
              <video
                src={draftPreviewUrl}
                controls
                playsInline
                className="max-h-40 w-full object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={draftPreviewUrl}
                alt={draft.title || "Activity preview"}
                className="max-h-40 w-full object-cover"
              />
            )}
            <div className="flex justify-end border-t border-gold/10 p-2">
              <button
                type="button"
                disabled={disabled || isSaving || busyRowKey !== null}
                onClick={handleRemoveDraftMedia}
                className="text-xs text-foreground/70 hover:text-gold"
              >
                Remove media
              </button>
            </div>
          </div>
        ) : null}

        {formError ? <p className="text-sm text-red-400">{formError}</p> : null}

        <div className="flex flex-wrap justify-end gap-2">
          {editingKey ? (
            <button
              type="button"
              disabled={disabled || isSaving || busyRowKey !== null}
              onClick={resetDraft}
              className="rounded-xl border border-gold/30 px-4 py-2 text-sm text-foreground/80 hover:bg-white/5"
            >
              Cancel edit
            </button>
          ) : null}
          <button
            type="button"
            disabled={disabled || isSaving || busyRowKey !== null}
            onClick={() => void handleAddOrUpdate()}
            className="rounded-xl border border-gold/35 bg-gold/15 px-4 py-2 font-brand text-sm tracking-[0.08em] text-gold transition hover:bg-gold/25 disabled:opacity-50"
          >
            {isSaving
              ? "Saving..."
              : editingKey
                ? "Update activity"
                : isDraftMode
                  ? "Add to list"
                  : "Add activity"}
          </button>
        </div>
      </div>

      {activities.filter((a) => a.title.trim()).length === 0 ? (
        <p className="text-sm text-foreground/55">
          No activities yet. Fill the form above and click Add activity.
        </p>
      ) : (
        <Table
          columns={columns}
          rows={tableRows.filter((row) => row.title.trim())}
          getRowKey={(row) => activityRowKey(row, row._index)}
          variant="embedded"
          tableClassName="w-full min-w-[640px] border-collapse text-left"
        />
      )}
    </div>
  );
}
