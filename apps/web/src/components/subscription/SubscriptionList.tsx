"use client";

import type { Category } from "@lifehq/shared/db/schema";
import { DollarSign, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";

export function SubscriptionList() {
	const [isOpen, setIsOpen] = useState(false);

	const subscriptionsQuery = api.subscription.list.useQuery();
	const categoriesQuery = api.subscription.categories.useQuery();
	const analyticsQuery = api.subscription.analytics.useQuery();

	const utils = api.useUtils();

	const createMutation = api.subscription.create.useMutation({
		onSuccess: () => {
			setIsOpen(false);
			utils.subscription.list.invalidate();
			utils.subscription.analytics.invalidate();
		},
	});

	const deleteMutation = api.subscription.delete.useMutation({
		onSuccess: () => {
			utils.subscription.list.invalidate();
			utils.subscription.analytics.invalidate();
		},
	});

	const subscriptions = subscriptionsQuery.data;
	const categories = categoriesQuery.data;
	const analytics = analyticsQuery.data;
	const isLoading = subscriptionsQuery.isLoading;

	if (isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="space-y-6">
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
						<p className="text-xs text-muted-foreground">
							per month
						</p>
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
						<p className="text-xs text-muted-foreground">
							per year
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Active Subscriptions
						</CardTitle>
						<Plus className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{subscriptions?.length ?? 0}
						</div>
						<p className="text-xs text-muted-foreground">
							subscriptions tracked
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold">Your Subscriptions</h2>
				<Dialog open={isOpen} onOpenChange={setIsOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Add Subscription
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Add Subscription</DialogTitle>
						</DialogHeader>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								const formData = new FormData(e.currentTarget);
								createMutation.mutate({
									name: formData.get("name") as string,
									price: parseFloat(
										formData.get("price") as string,
									),
									billingCycle: formData.get(
										"billingCycle",
									) as "monthly" | "yearly",
									renewalDate: formData.get(
										"renewalDate",
									) as string,
									categoryId:
										(formData.get(
											"categoryId",
										) as string) || undefined,
								});
							}}
							className="space-y-4"
						>
							<div className="space-y-2">
								<Label htmlFor="name">Name</Label>
								<Input
									id="name"
									name="name"
									placeholder="Netflix"
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="price">Price</Label>
								<Input
									id="price"
									name="price"
									type="number"
									step="0.01"
									placeholder="15.99"
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="billingCycle">
									Billing Cycle
								</Label>
								<Select
									name="billingCycle"
									defaultValue="monthly"
								>
									<SelectTrigger>
										<SelectValue placeholder="Select cycle" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="monthly">
											Monthly
										</SelectItem>
										<SelectItem value="yearly">
											Yearly
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="renewalDate">
									Next Renewal
								</Label>
								<Input
									id="renewalDate"
									name="renewalDate"
									type="date"
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="categoryId">Category</Label>
								<Select name="categoryId">
									<SelectTrigger>
										<SelectValue placeholder="Select category" />
									</SelectTrigger>
									<SelectContent>
										{categories?.map((cat: Category) => (
											<SelectItem
												key={cat.id}
												value={cat.id}
											>
												{cat.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<Button
								type="submit"
								className="w-full"
								disabled={createMutation.isPending}
							>
								{createMutation.isPending
									? "Adding..."
									: "Add Subscription"}
							</Button>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			<div className="space-y-4">
				{subscriptions?.map(
					(
						sub: typeof subscriptionsQuery.data extends infer T
							? T extends (infer U)[]
								? U
								: never
							: never,
					) => (
						<Card key={sub.id}>
							<CardContent className="flex items-center justify-between p-4">
								<div className="space-y-1">
									<p className="font-medium">{sub.name}</p>
									<div className="flex items-center gap-4 text-sm text-muted-foreground">
										<span>
											{sub.category?.name ??
												"Uncategorized"}
										</span>
										<span>{sub.billingCycle}</span>
										<span>
											Renews:{" "}
											{new Date(
												sub.renewalDate,
											).toLocaleDateString()}
										</span>
									</div>
								</div>
								<div className="flex items-center gap-4">
									<div className="text-right">
										<p className="text-lg font-semibold">
											${parseFloat(sub.price).toFixed(2)}
										</p>
										<p className="text-xs text-muted-foreground">
											/{sub.billingCycle}
										</p>
									</div>
									<Button
										variant="ghost"
										size="icon"
										onClick={() =>
											deleteMutation.mutate({
												id: sub.id,
											})
										}
										disabled={deleteMutation.isPending}
									>
										<Trash2 className="h-4 w-4 text-destructive" />
									</Button>
								</div>
							</CardContent>
						</Card>
					),
				)}
				{subscriptions?.length === 0 && (
					<Card>
						<CardContent className="flex flex-col items-center justify-center py-8 text-center">
							<p className="text-muted-foreground">
								No subscriptions yet
							</p>
							<p className="text-sm text-muted-foreground">
								Add your first subscription to get started
							</p>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
