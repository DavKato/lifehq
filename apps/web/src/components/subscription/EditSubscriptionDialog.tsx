"use client";

import type { Category } from "@lifehq/shared/db/schema";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { SubscriptionFormFields } from "./SubscriptionFormFields";
import type { SubItem } from "./types";

type EditSubscriptionDialogProps = {
	sub: SubItem | null;
	onClose: () => void;
	categories: Category[] | undefined;
};

export function EditSubscriptionDialog({
	sub,
	onClose,
	categories,
}: EditSubscriptionDialogProps) {
	const utils = api.useUtils();

	const updateMutation = api.subscription.update.useMutation({
		onSuccess: () => {
			onClose();
			utils.subscription.list.invalidate();
			utils.subscription.analytics.invalidate();
			toast.success("Subscription updated");
		},
		onError: (err) => {
			toast.error(`Failed to update subscription: ${err.message}`);
		},
	});

	return (
		<Dialog
			open={!!sub}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Subscription</DialogTitle>
					<DialogDescription>
						Update the details or renewal date for this
						subscription.
					</DialogDescription>
				</DialogHeader>
				{sub && (
					<form
						onSubmit={(e) => {
							e.preventDefault();
							const formData = new FormData(e.currentTarget);
							const categoryId = formData.get(
								"categoryId",
							) as string;
							updateMutation.mutate({
								id: sub.id,
								data: {
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
									categoryId: categoryId || undefined,
								},
							});
						}}
						className="space-y-4"
					>
						<SubscriptionFormFields
							categories={categories}
							defaults={sub}
							idPrefix="edit"
						/>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={onClose}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={updateMutation.isPending}
							>
								{updateMutation.isPending
									? "Saving..."
									: "Save Changes"}
							</Button>
						</DialogFooter>
					</form>
				)}
			</DialogContent>
		</Dialog>
	);
}
