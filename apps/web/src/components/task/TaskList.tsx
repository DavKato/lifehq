"use client";

import { CheckSquare, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { DeleteTaskDialog } from "./DeleteTaskDialog";
import { TaskRow } from "./TaskRow";

const ALL_ASSIGNEES = "__all__";
const UNASSIGNED = "unassigned";
const ALL_STATUSES = "__all__";

export function TaskList() {
	const { data: session, isPending: sessionPending } =
		authClient.useSession();
	const currentUserId = session?.user?.id;

	const [title, setTitle] = useState("");
	const [page, setPage] = useState(1);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	// null = user hasn't made an explicit selection yet; derive the default
	// from the session once it resolves.
	const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
	const [statusFilter, setStatusFilter] = useState<string>("incomplete");

	const inputRef = useRef<HTMLInputElement>(null);

	const membersQuery = api.household.members.useQuery();
	const members = membersQuery.data ?? [];

	// Derive the effective filter at render time — no effect needed.
	// null (no explicit choice) → default to current user → fall back to ALL_ASSIGNEES.
	const effectiveAssigneeFilter =
		assigneeFilter ?? currentUserId ?? ALL_ASSIGNEES;

	// Build query input from filter state
	const assigneeId =
		effectiveAssigneeFilter === ALL_ASSIGNEES
			? undefined
			: effectiveAssigneeFilter;
	const status =
		statusFilter === ALL_STATUSES
			? undefined
			: (statusFilter as "incomplete" | "completed");

	// Do not fetch tasks until the session has resolved so the first request
	// already carries the correct assignee filter (avoids a flash of all tasks).
	const tasksQuery = api.task.list.useQuery(
		{ page, assigneeId, status },
		{ enabled: !sessionPending },
	);
	const utils = api.useUtils();

	const createMutation = api.task.create.useMutation({
		onSuccess: () => {
			utils.task.list.invalidate();
			setTitle("");
			inputRef.current?.focus();
		},
	});

	const deleteMutation = api.task.delete.useMutation({
		onSuccess: () => {
			setDeleteId(null);
			utils.task.list.invalidate();
			toast.success("Task deleted");
		},
		onError: (err) => {
			toast.error(`Failed to delete task: ${err.message}`);
		},
	});

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter" && title.trim()) {
			createMutation.mutate({ title: title.trim() });
		}
	}

	function handleAssigneeChange(value: string) {
		setAssigneeFilter(value);
		setPage(1);
	}

	function handleStatusChange(value: string) {
		setStatusFilter(value);
		setPage(1);
	}

	function clearFilters() {
		setAssigneeFilter(currentUserId ?? ALL_ASSIGNEES);
		setStatusFilter(ALL_STATUSES);
		setPage(1);
	}

	const isFiltered =
		effectiveAssigneeFilter !== ALL_ASSIGNEES ||
		statusFilter !== ALL_STATUSES;

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

			<div className="flex items-center gap-2 flex-wrap">
				<Select
					value={effectiveAssigneeFilter}
					onValueChange={handleAssigneeChange}
					disabled={sessionPending}
				>
					<SelectTrigger className="w-44">
						<SelectValue placeholder="Assignee" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL_ASSIGNEES}>
							All assignees
						</SelectItem>
						<SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
						{members.map((m) => (
							<SelectItem key={m.id} value={m.id}>
								{m.id === currentUserId
									? `${m.name} (me)`
									: m.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select value={statusFilter} onValueChange={handleStatusChange}>
					<SelectTrigger className="w-36">
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL_STATUSES}>
							All statuses
						</SelectItem>
						<SelectItem value="incomplete">Incomplete</SelectItem>
						<SelectItem value="completed">Completed</SelectItem>
					</SelectContent>
				</Select>

				{isFiltered && (
					<Button variant="ghost" size="sm" onClick={clearFilters}>
						<X className="h-4 w-4 mr-1" />
						Clear filters
					</Button>
				)}
			</div>

			<div className="space-y-2">
				{(sessionPending || tasksQuery.isLoading) && (
					<p className="text-sm text-muted-foreground">Loading…</p>
				)}

				{!sessionPending &&
					!tasksQuery.isLoading &&
					taskList.length === 0 && (
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
					<TaskRow
						key={task.id}
						task={task}
						members={members}
						onDelete={setDeleteId}
						onDirectDelete={(id) => deleteMutation.mutate({ id })}
					/>
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

			<DeleteTaskDialog
				id={deleteId}
				isPending={deleteMutation.isPending}
				onConfirm={() => {
					if (deleteId) deleteMutation.mutate({ id: deleteId });
				}}
				onClose={() => setDeleteId(null)}
			/>
		</div>
	);
}
