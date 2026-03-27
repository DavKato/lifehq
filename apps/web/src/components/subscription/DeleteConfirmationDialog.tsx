"use client";

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

type DeleteConfirmationDialogProps = {
	id: string | null;
	onClose: () => void;
};

export function DeleteConfirmationDialog({
	id,
	onClose,
}: DeleteConfirmationDialogProps) {
	const utils = api.useUtils();

	const deleteMutation = api.subscription.delete.useMutation({
		onSuccess: () => {
			onClose();
			utils.subscription.list.invalidate();
			utils.subscription.analytics.invalidate();
			toast.success("Subscription deleted");
		},
		onError: (err) => {
			toast.error(`Failed to delete subscription: ${err.message}`);
		},
	});

	return (
		<Dialog
			open={!!id}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete subscription?</DialogTitle>
					<DialogDescription>
						This will permanently remove the subscription. This
						action cannot be undone.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button
						variant="destructive"
						disabled={deleteMutation.isPending}
						onClick={() => {
							if (id) deleteMutation.mutate({ id });
						}}
					>
						{deleteMutation.isPending ? "Deleting..." : "Delete"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
