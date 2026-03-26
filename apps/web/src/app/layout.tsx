import type { Metadata } from "next";
import { TRPCProvider } from "@/lib/trpc";
import "./globals.css";

export const metadata: Metadata = {
	title: "LifeHQ",
	description: "Household management platform",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className="antialiased">
				<TRPCProvider>{children}</TRPCProvider>
			</body>
		</html>
	);
}
