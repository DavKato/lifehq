import { Card, CardContent } from "@/components/ui/card";

type TaskRowProps = {
	task: {
		id: string;
		title: string;
		dueDate: string | null;
		completedAt: string | null;
		assignee: { id: string; name: string; image: string | null } | null;
		creator: { id: string; name: string } | null;
	};
};

export function TaskRow({ task }: TaskRowProps) {
	return (
		<Card>
			<CardContent className="flex items-center justify-between p-4">
				<div className="space-y-0.5">
					<p className="font-medium">{task.title}</p>
					<div className="flex items-center gap-3 text-sm text-muted-foreground">
						{task.assignee && <span>{task.assignee.name}</span>}
						{task.dueDate && (
							<span>
								Due:{" "}
								{new Date(task.dueDate).toLocaleDateString()}
							</span>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
