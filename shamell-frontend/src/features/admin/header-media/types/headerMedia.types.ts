export type HeaderMediaType = "IMAGE" | "VIDEO";

export type HeaderPhoto = {
  id: string;
  imageUrl: string;
  mediaType?: HeaderMediaType;
  focalX: number;
  focalY: number;
  focalMobileX: number;
  focalMobileY: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type FocusDraft = {
  desktopX: number;
  desktopY: number;
  mobileX: number;
  mobileY: number;
};

export type FocalUpdateBody = {
  focalX: number;
  focalY: number;
  focalMobileX: number;
  focalMobileY: number;
};
