"use client";

import { LayoutList, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { AddSubscriptionDialog } from "./AddSubscriptionDialog";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { EditSubscriptionDialog } from "./EditSubscriptionDialog";
import { SubscriptionAnalytics } from "./SubscriptionAnalytics";
import { SubscriptionItem } from "./SubscriptionItem";
import { SubscriptionListSkeleton } from "./SubscriptionListSkeleton";
import type { SubItem } from "./types";

export function SubscriptionList() {
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [editingSub, setEditingSub] = useState<SubItem | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const subscriptionsQuery = api.subscription.list.useQuery();
	const categoriesQuery = api.subscription.categories.useQuery();
	const analyticsQuery = api.subscription.analytics.useQuery();

	if (subscriptionsQuery.isLoading) {
		return <SubscriptionListSkeleton />;
	}

	const subscriptions = subscriptionsQuery.data;
	const categories = categoriesQuery.data;
	const analytics = analyticsQuery.data;

	return (
		<>
			<EditSubscriptionDialog
				sub={editingSub}
				onClose={() => setEditingSub(null)}
				categories={categories}
			/>
			<DeleteConfirmationDialog
				id={deletingId}
				onClose={() => setDeletingId(null)}
			/>

			<div className="space-y-6">
				<SubscriptionAnalytics
					analytics={analytics}
					count={subscriptions?.length ?? 0}
				/>

				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold">
						Your Subscriptions
					</h2>
					<AddSubscriptionDialog
						open={isAddOpen}
						onOpenChange={setIsAddOpen}
						categories={categories}
					/>
				</div>

				<div className="space-y-4">
					{subscriptions?.map((sub) => (
						<SubscriptionItem
							key={sub.id}
							sub={sub as SubItem}
							onEdit={setEditingSub}
							onDelete={setDeletingId}
						/>
					))}
					{subscriptions?.length === 0 && (
						<Card>
							<CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
								<LayoutList className="h-10 w-10 text-muted-foreground" />
								<div>
									<p className="font-medium text-muted-foreground">
										No subscriptions yet
									</p>
									<p className="text-sm text-muted-foreground">
										Add your first subscription to start
										tracking your spending
									</p>
								</div>
								<Button onClick={() => setIsAddOpen(true)}>
									<Plus className="mr-2 h-4 w-4" />
									Add Subscription
								</Button>
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</>
	);
}
