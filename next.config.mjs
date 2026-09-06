/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@react-pdf/renderer', 'pdfkit'],
  outputFileTracingIncludes: {
    '/api/invoices/[id]/pdf': ['./node_modules/pdfkit/**/*'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // allow document camera uploads from Field PRO module
    },
  },
};

export default nextConfig;
