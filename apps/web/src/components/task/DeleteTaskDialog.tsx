import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

type DeleteTaskDialogProps = {
	id: string | null;
	isPending: boolean;
	onConfirm: () => void;
	onClose: () => void;
};

export function DeleteTaskDialog({
	id,
	isPending,
	onConfirm,
	onClose,
}: DeleteTaskDialogProps) {
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
						disabled={isPending}
						onClick={onConfirm}
					>
						{isPending ? "Deleting..." : "Delete"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
