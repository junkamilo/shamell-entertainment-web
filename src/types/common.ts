export interface SelectOption {
  value: string;
  label: string;
}

export interface NavigationLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface SocialLink extends NavigationLink {
  platform: "instagram" | "youtube" | "twitter" | "facebook";
}
