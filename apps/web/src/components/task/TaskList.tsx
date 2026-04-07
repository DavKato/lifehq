"use client";

import { CheckSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { DeleteTaskDialog } from "./DeleteTaskDialog";
import { TaskRow } from "./TaskRow";

export function TaskList() {
	const [title, setTitle] = useState("");
	const [page, setPage] = useState(1);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const tasksQuery = api.task.list.useQuery({ page });
	const utils = api.useUtils();

	const createMutation = api.task.create.useMutation({
		onSuccess: () => {
			utils.task.list.invalidate();
			setTitle("");
			inputRef.current?.focus();
		},
	});

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter" && title.trim()) {
			createMutation.mutate({ title: title.trim() });
		}
	}

	const taskList = tasksQuery.data?.tasks ?? [];
	const totalPages = tasksQuery.data?.totalPages ?? 1;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold">Tasks</h1>
			</div>

			<Input
				ref={inputRef}
				placeholder="Add a task… press Enter to create"
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				onKeyDown={handleKeyDown}
				disabled={createMutation.isPending}
				autoFocus
			/>

			<div className="space-y-2">
				{tasksQuery.isLoading && (
					<p className="text-sm text-muted-foreground">Loading…</p>
				)}

				{!tasksQuery.isLoading && taskList.length === 0 && (
					<Card>
						<CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
							<CheckSquare className="h-10 w-10 text-muted-foreground" />
							<div>
								<p className="font-medium text-muted-foreground">
									No tasks yet
								</p>
								<p className="text-sm text-muted-foreground">
									Type a task above and press Enter to get
									started
								</p>
							</div>
						</CardContent>
					</Card>
				)}

				{taskList.map((task) => (
					<TaskRow key={task.id} task={task} onDelete={setDeleteId} />
				))}
			</div>

			{totalPages > 1 && (
				<div className="flex items-center justify-center gap-4">
					<Button
						variant="outline"
						size="icon"
						disabled={page <= 1}
						onClick={() => setPage((p) => p - 1)}
						aria-label="Previous page"
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<span className="text-sm text-muted-foreground">
						Page {page} of {totalPages}
					</span>
					<Button
						variant="outline"
						size="icon"
						disabled={page >= totalPages}
						onClick={() => setPage((p) => p + 1)}
						aria-label="Next page"
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			)}

			<DeleteTaskDialog id={deleteId} onClose={() => setDeleteId(null)} />
		</div>
	);
}
