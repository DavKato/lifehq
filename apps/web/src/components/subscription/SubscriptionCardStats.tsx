"use client";

import { api } from "@/lib/api";

export function SubscriptionCardStats() {
	const analyticsQuery = api.subscription.analytics.useQuery();
	const listQuery = api.subscription.list.useQuery();

	if (analyticsQuery.isLoading || listQuery.isLoading) {
		return (
			<div className="mt-3 space-y-1">
				<div className="h-3 w-24 rounded bg-muted animate-pulse" />
				<div className="h-3 w-16 rounded bg-muted animate-pulse" />
			</div>
		);
	}

	const monthly = analyticsQuery.data?.totalMonthly ?? 0;
	const count = listQuery.data?.length ?? 0;

	return (
		<p className="mt-3 text-sm font-medium">
			${monthly.toFixed(2)} / mo &middot; {count} active
		</p>
	);
}
