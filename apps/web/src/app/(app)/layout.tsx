import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";

export default async function AppLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const apiBase = process.env.API_URL ?? "http://localhost:3001";
	const cookieHeader = (await headers()).get("cookie") ?? "";

	let isAuthenticated = false;
	try {
		const res = await fetch(`${apiBase}/api/auth/get-session`, {
			headers: { cookie: cookieHeader },
		});
		const data = await res.json();
		isAuthenticated = !!data?.session;
	} catch {
		// API unreachable — treat as unauthenticated
	}

	if (!isAuthenticated) redirect("/login");

	return (
		<div className="flex min-h-screen flex-col">
			<Navbar />
			<main className="flex-1">{children}</main>
		</div>
	);
}
