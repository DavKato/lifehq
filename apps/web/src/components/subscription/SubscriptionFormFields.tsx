import type { Category } from "@lifehq/shared/db/schema";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { SubItem } from "./types";

function PriceInput({
	id,
	name,
	defaultValue,
	placeholder,
}: {
	id: string;
	name: string;
	defaultValue?: string;
	placeholder?: string;
}) {
	return (
		<div className="flex items-center rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
			<span className="select-none pl-3 text-sm text-muted-foreground">
				$
			</span>
			<input
				id={id}
				name={name}
				type="number"
				step="0.01"
				min="0"
				defaultValue={defaultValue}
				placeholder={placeholder ?? "0.00"}
				required
				className="w-full bg-transparent py-2 pl-1 pr-3 text-sm outline-none"
			/>
		</div>
	);
}

type SubscriptionFormFieldsProps = {
	categories: Category[] | undefined;
	defaults?: Pick<
		SubItem,
		"name" | "price" | "billingCycle" | "renewalDate" | "categoryId"
	>;
	idPrefix?: string;
};

export function SubscriptionFormFields({
	categories,
	defaults,
	idPrefix = "",
}: SubscriptionFormFieldsProps) {
	const pre = idPrefix ? `${idPrefix}-` : "";
	return (
		<>
			<div className="space-y-2">
				<Label htmlFor={`${pre}name`}>Name</Label>
				<Input
					id={`${pre}name`}
					name="name"
					defaultValue={defaults?.name}
					placeholder="Netflix"
					required
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor={`${pre}price`}>Price</Label>
				<PriceInput
					id={`${pre}price`}
					name="price"
					defaultValue={
						defaults
							? parseFloat(defaults.price).toFixed(2)
							: undefined
					}
					placeholder="15.99"
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor={`${pre}billingCycle`}>Billing Cycle</Label>
				<Select
					name="billingCycle"
					defaultValue={defaults?.billingCycle ?? "monthly"}
				>
					<SelectTrigger>
						<SelectValue placeholder="Select cycle" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="monthly">Monthly</SelectItem>
						<SelectItem value="yearly">Yearly</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className="space-y-2">
				<Label>Next Renewal</Label>
				<DatePicker
					name="renewalDate"
					defaultValue={defaults?.renewalDate}
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor={`${pre}categoryId`}>Category</Label>
				<Select
					name="categoryId"
					defaultValue={defaults?.categoryId ?? ""}
				>
					<SelectTrigger>
						<SelectValue placeholder="Select category" />
					</SelectTrigger>
					<SelectContent>
						{categories?.map((cat) => (
							<SelectItem key={cat.id} value={cat.id}>
								{cat.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</>
	);
}
