/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
        ]
      }
    ]
  },
  images: {
    domains: [
      "lh3.googleusercontent.com",
      // add any other domains you need here
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'foodloft-images-123.s3.ap-southeast-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Disable React StrictMode in development for better 3D performance
  reactStrictMode: process.env.NODE_ENV === 'production',
  env: {
    JWT_SECRET: process.env.JWT_SECRET,
  },
  // Webpack optimizations for Three.js
  webpack: (config, { dev, isServer }) => {
    if (!isServer && !dev) {
      // Production optimizations
      config.optimization.splitChunks.cacheGroups.three = {
        test: /[\\/]node_modules[\\/]three[\\/]/,
        name: 'three',
        chunks: 'all',
        priority: 10,
      };
    }
    
    return config;
  },
};

export default nextConfig;
  