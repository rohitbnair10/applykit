/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Keep heavy native-ish deps out of the bundle so the serverless function
    // loads them at runtime instead of webpack trying to bundle them.
    serverComponentsExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  },
};

module.exports = nextConfig;
