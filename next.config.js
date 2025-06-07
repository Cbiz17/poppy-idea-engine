/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    clientTraceMetadata: ["baggage", "sentry-trace"],
  },
}

module.exports = nextConfig
