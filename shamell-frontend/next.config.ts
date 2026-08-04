import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "motion/react", "@/components/admin"],
  },
  async redirects() {
    return [
      {
        source: "/shamell-admin",
        destination: "/admin",
        permanent: true,
      },
      {
        source: "/shamell-admin/:path*",
        destination: "/admin/:path*",
        permanent: true,
      },
      {
        source: "/admin/inquiries",
        destination: "/admin/agenda/peticiones",
        permanent: true,
      },
      {
        source: "/admin/invite-admin",
        destination: "/admin/agregar-admin",
        permanent: true,
      },
      {
        source: "/admin/invite-admin/:path*",
        destination: "/admin/agregar-admin/:path*",
        permanent: true,
      },
      {
        source: "/admin/upcoming-events",
        destination: "/admin/on-coming-events",
        permanent: true,
      },
      {
        source: "/admin/upcoming-events/:path*",
        destination: "/admin/on-coming-events/:path*",
        permanent: true,
      },
      {
        source: "/admin/dashboard",
        destination: "/admin/agenda",
        permanent: true,
      },
      {
        source: "/admin/dashboard/:path*",
        destination: "/admin/agenda/:path*",
        permanent: true,
      },
      {
        source: "/login",
        destination: "/admin/login",
        permanent: true,
      },
      {
        source: "/registro",
        destination: "/",
        permanent: true,
      },
      {
        source: "/upcoming-events",
        destination: "/on-coming-events",
        permanent: true,
      },
      {
        source: "/upcoming-events/:path*",
        destination: "/on-coming-events/:path*",
        permanent: true,
      },
      {
        source: "/venue-layout",
        destination: "/on-coming-events",
        permanent: true,
      },
      {
        source: "/venue-layout/:path*",
        destination: "/on-coming-events/:path*",
        permanent: true,
      },
      {
        source: "/admin/venue-layout-promo",
        destination: "/admin/on-coming-events",
        permanent: true,
      },
      {
        source: "/admin/venue-layout-promo/:path*",
        destination: "/admin/on-coming-events/:path*",
        permanent: true,
      },
      {
        source: "/admin/floor-layout",
        destination: "/admin/on-coming-events/layout",
        permanent: true,
      },
      {
        source: "/admin/floor-layout/:path*",
        destination: "/admin/on-coming-events/layout/:path*",
        permanent: true,
      },
      {
        source: "/on-coming-events/seats/return",
        destination: "/on-coming-events/return",
        permanent: false,
      },
      {
        source: "/on-coming-events/:slug/seats/return",
        destination: "/on-coming-events/return?event_slug=:slug",
        permanent: false,
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/venue-3d/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
