/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Proxy API paths so the browser can also hit /api/v1/* on same origin
    const api = process.env.API_URL || "http://localhost:3001";
    return [{ source: "/backend/:path*", destination: `${api}/api/v1/:path*` }];
  },
};

export default nextConfig;
