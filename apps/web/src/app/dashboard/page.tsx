import { CheckSquare, CreditCard, FileText } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
	return (
		<div className="container mx-auto py-8">
			<h1 className="mb-8 text-3xl font-bold">Dashboard</h1>
			<div className="grid gap-6 md:grid-cols-3">
				<Link href="/dashboard/subscriptions">
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
				<div className="rounded-lg border bg-card p-6 shadow-sm">
					<FileText className="mb-4 h-10 w-10 text-muted-foreground" />
					<h2 className="mb-2 text-xl font-semibold">Documents</h2>
					<p className="text-sm text-muted-foreground">
						Coming soon - Store household documents securely
					</p>
				</div>
				<div className="rounded-lg border bg-card p-6 shadow-sm">
					<CheckSquare className="mb-4 h-10 w-10 text-muted-foreground" />
					<h2 className="mb-2 text-xl font-semibold">Tasks</h2>
					<p className="text-sm text-muted-foreground">
						Coming soon - Manage household tasks
					</p>
				</div>
			</div>
		</div>
	);
}
