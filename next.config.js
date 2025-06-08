/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    clientTraceMetadata: ["baggage", "sentry-trace"],
  },
}

module.exports = nextConfig
