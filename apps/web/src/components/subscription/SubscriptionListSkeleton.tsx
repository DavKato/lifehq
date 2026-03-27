import { Card, CardContent, CardHeader } from "@/components/ui/card";

function SkeletonCard() {
	return (
		<Card>
			<CardContent className="flex items-center justify-between p-4">
				<div className="space-y-2">
					<div className="h-4 w-32 rounded bg-muted animate-pulse" />
					<div className="h-3 w-48 rounded bg-muted animate-pulse" />
				</div>
				<div className="h-6 w-16 rounded bg-muted animate-pulse" />
			</CardContent>
		</Card>
	);
}

export function SubscriptionListSkeleton() {
	return (
		<div className="space-y-6">
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{[0, 1, 2].map((i) => (
					<Card key={i}>
						<CardHeader className="pb-2">
							<div className="h-3 w-28 rounded bg-muted animate-pulse" />
						</CardHeader>
						<CardContent>
							<div className="h-8 w-20 rounded bg-muted animate-pulse" />
						</CardContent>
					</Card>
				))}
			</div>
			<div className="space-y-4">
				{[0, 1, 2].map((i) => (
					<SkeletonCard key={i} />
				))}
			</div>
		</div>
	);
}
