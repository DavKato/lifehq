"use client";

import { CheckSquare, Square, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";

type Member = { id: string; name: string; image: string | null };

type TaskRowProps = {
	task: {
		id: string;
		title: string;
		description: string | null;
		dueDate: string | null;
		completedAt: string | null;
		assignee: { id: string; name: string; image: string | null } | null;
		creator: { id: string; name: string } | null;
	};
	members: Member[];
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

const UNASSIGNED = "unassigned";

export function TaskRow({ task, members, onDelete }: TaskRowProps) {
	const dueDateClass = getDueDateClass(task.dueDate, task.completedAt);
	const utils = api.useUtils();
	const [expanded, setExpanded] = useState(false);
	const [description, setDescription] = useState(task.description ?? "");
	const descriptionRef = useRef<HTMLTextAreaElement>(null);

	const completeMutation = api.task.complete.useMutation({
		onSuccess: () => utils.task.list.invalidate(),
	});
	const uncompleteMutation = api.task.uncomplete.useMutation({
		onSuccess: () => utils.task.list.invalidate(),
	});
	const updateMutation = api.task.update.useMutation({
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

	function handleRowKeyDown(e: React.KeyboardEvent) {
		if (e.key === "Escape") {
			setExpanded(false);
		}
	}

	function handleTitleKeyDown(e: React.KeyboardEvent) {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			setExpanded((v) => !v);
		}
	}

	function handleDescriptionBlur() {
		const value = description.trim();
		const current = task.description ?? "";
		if (value !== current) {
			updateMutation.mutate({ id: task.id, description: value || null });
		}
	}

	function handleAssigneeChange(value: string) {
		const assignedTo = value === UNASSIGNED ? null : value;
		updateMutation.mutate({ id: task.id, assignedTo });
	}

	function handleDueDateSelect(value: string) {
		updateMutation.mutate({ id: task.id, dueDate: value || null });
	}

	const assigneeValue = task.assignee?.id ?? UNASSIGNED;

	return (
		<Card onKeyDown={handleRowKeyDown}>
			<CardContent className="p-4 space-y-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3 flex-1 min-w-0">
						<Button
							variant="ghost"
							size="icon"
							aria-pressed={isCompleted}
							aria-label={
								isCompleted
									? "Mark incomplete"
									: "Mark complete"
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
						<button
							type="button"
							aria-expanded={expanded}
							onClick={() => setExpanded((v) => !v)}
							onKeyDown={handleTitleKeyDown}
							className="flex-1 min-w-0 text-left cursor-pointer space-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
						>
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
						</button>
					</div>
					<Button
						variant="ghost"
						size="icon"
						aria-label="Delete task"
						onClick={() => onDelete(task.id)}
					>
						<Trash2 className="h-4 w-4 text-muted-foreground" />
					</Button>
				</div>

				{expanded && (
					<div className="pl-11 space-y-3">
						<textarea
							ref={descriptionRef}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							onBlur={handleDescriptionBlur}
							placeholder="Add a description…"
							rows={3}
							className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						/>
						<div className="flex items-center gap-3 flex-wrap">
							<Select
								value={assigneeValue}
								onValueChange={handleAssigneeChange}
							>
								<SelectTrigger className="w-44">
									<SelectValue placeholder="Assignee" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={UNASSIGNED}>
										Unassigned
									</SelectItem>
									{members.map((m) => (
										<SelectItem key={m.id} value={m.id}>
											{m.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<div className="w-48">
								<DatePicker
									key={task.dueDate ?? "none"}
									name="dueDate"
									defaultValue={task.dueDate ?? undefined}
									placeholder="Due date"
									onSelect={handleDueDateSelect}
								/>
							</div>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
