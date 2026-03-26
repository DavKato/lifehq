import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
	return (
		<div className="flex min-h-screen flex-col">
			<header className="border-b">
				<div className="container flex h-16 items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="text-xl font-bold">LifeHQ</span>
					</div>
					<nav className="flex items-center gap-4">
						<Link href="/dashboard">
							<Button variant="ghost">Dashboard</Button>
						</Link>
						<Link href="/login">
							<Button>Sign In</Button>
						</Link>
					</nav>
				</div>
			</header>
			<main className="flex-1">
				<section className="py-24">
					<div className="container">
						<div className="mx-auto max-w-3xl text-center">
							<h1 className="mb-6 text-5xl font-bold tracking-tight">
								Manage your household in one place
							</h1>
							<p className="mb-8 text-xl text-muted-foreground">
								Track subscriptions, store documents, and
								organize tasks with your household.
							</p>
							<div className="flex justify-center gap-4">
								<Button size="lg" asChild>
									<Link href="/dashboard">
										Go to Dashboard
									</Link>
								</Button>
								<Button size="lg" variant="outline" asChild>
									<Link href="/login">Sign In</Link>
								</Button>
							</div>
						</div>
					</div>
				</section>
				<section className="py-16">
					<div className="container">
						<div className="grid gap-8 md:grid-cols-3">
							<Card>
								<CardHeader>
									<CardTitle>Subscription Tracker</CardTitle>
									<CardDescription>
										Track all your recurring subscriptions
										and see where your money goes
									</CardDescription>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground">
										Monthly and yearly spending analytics by
										category
									</p>
								</CardContent>
							</Card>
							<Card>
								<CardHeader>
									<CardTitle>Document Vault</CardTitle>
									<CardDescription>
										Securely store household documents in
										the cloud
									</CardDescription>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground">
										Insurance, passports, tax documents -
										all in one place
									</p>
								</CardContent>
							</Card>
							<Card>
								<CardHeader>
									<CardTitle>Shared Tasks</CardTitle>
									<CardDescription>
										Collaborate on household tasks with
										family members
									</CardDescription>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground">
										Create, assign, and track tasks with due
										dates
									</p>
								</CardContent>
							</Card>
						</div>
					</div>
				</section>
			</main>
			<footer className="border-t py-8">
				<div className="container text-center text-sm text-muted-foreground">
					LifeHQ - Household Management Platform
				</div>
			</footer>
		</div>
	);
}
