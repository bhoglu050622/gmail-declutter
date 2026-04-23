import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["p-queue", "p-retry", "nanoid"],
  serverExternalPackages: ["better-sqlite3", "imapflow", "nodemailer"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
