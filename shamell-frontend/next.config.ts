import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/shamell-admin/inquiries",
        destination: "/shamell-admin/agenda/peticiones",
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
        source: "/shamell-admin/venue-layout-promo",
        destination: "/shamell-admin/on-coming-events",
        permanent: true,
      },
      {
        source: "/shamell-admin/venue-layout-promo/:path*",
        destination: "/shamell-admin/on-coming-events/:path*",
        permanent: true,
      },
      {
        source: "/shamell-admin/floor-layout",
        destination: "/shamell-admin/on-coming-events/layout",
        permanent: true,
      },
      {
        source: "/shamell-admin/floor-layout/:path*",
        destination: "/shamell-admin/on-coming-events/layout/:path*",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
