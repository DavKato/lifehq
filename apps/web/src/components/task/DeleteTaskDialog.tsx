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

type DeleteTaskDialogProps = {
	id: string | null;
	onClose: () => void;
};

export function DeleteTaskDialog({ id, onClose }: DeleteTaskDialogProps) {
	const utils = api.useUtils();

	const deleteMutation = api.task.delete.useMutation({
		onSuccess: () => {
			onClose();
			utils.task.list.invalidate();
			toast.success("Task deleted");
		},
		onError: (err) => {
			toast.error(`Failed to delete task: ${err.message}`);
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
					<DialogTitle>Delete task?</DialogTitle>
					<DialogDescription>
						This will remove the task. This action cannot be undone.
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
