import { DollarSign, LayoutList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AnalyticsData = {
	totalMonthly: number;
	totalYearly: number;
};

type SubscriptionAnalyticsProps = {
	analytics: AnalyticsData | undefined;
	count: number;
};

export function SubscriptionAnalytics({
	analytics,
	count,
}: SubscriptionAnalyticsProps) {
	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Monthly Spending
					</CardTitle>
					<DollarSign className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">
						${analytics?.totalMonthly.toFixed(2) ?? "0.00"}
					</div>
					<p className="text-xs text-muted-foreground">per month</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Yearly Spending
					</CardTitle>
					<DollarSign className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">
						${analytics?.totalYearly.toFixed(2) ?? "0.00"}
					</div>
					<p className="text-xs text-muted-foreground">per year</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Active Subscriptions
					</CardTitle>
					<LayoutList className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{count}</div>
					<p className="text-xs text-muted-foreground">
						subscriptions tracked
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
