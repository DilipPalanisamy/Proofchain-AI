/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {

    unoptimized: true,
  },
  // If deployed under subpath on GitHub Pages:
  basePath: isProd ? '/Proofchain-AI' : '',
  assetPrefix: isProd ? '/Proofchain-AI/' : '',
};

module.exports = nextConfig;
