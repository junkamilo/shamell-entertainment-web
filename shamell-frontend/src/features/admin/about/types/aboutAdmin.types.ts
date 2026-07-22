export type AdminAboutRow = {
  id: string;
  title: string;
  paragraph1: string;
  coreValues: string[];
  imageUrl: string | null;
  heroMediaType?: "IMAGE" | "VIDEO";
  updatedAt?: string;
};

export type AboutAdminStats = {
  state: string;
  values: string;
  media: string;
  updated: string;
};

export type LightboxDisplay = {
  src: string;
  isVideo: boolean;
};

export type AboutHeroPreviewCardProps = {
  src: string;
  isVideo: boolean;
  badge: string;
  onRemove: () => void;
  removeDisabled?: boolean;
  removeBusy?: boolean;
  removeAriaLabel: string;
  onExpand: () => void;
};
