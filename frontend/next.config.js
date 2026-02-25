// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
