import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	async rewrites() {
		const apiBase = process.env.API_URL ?? "http://localhost:3001";
		return [
			{
				source: "/trpc/:path*",
				destination: `${apiBase}/trpc/:path*`,
			},
			{
				source: "/api/auth/:path*",
				destination: `${apiBase}/api/auth/:path*`,
			},
		];
	},
};

export default nextConfig;
