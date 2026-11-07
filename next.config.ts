import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // The E2E server gets its own output folder, since `next dev` locks its folder and a `pnpm dev`
  // may already be running
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  reactCompiler: true,
  serverExternalPackages: ['xlsx'],
  experimental: {
    serverActions: {
      // Secullum reports can exceed the default limit of 1 MB
      bodySizeLimit: '10mb'
    }
  }
}

export default nextConfig
