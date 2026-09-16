import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        serverActions: {
            // Default 1MB is too small for a base64-encoded scanned document
            // image (the OCR scanner action sends the full image inline).
            bodySizeLimit: '10mb',
        },
    },
    async redirects() {
        return [
            {
                source: '/',
                destination: '/dashboard',
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
