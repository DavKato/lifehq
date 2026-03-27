import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { SubItem } from "./types";

type SubscriptionItemProps = {
	sub: SubItem;
	onEdit: (sub: SubItem) => void;
	onDelete: (id: string) => void;
};

export function SubscriptionItem({
	sub,
	onEdit,
	onDelete,
}: SubscriptionItemProps) {
	return (
		<Card>
			<CardContent className="flex items-center justify-between p-4">
				<div className="space-y-1">
					<p className="font-medium">{sub.name}</p>
					<div className="flex items-center gap-4 text-sm text-muted-foreground">
						<span>{sub.category?.name ?? "Uncategorized"}</span>
						<span>{sub.billingCycle}</span>
						<span>
							Renews:{" "}
							{new Date(sub.renewalDate).toLocaleDateString()}
						</span>
					</div>
				</div>
				<div className="flex items-center gap-4">
					<div className="text-right">
						<p className="text-lg font-semibold">
							${parseFloat(sub.price).toFixed(2)}
						</p>
						<p className="text-xs text-muted-foreground">
							/{sub.billingCycle}
						</p>
					</div>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => onEdit(sub)}
					>
						<Pencil className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => onDelete(sub.id)}
					>
						<Trash2 className="h-4 w-4 text-destructive" />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
