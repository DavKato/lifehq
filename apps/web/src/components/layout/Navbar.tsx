"use client";

import {
	CreditCard,
	Home,
	LayoutDashboard,
	LogOut,
	Moon,
	Sun,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

const navLinks = [
	{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/subscriptions", label: "Subscriptions", icon: CreditCard },
];

export function Navbar() {
	const pathname = usePathname();
	const router = useRouter();
	const { data: session } = authClient.useSession();
	const { theme, setTheme } = useTheme();

	const handleSignOut = async () => {
		await authClient.signOut();
		router.push("/login");
	};

	return (
		<header className="sticky top-0 z-50 border-b bg-background">
			<div className="container mx-auto flex h-14 items-center justify-between px-4">
				<div className="flex items-center gap-6">
					<Link
						href="/dashboard"
						className="flex items-center gap-2 font-semibold text-primary"
					>
						<Home className="h-5 w-5" />
						LifeHQ
					</Link>
					<nav className="flex items-center gap-1">
						{navLinks.map(({ href, label, icon: Icon }) => (
							<Link
								key={href}
								href={href}
								className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
									pathname === href
										? "bg-accent text-accent-foreground"
										: "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
								}`}
							>
								<Icon className="h-4 w-4" />
								{label}
							</Link>
						))}
					</nav>
				</div>
				<div className="flex items-center gap-3">
					{session?.user && (
						<span className="text-sm text-muted-foreground">
							{session.user.name || session.user.email}
						</span>
					)}
					<Button
						variant="ghost"
						size="icon"
						onClick={() =>
							setTheme(theme === "dark" ? "light" : "dark")
						}
						className="text-muted-foreground"
						aria-label="Toggle theme"
					>
						<Sun className="h-4 w-4 dark:hidden" />
						<Moon className="hidden h-4 w-4 dark:block" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={handleSignOut}
						className="gap-1.5 text-muted-foreground"
					>
						<LogOut className="h-4 w-4" />
						Sign out
					</Button>
				</div>
			</div>
		</header>
	);
}
