import type { Metadata } from "next";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
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
		<html lang="en" suppressHydrationWarning>
			<body className="antialiased">
				<ThemeProvider>
					<TRPCProvider>{children}</TRPCProvider>
					<Toaster richColors position="top-right" />
				</ThemeProvider>
			</body>
		</html>
	);
}
