import { CheckSquare, CreditCard, FileText } from "lucide-react";
import Link from "next/link";

function ComingSoonBadge() {
	return (
		<span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
			Coming soon
		</span>
	);
}

export default function DashboardPage() {
	return (
		<div className="container mx-auto py-8">
			<h1 className="mb-8 text-3xl font-bold">Dashboard</h1>
			<div className="grid gap-6 md:grid-cols-3">
				<Link href="/subscriptions">
					<div className="rounded-lg border bg-card p-6 shadow-sm transition-colors hover:bg-accent">
						<CreditCard className="mb-4 h-10 w-10 text-primary" />
						<h2 className="mb-2 text-xl font-semibold">
							Subscriptions
						</h2>
						<p className="text-sm text-muted-foreground">
							Track and manage your recurring subscriptions
						</p>
					</div>
				</Link>
				<div className="cursor-not-allowed rounded-lg border bg-muted/40 p-6 opacity-60 shadow-sm">
					<div className="mb-4 flex items-start justify-between">
						<FileText className="h-10 w-10 text-muted-foreground" />
						<ComingSoonBadge />
					</div>
					<h2 className="mb-2 text-xl font-semibold text-muted-foreground">
						Documents
					</h2>
					<p className="text-sm text-muted-foreground">
						Store household documents securely
					</p>
				</div>
				<div className="cursor-not-allowed rounded-lg border bg-muted/40 p-6 opacity-60 shadow-sm">
					<div className="mb-4 flex items-start justify-between">
						<CheckSquare className="h-10 w-10 text-muted-foreground" />
						<ComingSoonBadge />
					</div>
					<h2 className="mb-2 text-xl font-semibold text-muted-foreground">
						Tasks
					</h2>
					<p className="text-sm text-muted-foreground">
						Manage household tasks and chores
					</p>
				</div>
			</div>
		</div>
	);
}
