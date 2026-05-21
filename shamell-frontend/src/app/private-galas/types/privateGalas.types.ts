import type { LucideIcon } from "lucide-react";

export type ServicePageFeature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export type ServicePageContent = {
  title: string;
  tagline: string;
  description: string;
  features: ServicePageFeature[];
};
