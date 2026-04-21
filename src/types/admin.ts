export interface DashboardStats {
  activeBookings: number;
  pendingTestimonials: number;
  galleryImages: number;
  blogPosts: number;
}

export interface GalleryImage {
  id: string;
  url: string;
  caption?: string;
  order: number;
  uploadedAt: string;
}

export interface Testimonial {
  id: string;
  author: string;
  event: string;
  quote: string;
  approved: boolean;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  published: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}
