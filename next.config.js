/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Keep heavy native-ish deps out of the bundle so the serverless function
    // loads them at runtime instead of webpack trying to bundle them.
    serverComponentsExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
    // @sparticuz/chromium loads its Chromium binary AND its shared-library
    // archives (al2023.tar.br → libnss3.so etc.) from disk at runtime via
    // constructed paths, so Next's static file tracing can't see them and
    // leaves them out of the serverless bundle. Force the whole package in,
    // or PDF rendering fails with "libnss3.so: cannot open shared object file".
    outputFileTracingIncludes: {
      "/api/generate": ["./node_modules/@sparticuz/chromium/**"],
    },
  },
};

module.exports = nextConfig;
