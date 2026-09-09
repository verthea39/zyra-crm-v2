/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@react-pdf/renderer', 'pdfkit'],
  outputFileTracingIncludes: {
    '/api/quotations/[id]/pdf': ['./node_modules/pdfkit/**/*'],
    '/api/receipts/[id]/pdf': ['./node_modules/pdfkit/**/*'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // allow document camera uploads from Field PRO module
    },
  },
};

export default nextConfig;
