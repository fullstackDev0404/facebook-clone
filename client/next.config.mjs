/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Private-Network',
            value: 'true',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
