/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '50mb', // Adjust the limit as needed
        },
    },
};

export default nextConfig;
