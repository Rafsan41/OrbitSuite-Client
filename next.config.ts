import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        // The navbar logo is served from Cloudinary. next/image refuses remote
        // hosts unless they are listed here — otherwise any URL in a prop
        // becomes an open image-resizing proxy running on our origin.
        remotePatterns: [
            {
                protocol: "https",
                hostname: "res.cloudinary.com",
                pathname: "/drebyi1rz/**",
            },
        ],
    },
};

export default nextConfig;
