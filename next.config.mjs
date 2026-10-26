/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    '/api/**/*': ['./prisma/template.db', './public/template.db'],
  },
};

export default nextConfig;
