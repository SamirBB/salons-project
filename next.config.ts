import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  /** Ne bundlati pdfkit — inače __dirname pokazuje na /ROOT/… i nedostaju Helvetica.afm itd. */
  serverExternalPackages: ["pdfkit"],
  // Server Actions (npr. upload slike klijenta) — default je 1 MB
  experimental: {
    serverActions: {
      bodySizeLimit: "3mb",
    },
  },
};

export default withNextIntl(nextConfig);
