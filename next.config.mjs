/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '500mb', // Adjust the limit as needed
        },
    },
};

export default nextConfig;
