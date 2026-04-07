"use client";

import { CheckSquare, Square, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";

type TaskRowProps = {
	task: {
		id: string;
		title: string;
		dueDate: string | null;
		completedAt: string | null;
		assignee: { id: string; name: string; image: string | null } | null;
		creator: { id: string; name: string } | null;
	};
	onDelete: (id: string) => void;
};

function getDueDateClass(
	dueDate: string | null,
	completedAt: string | null,
): string {
	if (!dueDate || completedAt) return "text-muted-foreground";

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);

	// Parse as local date to avoid timezone shifting
	const [year, month, day] = dueDate.split("-").map(Number);
	const due = new Date(year, month - 1, day);

	if (due < today) return "text-red-500";
	if (due <= tomorrow) return "text-amber-500";
	return "text-muted-foreground";
}

export function TaskRow({ task, onDelete }: TaskRowProps) {
	const dueDateClass = getDueDateClass(task.dueDate, task.completedAt);
	const utils = api.useUtils();

	const completeMutation = api.task.complete.useMutation({
		onSuccess: () => utils.task.list.invalidate(),
	});
	const uncompleteMutation = api.task.uncomplete.useMutation({
		onSuccess: () => utils.task.list.invalidate(),
	});

	const isCompleted = !!task.completedAt;
	const isPending =
		completeMutation.isPending || uncompleteMutation.isPending;

	function handleToggle() {
		if (isCompleted) {
			uncompleteMutation.mutate({ id: task.id });
		} else {
			completeMutation.mutate({ id: task.id });
		}
	}

	return (
		<Card>
			<CardContent className="flex items-center justify-between p-4">
				<div className="flex items-center gap-3">
					<Button
						variant="ghost"
						size="icon"
						aria-pressed={isCompleted}
						aria-label={
							isCompleted ? "Mark incomplete" : "Mark complete"
						}
						disabled={isPending}
						onClick={handleToggle}
						className="shrink-0"
					>
						{isCompleted ? (
							<CheckSquare className="h-5 w-5 text-primary" />
						) : (
							<Square className="h-5 w-5 text-muted-foreground" />
						)}
					</Button>
					<div className="space-y-0.5">
						<p
							className={`font-medium ${isCompleted ? "line-through text-muted-foreground" : ""}`}
						>
							{task.title}
						</p>
						<div className="flex items-center gap-3 text-sm">
							{task.assignee && (
								<span className="text-muted-foreground">
									{task.assignee.name}
								</span>
							)}
							{task.dueDate && (
								<span className={dueDateClass}>
									Due:{" "}
									{new Date(
										`${task.dueDate}T00:00:00`,
									).toLocaleDateString()}
								</span>
							)}
						</div>
					</div>
				</div>
				<Button
					variant="ghost"
					size="icon"
					aria-label="Delete task"
					onClick={() => onDelete(task.id)}
				>
					<Trash2 className="h-4 w-4 text-muted-foreground" />
				</Button>
			</CardContent>
		</Card>
	);
}
