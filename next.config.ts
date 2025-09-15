import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // increase limit for multipart/form-data used by the admin upload
    serverActions: { bodySizeLimit: '50mb' }  // pick a size you need
  }
};

export default nextConfig;
