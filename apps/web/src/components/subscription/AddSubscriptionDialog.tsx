"use client";

import type { Category } from "@lifehq/shared/db/schema";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { SubscriptionFormFields } from "./SubscriptionFormFields";

type AddSubscriptionDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	categories: Category[] | undefined;
};

export function AddSubscriptionDialog({
	open,
	onOpenChange,
	categories,
}: AddSubscriptionDialogProps) {
	const utils = api.useUtils();

	const createMutation = api.subscription.create.useMutation({
		onSuccess: () => {
			onOpenChange(false);
			utils.subscription.list.invalidate();
			utils.subscription.analytics.invalidate();
			toast.success("Subscription added");
		},
		onError: (err) => {
			toast.error(`Failed to add subscription: ${err.message}`);
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>
				<Button>
					<Plus className="mr-2 h-4 w-4" />
					Add Subscription
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add Subscription</DialogTitle>
					<DialogDescription>
						Track a new recurring subscription and its renewal date.
					</DialogDescription>
				</DialogHeader>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						const formData = new FormData(e.currentTarget);
						createMutation.mutate({
							name: formData.get("name") as string,
							price: parseFloat(formData.get("price") as string),
							billingCycle: formData.get("billingCycle") as
								| "monthly"
								| "yearly",
							renewalDate: formData.get("renewalDate") as string,
							categoryId:
								(formData.get("categoryId") as string) ||
								undefined,
						});
					}}
					className="space-y-4"
				>
					<SubscriptionFormFields categories={categories} />
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={createMutation.isPending}
						>
							{createMutation.isPending
								? "Adding..."
								: "Add Subscription"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
