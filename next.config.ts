import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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
